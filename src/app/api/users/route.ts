import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET /api/users - List all users
export async function GET() {
  try {
    const users = await db.all(`
      SELECT id, name, role, nfcCode, isActive, createdAt, updatedAt
      FROM users
      ORDER BY createdAt DESC
    `)

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
    if (!['ADMIN', 'MANAGER', 'CASHIER'].includes(role)) {
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
    const existingPin = await db.get('SELECT id FROM users WHERE pin = ?', [pin]) as { id: string } | undefined
    if (existingPin) {
      return NextResponse.json(
        { error: 'PIN already exists' }, 
        { status: 400 }
      )
    }

    // Check if NFC code already exists (if provided)
    if (nfcCode) {
      const existingNFC = await db.get('SELECT id FROM users WHERE nfcCode = ?', [nfcCode]) as { id: string } | undefined
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
    const result = await db.run(`
      INSERT INTO users (id, name, pin, role, nfcCode, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      hashedPin,
      role,
      nfcCode || null,
      true
    ])

    // Return the created user (without PIN)
    const createdUser = await db.get(`
      SELECT id, name, role, nfcCode, isActive, createdAt, updatedAt
      FROM users
      WHERE rowid = ?
    `, [result.lastID])

    return NextResponse.json(createdUser, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}