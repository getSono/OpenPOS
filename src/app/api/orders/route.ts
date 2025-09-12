import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'

export async function GET() {
  try {
    const orders = await db.all(`
      SELECT t.*, u.name as userName, w.name as workerName
      FROM transactions t 
      JOIN users u ON t.userId = u.id 
      LEFT JOIN workers w ON t.workerId = w.id
      WHERE t.status = 'COMPLETED'
      ORDER BY t.createdAt DESC 
      LIMIT 50
    `)

    // Get transaction items for each transaction
    const ordersWithItems = await Promise.all(
      (orders as Array<Record<string, unknown> & { id: string; userName: string; workerName?: string }>).map(async (order) => {
        const items = await db.all(`
          SELECT ti.*, p.name as productName, p.description as productDescription
          FROM transaction_items ti
          JOIN products p ON ti.productId = p.id
          WHERE ti.transactionId = ?
        `, [order.id])

        return {
          ...order,
          user: { name: order.userName },
          worker: order.workerName ? { name: order.workerName } : null,
          items: (items as Array<Record<string, unknown> & { productName: string; productDescription?: string }>).map(item => ({
            ...item,
            product: { 
              name: item.productName,
              description: item.productDescription
            }
          }))
        }
      })
    )

    return NextResponse.json(ordersWithItems)
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}