import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET /api/users - List all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        nfcCode: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const { name, pin, role, nfcCode } = await request.json()

    // Validate required fields
    if (!name || !pin || !role) {
      return NextResponse.json(
        { error: 'Name, PIN, and role are required' }, 
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

    // Validate PIN (4-6 digits)
    if (!/^\d{4,6}$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be 4-6 digits' }, 
        { status: 400 }
      )
    }

    // Check if PIN already exists
    const existingPin = await prisma.user.findFirst({
      where: { pin }
    })
    if (existingPin) {
      return NextResponse.json(
        { error: 'PIN already exists' }, 
        { status: 400 }
      )
    }

    // Check if NFC code already exists (if provided)
    if (nfcCode) {
      const existingNFC = await prisma.user.findFirst({
        where: { nfcCode }
      })
      if (existingNFC) {
        return NextResponse.json(
          { error: 'NFC code already exists' }, 
          { status: 400 }
        )
      }
    }

    // Hash the PIN for security
    const hashedPin = await bcrypt.hash(pin, 10)

    // Create user
    const createdUser = await prisma.user.create({
      data: {
        name,
        pin: hashedPin,
        role: role,
        nfcCode: nfcCode || null,
        isActive: true
      },
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

    return NextResponse.json(createdUser, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}