import { NextRequest, NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'

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
      orderStatus: status,
      updatedAt: new Date().toISOString()
    }

    if (workerId) {
      updateData.workerId = workerId
    }

    const { data: updatedOrder, error } = await supabase
      .from(TABLES.TRANSACTIONS)
      .update(updateData)
      .eq('id', orderId)
      .select(`
        *,
        user:users (
          name
        ),
        worker:workers (
          name
        ),
        items:transaction_items (
          *,
          product:products (
            name,
            description
          )
        )
      `)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to update order status' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Failed to update order status:', error)
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    )
  }
}