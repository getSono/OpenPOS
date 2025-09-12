import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json()

    if (!pin) {
      return NextResponse.json({ error: 'PIN is required' }, { status: 400 })
    }

    // Find user by PIN
    const user = await db.get(
      'SELECT id, name, role FROM users WHERE pin = ? AND isActive = 1',
      [pin]
    )

    if (!user) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}