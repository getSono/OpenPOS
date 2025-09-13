import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const data = await request.json()
    const productId = params.id
    
    await db.run(`
      UPDATE products 
      SET name = ?, description = ?, price = ?, cost = ?, sku = ?, barcode = ?, 
          stock = ?, minStock = ?, categoryId = ?, image = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      data.name,
      data.description || null,
      parseFloat(data.price),
      data.cost ? parseFloat(data.cost) : 0,
      data.sku || null,
      data.barcode || null,
      parseInt(data.stock) || 0,
      parseInt(data.minStock) || 0,
      data.categoryId,
      data.image || null,
      productId
    ])

    // Get the updated product with category info
    const product = await db.get(`
      SELECT p.*, c.name as categoryName 
      FROM products p 
      JOIN categories c ON p.categoryId = c.id 
      WHERE p.id = ?
    `, [productId])

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const formattedProduct = {
      ...(product as Record<string, unknown> & { categoryName: string }),
      category: { name: (product as { categoryName: string }).categoryName }
    }

    return NextResponse.json(formattedProduct)
  } catch (error) {
    console.error('Failed to update product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const productId = params.id
    
    // Soft delete by setting isActive to false
    await db.run(`
      UPDATE products 
      SET isActive = 0, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [productId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}