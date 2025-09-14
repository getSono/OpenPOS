import { NextRequest, NextResponse } from 'next/server'
import CartService from '@/lib/cartService'

export async function POST(request: NextRequest) {
  try {
    const { productId, quantity, product } = await request.json()

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const cartService = CartService.getInstance()
    cartService.addItem(productId, quantity || 1, product)

    return NextResponse.json({ 
      success: true, 
      message: 'Item added to cart successfully' 
    })
  } catch (error) {
    console.error('Failed to add item to cart:', error)
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    )
  }
}