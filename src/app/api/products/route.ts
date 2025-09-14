import { NextRequest, NextResponse } from 'next/server'
import { supabase, TABLES, checkSupabaseConfig } from '@/lib/supabase'

export async function GET() {
  try {
    const configCheck = checkSupabaseConfig()
    if (configCheck) return configCheck

    const { data: products, error } = await supabase!
      .from(TABLES.PRODUCTS)
      .select(`
        *,
        category:categoryId (
          name
        )
      `)
      .eq('isActive', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    // Transform the data to parse customFields if they exist
    const formattedProducts = products.map(product => ({
      ...product,
      customFields: product.customFields ? JSON.parse(product.customFields) : {}
    }))

    return NextResponse.json(formattedProducts)
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const configCheck = checkSupabaseConfig()
    if (configCheck) return configCheck

    const data = await request.json()
    
    const productData = {
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
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const { data: product, error } = await supabase!
      .from(TABLES.PRODUCTS)
      .insert(productData)
      .select(`
        *,
        category:categoryId (
          name
        )
      `)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }

    // Parse customFields before returning
    const formattedProduct = {
      ...product,
      customFields: product.customFields ? JSON.parse(product.customFields) : {}
    }

    return NextResponse.json(formattedProduct, { status: 201 })
  } catch (error) {
    console.error('Failed to create product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}