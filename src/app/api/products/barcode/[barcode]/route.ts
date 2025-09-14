import { NextRequest, NextResponse } from 'next/server'
import { supabase, TABLES, checkSupabaseConfig } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barcode: string }> }
) {
  try {
    const configCheck = checkSupabaseConfig()
    if (configCheck) return configCheck

    const { barcode } = await params

    if (!barcode) {
      return NextResponse.json(
        { error: 'Barcode is required' },
        { status: 400 }
      )
    }

    // Find product by barcode
    const { data: product, error } = await supabase!
      .from(TABLES.PRODUCTS)
      .select(`
        *,
        category:categoryId (
          name
        )
      `)
      .eq('barcode', barcode)
      .eq('isActive', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to find product' },
        { status: 500 }
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