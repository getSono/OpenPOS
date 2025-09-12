import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'

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
    type ProductRow = {
      id: number;
      name: string;
      description: string;
      price: number;
      barcode: string;
      stock: number;
      categoryName: string;
    } | undefined;
    const product = await db.get(
      `SELECT p.*, c.name as categoryName FROM products p JOIN categories c ON p.categoryId = c.id WHERE p.barcode = ? AND p.isActive = 1`,
      [barcode]
    ) as ProductRow;

    if (!product || !product.id || !product.name || !product.price || !product.barcode || !product.categoryName) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Format the response
    const result = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      barcode: product.barcode,
      stock: product.stock,
      category: {
        name: product.categoryName
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to find product by barcode:', error)
    return NextResponse.json(
      { error: 'Failed to find product' },
      { status: 500 }
    )
  }
}