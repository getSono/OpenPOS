import { NextRequest, NextResponse } from 'next/server'
import { broadcastUpdate } from '@/lib/customer-display'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Validate the data structure
    const { cart, total, itemCount, currentItem } = data
    
    if (!Array.isArray(cart) || typeof total !== 'number' || typeof itemCount !== 'number') {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }
    
    // Broadcast the update to all connected customer displays
    broadcastUpdate({
      cart,
      total,
      itemCount,
      currentItem
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating customer display:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}