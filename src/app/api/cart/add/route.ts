import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { productId, quantity } = await request.json()

    if (!productId || !quantity) {
      return NextResponse.json(
        { error: 'Product ID and quantity are required' },
        { status: 400 }
      )
    }

    // For the handheld scanner, we'll just return success
    // In a real application, this would add to a session-based cart
    // or user-specific cart in the database
    
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