import { NextRequest, NextResponse } from 'next/server'
import CartService from '@/lib/cartService'

export async function GET(request: NextRequest) {
  const cartService = CartService.getInstance()
  
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      
      // Send initial cart state
      const initialData = `data: ${JSON.stringify({ type: 'cart-update', cart: cartService.getCart() })}\n\n`
      controller.enqueue(encoder.encode(initialData))
      
      // Store connection for broadcasting
      cartService.addConnection(controller)
      
      // Clean up on close
      request.signal.addEventListener('abort', () => {
        cartService.removeConnection(controller)
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const { action, productId, quantity, product } = await request.json()
    const cartService = CartService.getInstance()

    switch (action) {
      case 'add':
        cartService.addItem(productId, quantity || 1, product)
        break
      
      case 'update':
        cartService.updateItem(productId, quantity)
        break
      
      case 'remove':
        cartService.removeItem(productId)
        break
      
      case 'clear':
        cartService.clearCart()
        break
    }

    return NextResponse.json({ success: true, cart: cartService.getCart() })
  } catch (error) {
    console.error('Cart sync error:', error)
    return NextResponse.json({ error: 'Failed to sync cart' }, { status: 500 })
  }
}