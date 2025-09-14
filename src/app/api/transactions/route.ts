import { NextRequest, NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'

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
    const { data: latestTransaction } = await supabase
      .from(TABLES.TRANSACTIONS)
      .select('orderNumber')
      .order('orderNumber', { ascending: false })
      .limit(1)
      .single()

    const orderNumber = (latestTransaction?.orderNumber || 99) + 1

    // Calculate subtotal and discount
    const subtotal = items.reduce((sum: number, item: { unitPrice: number; quantity: number }) => 
      sum + (item.unitPrice * item.quantity), 0
    )

    // Apply discount if provided
    const discount = discountCode ? discountCode.discountAmount : 0
    const tax = 0 // For now, we'll assume no tax

    // Create transaction
    const { data: transaction, error: transactionError } = await supabase
      .from(TABLES.TRANSACTIONS)
      .insert({
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
        changeAmount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select('*')
      .single()

    if (transactionError) {
      console.error('Transaction creation error:', transactionError)
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
    }

    // Insert transaction items and update stock
    for (const item of items) {
      // Insert transaction item
      const { error: itemError } = await supabase
        .from(TABLES.TRANSACTION_ITEMS)
        .insert({
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
          transactionId: transaction.id,
          productId: item.productId
        })

      if (itemError) {
        console.error('Transaction item creation error:', itemError)
        continue // Continue with other items
      }

      // Update product stock
      const { error: stockError } = await supabase.rpc('decrement_product_stock', {
        product_id: item.productId,
        quantity: item.quantity
      })

      // If RPC doesn't exist, update manually
      if (stockError) {
        const { data: product } = await supabase
          .from(TABLES.PRODUCTS)
          .select('stock')
          .eq('id', item.productId)
          .single()

        if (product) {
          await supabase
            .from(TABLES.PRODUCTS)
            .update({ 
              stock: product.stock - item.quantity,
              updatedAt: new Date().toISOString()
            })
            .eq('id', item.productId)
        }
      }
    }

    // Update discount code usage if discount was applied
    if (discountCode) {
      const { data: discountData } = await supabase
        .from(TABLES.DISCOUNT_CODES)
        .select('currentUses')
        .eq('id', discountCode.id)
        .single()

      if (discountData) {
        await supabase
          .from(TABLES.DISCOUNT_CODES)
          .update({ 
            currentUses: discountData.currentUses + 1,
            updatedAt: new Date().toISOString()
          })
          .eq('id', discountCode.id)
      }
    }

    // Get the created transaction with items
    const { data: transactionWithItems } = await supabase
      .from(TABLES.TRANSACTIONS)
      .select(`
        *,
        items:transaction_items (
          *,
          product:products (
            name,
            price
          )
        )
      `)
      .eq('id', transaction.id)
      .single()

    return NextResponse.json(transactionWithItems, { status: 201 })
  } catch (error) {
    console.error('Failed to create transaction:', error)
    return NextResponse.json({ error: 'Failed to process transaction' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { data: transactions, error } = await supabase
      .from(TABLES.TRANSACTIONS)
      .select(`
        *,
        user:users (
          name
        ),
        items:transaction_items (
          *,
          product:products (
            name
          )
        )
      `)
      .order('createdAt', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Failed to fetch transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}