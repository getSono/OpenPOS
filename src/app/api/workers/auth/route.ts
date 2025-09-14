import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
      { id: 'worker_WORKER001', name: 'Kitchen Worker 1', nfcCode: 'WORKER001', currentStation: 'Kitchen' },
      { id: 'worker_WORKER002', name: 'Kitchen Worker 2', nfcCode: 'WORKER002', currentStation: 'Grill' },
      { id: 'worker_WORKER003', name: 'Prep Worker', nfcCode: 'WORKER003', currentStation: 'Prep' }
    ]

    for (const workerData of testWorkers) {
      await prisma.worker.upsert({
        where: { id: workerData.id },
        update: {},
        create: {
          id: workerData.id,
          name: workerData.name,
          pin: '0000',
          nfcCode: workerData.nfcCode,
          currentStation: workerData.currentStation,
          isActive: true
        }
      })
    }

    const worker = await prisma.worker.findFirst({
      where: {
        nfcCode: nfcCode,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        nfcCode: true,
        currentStation: true,
        isActive: true
      }
    })

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