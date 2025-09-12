import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status, workerId } = await request.json()
    const orderId = params.id

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
    const updateQuery = workerId 
      ? `UPDATE transactions SET orderStatus = ?, workerId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
      : `UPDATE transactions SET orderStatus = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
    
    const params_array = workerId ? [status, workerId, orderId] : [status, orderId]
    
    await db.run(updateQuery, params_array)

    // Get the updated order with all details
    const updatedOrder = await db.get(`
      SELECT t.*, u.name as userName, w.name as workerName
      FROM transactions t 
      JOIN users u ON t.userId = u.id 
      LEFT JOIN workers w ON t.workerId = w.id
      WHERE t.id = ?
    `, [orderId])

    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Get transaction items
    const items = await db.all(`
      SELECT ti.*, p.name as productName, p.description as productDescription
      FROM transaction_items ti
      JOIN products p ON ti.productId = p.id
      WHERE ti.transactionId = ?
    `, [orderId])

    const result = {
      ...(updatedOrder as Record<string, unknown>),
      user: { name: (updatedOrder as any).userName },
      worker: (updatedOrder as any).workerName ? { name: (updatedOrder as any).workerName } : null,
      items: (items as Array<Record<string, unknown> & { productName: string; productDescription?: string }>).map(item => ({
        ...item,
        product: { 
          name: item.productName,
          description: item.productDescription
        }
      }))
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to update order status:', error)
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    )
  }
}