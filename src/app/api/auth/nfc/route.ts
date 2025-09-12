import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { nfcCode } = await request.json()

    if (!nfcCode || typeof nfcCode !== 'string') {
      return NextResponse.json({ error: 'NFC code is required' }, { status: 400 })
    }

    // Find user by NFC code
    type UserRow = { id: number; name: string; role: string } | undefined;
    const user = await db.get(
      `SELECT id, name, role FROM users WHERE nfcCode = ? AND isActive = 1`,
      [nfcCode.trim()]
    ) as UserRow;

    if (!user || !user.id || !user.name || !user.role) {
      return NextResponse.json({ error: 'Invalid NFC code' }, { status: 401 });
    }

    // Return user data (excluding sensitive information)
    const userData = {
      id: user.id,
      name: user.name,
      role: user.role,
      nfcCode: nfcCode.trim()
    };

    return NextResponse.json(userData);
  } catch (error) {
    console.error('NFC authentication error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}