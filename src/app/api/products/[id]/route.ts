import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'

// GET /api/products/[id] - Get a specific product with variants
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const productId = params.id

    // Get the product with category info
    const product = await db.get(`
      SELECT p.*, c.name as categoryName 
      FROM products p 
      JOIN categories c ON p.categoryId = c.id 
      WHERE p.id = ? AND p.isActive = 1
    `, [productId])

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Get variants for the product
    const variants = await db.all(`
      SELECT * FROM product_variants 
      WHERE productId = ? AND isActive = 1
      ORDER BY name ASC
    `, [productId])

    const formattedProduct = {
      ...(product as Record<string, unknown> & { categoryName: string; customFields: string }),
      category: { name: (product as { categoryName: string }).categoryName },
      customFields: JSON.parse((product as { customFields: string }).customFields || '{}'),
      variants: (variants as Array<Record<string, unknown> & { attributes: string }>).map(variant => ({
        ...variant,
        attributes: JSON.parse(variant.attributes || '{}')
      }))
    }

    return NextResponse.json(formattedProduct)
  } catch (error) {
    console.error('Failed to fetch product:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

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
          stock = ?, minStock = ?, categoryId = ?, image = ?, customFields = ?, updatedAt = CURRENT_TIMESTAMP
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
      JSON.stringify(data.customFields || {}),
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
      ...(product as Record<string, unknown> & { categoryName: string; customFields: string }),
      category: { name: (product as { categoryName: string }).categoryName },
      customFields: JSON.parse((product as { customFields: string }).customFields || '{}')
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