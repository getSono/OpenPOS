import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { status, workerId } = await request.json()
    const { id: orderId } = await params

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    const validStatuses = ['PENDING', 'IN_PROGRESS', 'READY', 'COMPLETED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Update the order status
    const updateData: any = {
      orderStatus: status
    }

    if (workerId) {
      updateData.workerId = workerId
    }

    const updatedOrder = await prisma.transaction.update({
      where: { id: orderId },
      data: updateData,
      include: {
        user: {
          select: {
            name: true
          }
        },
        worker: {
          select: {
            name: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                description: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Failed to update order status:', error)
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    )
  }
}