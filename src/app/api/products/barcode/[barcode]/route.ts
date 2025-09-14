import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barcode: string }> }
) {
  try {
    const { barcode } = await params

    if (!barcode) {
      return NextResponse.json(
        { error: 'Barcode is required' },
        { status: 400 }
      )
    }

    // Find product by barcode
    const product = await prisma.product.findFirst({
      where: {
        barcode: barcode,
        isActive: true
      },
      include: {
        category: {
          select: {
            name: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Failed to find product by barcode:', error)
    return NextResponse.json(
      { error: 'Failed to find product' },
      { status: 500 }
    )
  }
}