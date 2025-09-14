import { NextRequest, NextResponse } from 'next/server'
import { supabase, TABLES, checkSupabaseConfig } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const configCheck = checkSupabaseConfig()
    if (configCheck) return configCheck

    const { pin } = await request.json()

    if (!pin) {
      return NextResponse.json({ error: 'PIN is required' }, { status: 400 })
    }

    // Get all active users to check PIN
    const { data: users, error } = await supabase!
      .from(TABLES.USERS)
      .select('id, name, role, pin')
      .eq('isActive', true)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to authenticate' }, { status: 500 })
    }

    let authenticatedUser = null

    for (const user of users) {
      // Check if PIN is hashed (starts with $2b$ for bcrypt)
      if (user.pin.startsWith('$2b$')) {
        // Compare with hashed PIN
        const isValid = await bcrypt.compare(pin, user.pin)
        if (isValid) {
          authenticatedUser = { id: user.id, name: user.name, role: user.role }
          break
        }
      } else {
        // Plain text PIN (legacy)
        if (user.pin === pin) {
          authenticatedUser = { id: user.id, name: user.name, role: user.role }
          break
        }
      }
    }

    if (!authenticatedUser) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
    }

    return NextResponse.json(authenticatedUser)
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}