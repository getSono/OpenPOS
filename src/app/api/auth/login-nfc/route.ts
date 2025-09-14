import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { nfcCode } = await request.json()

    if (!nfcCode || typeof nfcCode !== 'string') {
      return NextResponse.json({ error: 'NFC code is required' }, { status: 400 })
    }

    // Find user by NFC code
    const user = await prisma.user.findFirst({
      where: {
        nfcCode: nfcCode.trim(),
        isActive: true
      },
      select: {
        id: true,
        name: true,
        role: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid NFC code' }, { status: 401 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('NFC login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}