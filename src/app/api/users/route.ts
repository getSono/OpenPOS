import { NextRequest, NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// GET /api/users - List all users
export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from(TABLES.USERS)
      .select('id, name, role, nfcCode, isActive, createdAt, updatedAt')
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

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
    const { data: existingPin } = await supabase
      .from(TABLES.USERS)
      .select('id')
      .eq('pin', pin)
      .single()

    if (existingPin) {
      return NextResponse.json(
        { error: 'PIN already exists' }, 
        { status: 400 }
      )
    }

    // Check if NFC code already exists (if provided)
    if (nfcCode) {
      const { data: existingNFC } = await supabase
        .from(TABLES.USERS)
        .select('id')
        .eq('nfcCode', nfcCode)
        .single()

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
    const { data: createdUser, error } = await supabase
      .from(TABLES.USERS)
      .insert({
        name,
        pin: hashedPin,
        role,
        nfcCode: nfcCode || null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select('id, name, role, nfcCode, isActive, createdAt, updatedAt')
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    return NextResponse.json(createdUser, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}