import { NextRequest, NextResponse } from 'next/server'
import { supabase, TABLES, checkSupabaseConfig } from '@/lib/supabase'

// GET /api/products/[id] - Get a specific product
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const configCheck = checkSupabaseConfig()
    if (configCheck) return configCheck

    const params = await context.params
    const productId = params.id

    const { data: product, error } = await supabase!
      .from(TABLES.PRODUCTS)
      .select(`
        *,
        category:categoryId (
          name
        )
      `)
      .eq('id', productId)
      .eq('isActive', true)
      .single()

    if (error || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Parse customFields if they exist
    const formattedProduct = {
      ...product,
      customFields: product.customFields ? JSON.parse(product.customFields) : {}
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
    const configCheck = checkSupabaseConfig()
    if (configCheck) return configCheck

    const params = await context.params
    const data = await request.json()
    const productId = params.id
    
    const updateData = {
      name: data.name,
      description: data.description,
      price: parseFloat(data.price),
      cost: data.cost ? parseFloat(data.cost) : 0,
      sku: data.sku,
      barcode: data.barcode,
      stock: parseInt(data.stock) || 0,
      minStock: parseInt(data.minStock) || 0,
      categoryId: data.categoryId,
      image: data.image,
      customFields: JSON.stringify(data.customFields || {}),
      updatedAt: new Date().toISOString()
    }

    const { data: product, error } = await supabase!
      .from(TABLES.PRODUCTS)
      .update(updateData)
      .eq('id', productId)
      .select(`
        *,
        category:categoryId (
          name
        )
      `)
      .single()

    if (error || !product) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }

    // Parse customFields before returning
    const formattedProduct = {
      ...product,
      customFields: product.customFields ? JSON.parse(product.customFields) : {}
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
    const configCheck = checkSupabaseConfig()
    if (configCheck) return configCheck

    const params = await context.params
    const productId = params.id
    
    // Soft delete by setting isActive to false
    const { error } = await supabase!
      .from(TABLES.PRODUCTS)
      .update({ 
        isActive: false, 
        updatedAt: new Date().toISOString() 
      })
      .eq('id', productId)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}