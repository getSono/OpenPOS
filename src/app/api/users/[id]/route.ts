import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET /api/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await db.get(`
      SELECT id, name, role, nfcCode, isActive, createdAt, updatedAt
      FROM users
      WHERE id = ?
    `, [id])

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
    const existingUser = await db.get('SELECT id FROM users WHERE id = ?', [id]) as { id: string } | undefined
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
    if (!['ADMIN', 'MANAGER', 'CASHIER'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be ADMIN, MANAGER, or CASHIER' }, 
        { status: 400 }
      )
    }

    let hashedPin = null
    
    // If PIN is being updated, validate and hash it
    if (pin) {
      if (!/^\d{4,6}$/.test(pin)) {
        return NextResponse.json(
          { error: 'PIN must be 4-6 digits' }, 
          { status: 400 }
        )
      }

      // Check if PIN already exists (exclude current user)
      const existingPin = await db.get(
        'SELECT id FROM users WHERE pin = ? AND id != ?', 
        [pin, id]
      ) as { id: string } | undefined
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
      const existingNFC = await db.get(
        'SELECT id FROM users WHERE nfcCode = ? AND id != ?', 
        [nfcCode, id]
      ) as { id: string } | undefined
      if (existingNFC) {
        return NextResponse.json(
          { error: 'NFC code already exists' }, 
          { status: 400 }
        )
      }
    }

    // Build update query dynamically
    const updateFields = ['name = ?', 'role = ?', 'updatedAt = datetime(\'now\')']
    const updateValues = [name, role]

    if (hashedPin) {
      updateFields.push('pin = ?')
      updateValues.push(hashedPin)
    }

    if (nfcCode !== undefined) {
      updateFields.push('nfcCode = ?')
      updateValues.push(nfcCode || null)
    }

    if (isActive !== undefined) {
      updateFields.push('isActive = ?')
      updateValues.push(isActive)
    }

    updateValues.push(id)

    // Update user
    await db.run(`
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues)

    // Return updated user (without PIN)
    const updatedUser = await db.get(`
      SELECT id, name, role, nfcCode, isActive, createdAt, updatedAt
      FROM users
      WHERE id = ?
    `, [id])

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
    const existingUser = await db.get('SELECT id, role FROM users WHERE id = ?', [id]) as { id: string; role: string } | undefined
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has any transactions (prevent deletion if they do)
    const hasTransactions = await db.get(
      'SELECT id FROM transactions WHERE userId = ? LIMIT 1', 
      [id]
    ) as { id: string } | undefined
    
    if (hasTransactions) {
      return NextResponse.json({
        error: 'Cannot delete user with existing transactions. Deactivate user instead.'
      }, { status: 400 })
    }

    // Count total admin users
    const adminCount = await db.get(
      'SELECT COUNT(*) as count FROM users WHERE role = "ADMIN" AND isActive = 1'
    ) as { count: number }

    // Prevent deletion of the last admin user
    if (existingUser.role === 'ADMIN' && adminCount.count <= 1) {
      return NextResponse.json({
        error: 'Cannot delete the last admin user'
      }, { status: 400 })
    }

    // Delete user
    await db.run('DELETE FROM users WHERE id = ?', [id])

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}