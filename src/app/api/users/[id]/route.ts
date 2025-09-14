import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET /api/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        role: true,
        nfcCode: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { name, pin, role, nfcCode, isActive } = await request.json()

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true }
    })
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Validate required fields
    if (!name || !role) {
      return NextResponse.json(
        { error: 'Name and role are required' }, 
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['ADMIN', 'MANAGER', 'CASHIER']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be ADMIN, MANAGER, or CASHIER' }, 
        { status: 400 }
      )
    }

    let hashedPin = undefined
    
    // If PIN is being updated, validate and hash it
    if (pin) {
      if (!/^\d{4,6}$/.test(pin)) {
        return NextResponse.json(
          { error: 'PIN must be 4-6 digits' }, 
          { status: 400 }
        )
      }

      // Check if PIN already exists (exclude current user)
      const existingPin = await prisma.user.findFirst({
        where: {
          pin: pin,
          NOT: { id: id }
        }
      })
      if (existingPin) {
        return NextResponse.json(
          { error: 'PIN already exists' }, 
          { status: 400 }
        )
      }

      hashedPin = await bcrypt.hash(pin, 10)
    }

    // Check if NFC code already exists (if provided and exclude current user)
    if (nfcCode) {
      const existingNFC = await prisma.user.findFirst({
        where: {
          nfcCode: nfcCode,
          NOT: { id: id }
        }
      })
      if (existingNFC) {
        return NextResponse.json(
          { error: 'NFC code already exists' }, 
          { status: 400 }
        )
      }
    }

    // Build update data
    const updateData: any = {
      name,
      role: role
    }

    if (hashedPin) {
      updateData.pin = hashedPin
    }

    if (nfcCode !== undefined) {
      updateData.nfcCode = nfcCode || null
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        role: true,
        nfcCode: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true }
    })
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has any transactions (prevent deletion if they do)
    const hasTransactions = await prisma.transaction.findFirst({
      where: { userId: id }
    })
    
    if (hasTransactions) {
      return NextResponse.json({
        error: 'Cannot delete user with existing transactions. Deactivate user instead.'
      }, { status: 400 })
    }

    // Count total admin users
    const adminCount = await prisma.user.count({
      where: {
        role: 'ADMIN',
        isActive: true
      }
    })

    // Prevent deletion of the last admin user
    if (existingUser.role === 'ADMIN' && adminCount <= 1) {
      return NextResponse.json({
        error: 'Cannot delete the last admin user'
      }, { status: 400 })
    }

    // Delete user
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}