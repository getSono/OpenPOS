import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'

// PUT /api/variants/[id] - Update a variant
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const variantId = params.id
    const data = await request.json()
    
    await db.run(`
      UPDATE product_variants 
      SET name = ?, sku = ?, barcode = ?, price = ?, cost = ?, stock = ?, 
          attributes = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      data.name,
      data.sku || null,
      data.barcode || null,
      data.price ? parseFloat(data.price) : null,
      data.cost ? parseFloat(data.cost) : 0,
      parseInt(data.stock) || 0,
      JSON.stringify(data.attributes || {}),
      variantId
    ])

    const variant = await db.get(`
      SELECT * FROM product_variants WHERE id = ?
    `, [variantId])

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    const formattedVariant = {
      ...(variant as Record<string, unknown> & { attributes: string }),
      attributes: JSON.parse((variant as { attributes: string }).attributes || '{}')
    }

    return NextResponse.json(formattedVariant)
  } catch (error) {
    console.error('Failed to update variant:', error)
    return NextResponse.json({ error: 'Failed to update variant' }, { status: 500 })
  }
}

// DELETE /api/variants/[id] - Delete a variant
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const variantId = params.id
    
    // Soft delete by setting isActive to false
    await db.run(`
      UPDATE product_variants 
      SET isActive = 0, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [variantId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete variant:', error)
    return NextResponse.json({ error: 'Failed to delete variant' }, { status: 500 })
  }
}