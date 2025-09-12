import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { 
      items, 
      total, 
      customerId, 
      paymentMethod = 'CASH',
      amountPaid,
      changeAmount 
    } = await request.json()

    // Generate receipt number and order number
    const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const orderNumber = Math.floor(Math.random() * 900) + 100 // Random 3-digit number

    // Calculate subtotal
    const subtotal = items.reduce((sum: number, item: { unitPrice: number; quantity: number }) => 
      sum + (item.unitPrice * item.quantity), 0
    )

    // For now, we'll assume no tax or discount
    const tax = 0
    const discount = 0

    // Insert transaction with enhanced fields
    const transactionResult = await db.run(`
      INSERT INTO transactions (
        receiptNumber, orderNumber, subtotal, tax, discount, total, 
        paymentMethod, orderStatus, userId, customerId, amountPaid, changeAmount
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      receiptNumber, orderNumber, subtotal, tax, discount, total, 
      paymentMethod, 'PENDING', 'user1', customerId, amountPaid, changeAmount
    ])

    const transactionId = transactionResult.lastID

    // Insert transaction items
    for (const item of items) {
      await db.run(`
        INSERT INTO transaction_items (quantity, unitPrice, totalPrice, transactionId, productId)
        VALUES (?, ?, ?, ?, ?)
      `, [item.quantity, item.unitPrice, item.unitPrice * item.quantity, transactionId, item.productId])

      // Update product stock
      await db.run(`
        UPDATE products SET stock = stock - ? WHERE id = ?
      `, [item.quantity, item.productId])
    }

    // Get the created transaction with items
    const transaction = await db.get(`
      SELECT * FROM transactions WHERE id = ?
    `, [transactionId])

    const transactionItems = await db.all(`
      SELECT ti.*, p.name as productName, p.price as productPrice
      FROM transaction_items ti
      JOIN products p ON ti.productId = p.id
      WHERE ti.transactionId = ?
    `, [transactionId])

    const result = {
      ...(transaction as Record<string, unknown>),
      items: (transactionItems as Array<Record<string, unknown> & { productName: string; productPrice: number }>).map(item => ({
        ...item,
        product: {
          name: item.productName,
          price: item.productPrice
        }
      }))
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Failed to create transaction:', error)
    return NextResponse.json({ error: 'Failed to process transaction' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const transactions = await db.all(`
      SELECT t.*, u.name as userName 
      FROM transactions t 
      JOIN users u ON t.userId = u.id 
      ORDER BY t.createdAt DESC 
      LIMIT 50
    `)

    // Get transaction items for each transaction
    const transactionsWithItems = await Promise.all(
      (transactions as Array<Record<string, unknown> & { id: string; userName: string }>).map(async (transaction) => {
        const items = await db.all(`
          SELECT ti.*, p.name as productName
          FROM transaction_items ti
          JOIN products p ON ti.productId = p.id
          WHERE ti.transactionId = ?
        `, [transaction.id])

        return {
          ...transaction,
          user: { name: transaction.userName },
          items: (items as Array<Record<string, unknown> & { productName: string }>).map(item => ({
            ...item,
            product: { name: item.productName }
          }))
        }
      })
    )

    return NextResponse.json(transactionsWithItems)
  } catch (error) {
    console.error('Failed to fetch transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}