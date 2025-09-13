import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'
import { randomUUID } from 'crypto'

// GET /api/products/[id]/variants - Get all variants for a product
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const productId = params.id
    
    const variants = await db.all(`
      SELECT * FROM product_variants 
      WHERE productId = ? AND isActive = 1
      ORDER BY name ASC
    `, [productId])

    // Parse attributes JSON for each variant
    const formattedVariants = (variants as Array<Record<string, unknown> & { attributes: string }>).map(variant => ({
      ...variant,
      attributes: JSON.parse(variant.attributes || '{}')
    }))

    return NextResponse.json(formattedVariants)
  } catch (error) {
    console.error('Failed to fetch product variants:', error)
    return NextResponse.json({ error: 'Failed to fetch product variants' }, { status: 500 })
  }
}

// POST /api/products/[id]/variants - Create a new variant for a product
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const productId = params.id
    const data = await request.json()
    
    const variantId = randomUUID()
    
    await db.run(`
      INSERT INTO product_variants (id, productId, name, sku, barcode, price, cost, stock, attributes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      variantId,
      productId,
      data.name,
      data.sku || null,
      data.barcode || null,
      data.price ? parseFloat(data.price) : null,
      data.cost ? parseFloat(data.cost) : 0,
      parseInt(data.stock) || 0,
      JSON.stringify(data.attributes || {})
    ])

    const variant = await db.get(`
      SELECT * FROM product_variants WHERE id = ?
    `, [variantId])

    if (!variant) {
      return NextResponse.json({ error: 'Failed to retrieve created variant' }, { status: 500 })
    }

    const formattedVariant = {
      ...(variant as Record<string, unknown> & { attributes: string }),
      attributes: JSON.parse((variant as { attributes: string }).attributes || '{}')
    }

    return NextResponse.json(formattedVariant, { status: 201 })
  } catch (error) {
    console.error('Failed to create product variant:', error)
    return NextResponse.json({ error: 'Failed to create product variant' }, { status: 500 })
  }
}