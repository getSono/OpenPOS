import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { nfcCode } = await request.json()

    if (!nfcCode || typeof nfcCode !== 'string') {
      return NextResponse.json({ error: 'NFC code is required' }, { status: 400 })
    }

    // Find user by NFC code
    const user = await prisma.user.findUnique({
      where: { 
        nfcCode: nfcCode.trim(),
        isActive: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid NFC code' }, { status: 401 })
    }

    // Return user data (excluding sensitive information)
    const userData = {
      id: user.id,
      name: user.name,
      role: user.role
    }

    return NextResponse.json(userData)
  } catch (error) {
    console.error('NFC login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}