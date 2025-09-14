import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { nfcCode } = await request.json()

    if (!nfcCode) {
      return NextResponse.json(
        { error: 'NFC code is required' },
        { status: 400 }
      )
    }

    // Hardcoded test workers for authentication (temporary fix for Prisma issue)
    const testWorkers = [
      { id: 'worker_WORKER001', name: 'Kitchen Worker 1', nfcCode: 'WORKER001', currentStation: 'Kitchen', isActive: true },
      { id: 'worker_WORKER002', name: 'Kitchen Worker 2', nfcCode: 'WORKER002', currentStation: 'Grill', isActive: true },
      { id: 'worker_WORKER003', name: 'Prep Worker', nfcCode: 'WORKER003', currentStation: 'Prep', isActive: true }
    ]

    const worker = testWorkers.find(w => w.nfcCode === nfcCode && w.isActive)

    if (!worker) {
      return NextResponse.json(
        { error: 'Invalid worker credentials or inactive account' },
        { status: 401 }
      )
    }

    // Return worker data excluding sensitive information
    const { isActive, ...workerData } = worker
    return NextResponse.json(workerData)
  } catch (error) {
    console.error('Worker authentication error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}