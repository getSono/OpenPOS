import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { 
      items, 
      total, 
      customerId, 
      paymentMethod = 'CASH',
      amountPaid,
      changeAmount,
      discountCode
    } = await request.json()

    // Generate receipt number and order number
    const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    
    // Get the next order number by finding the highest existing order number
    const latestTransaction = await prisma.transaction.findFirst({
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true }
    })
    const orderNumber = (latestTransaction?.orderNumber || 99) + 1

    // Calculate subtotal and discount
    const subtotal = items.reduce((sum: number, item: { unitPrice: number; quantity: number }) => 
      sum + (item.unitPrice * item.quantity), 0
    )

    // Apply discount if provided
    const discount = discountCode ? discountCode.discountAmount : 0
    const tax = 0 // For now, we'll assume no tax

    // Create transaction with items in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Insert transaction
      const transaction = await tx.transaction.create({
        data: {
          receiptNumber,
          orderNumber,
          subtotal,
          tax,
          discount,
          total,
          paymentMethod: paymentMethod,
          status: 'COMPLETED',
          orderStatus: 'PENDING',
          userId: 'user1', // TODO: Get from authenticated user session
          customerId: customerId || null,
          workerId: null,
          discountCodeId: discountCode?.id || null,
          amountPaid,
          changeAmount
        }
      })

      // Insert transaction items and update stock
      for (const item of items) {
        await tx.transactionItem.create({
          data: {
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
            transactionId: transaction.id,
            productId: item.productId
          }
        })

        // Update product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        })
      }

      // Update discount code usage if discount was applied
      if (discountCode) {
        await tx.discountCode.update({
          where: { id: discountCode.id },
          data: {
            currentUses: {
              increment: 1
            }
          }
        })
      }

      return transaction
    })

    // Get the created transaction with items
    const transactionWithItems = await prisma.transaction.findUnique({
      where: { id: result.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                price: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(transactionWithItems, { status: 201 })
  } catch (error) {
    console.error('Failed to create transaction:', error)
    return NextResponse.json({ error: 'Failed to process transaction' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      take: 50,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            name: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Failed to fetch transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}