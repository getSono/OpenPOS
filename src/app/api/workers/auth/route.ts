import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { nfcCode } = await request.json()

    if (!nfcCode) {
      return NextResponse.json(
        { error: 'NFC code is required' },
        { status: 400 }
      )
    }

    // For demo purposes, create test workers if they don't exist
    const testWorkers = [
      { name: 'Kitchen Worker 1', nfcCode: 'WORKER001', currentStation: 'Kitchen' },
      { name: 'Kitchen Worker 2', nfcCode: 'WORKER002', currentStation: 'Grill' },
      { name: 'Prep Worker', nfcCode: 'WORKER003', currentStation: 'Prep' }
    ]

    for (const workerData of testWorkers) {
      await db.run(`
        INSERT OR IGNORE INTO workers (id, name, pin, nfcCode, currentStation, isActive)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        `worker_${workerData.nfcCode}`,
        workerData.name,
        '0000',
        workerData.nfcCode,
        workerData.currentStation,
        1
      ])
    }

    const worker = await db.get(`
      SELECT id, name, nfcCode, currentStation, isActive
      FROM workers 
      WHERE nfcCode = ? AND isActive = 1
    `, [nfcCode])

    if (!worker) {
      return NextResponse.json(
        { error: 'Invalid worker credentials or inactive account' },
        { status: 401 }
      )
    }

    return NextResponse.json(worker)
  } catch (error) {
    console.error('Worker authentication error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}