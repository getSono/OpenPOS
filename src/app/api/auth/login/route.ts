import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json()

    if (!pin) {
      return NextResponse.json({ error: 'PIN is required' }, { status: 400 })
    }

    // Get all active users to check PIN
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        role: true,
        pin: true
      }
    })

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