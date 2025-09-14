import { NextRequest, NextResponse } from 'next/server'
import { supabase, TABLES, checkSupabaseConfig } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const configCheck = checkSupabaseConfig()
    if (configCheck) return configCheck

    const { code, orderTotal } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Discount code is required' }, { status: 400 })
    }

    // Find the discount code
    const { data: discountCode, error } = await supabase!
      .from(TABLES.DISCOUNT_CODES)
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('isActive', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Invalid discount code' }, { status: 404 })
      }
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to validate discount code' }, { status: 500 })
    }

    // Check if discount code is still valid (date range)
    const now = new Date()
    const validFrom = new Date(discountCode.validFrom)
    const validUntil = discountCode.validUntil ? new Date(discountCode.validUntil) : null

    if (now < validFrom) {
      return NextResponse.json({ error: 'Discount code is not yet active' }, { status: 400 })
    }

    if (validUntil && now > validUntil) {
      return NextResponse.json({ error: 'Discount code has expired' }, { status: 400 })
    }

    // Check usage limits
    if (discountCode.maxUses && discountCode.currentUses >= discountCode.maxUses) {
      return NextResponse.json({ error: 'Discount code has reached maximum usage limit' }, { status: 400 })
    }

    // Check minimum order amount
    if (discountCode.minAmount && orderTotal < discountCode.minAmount) {
      return NextResponse.json({ 
        error: `Minimum order amount of $${discountCode.minAmount.toFixed(2)} required for this discount` 
      }, { status: 400 })
    }

    // Calculate discount amount
    let discountAmount = 0
    if (discountCode.type === 'PERCENTAGE') {
      discountAmount = orderTotal * (discountCode.value / 100)
    } else if (discountCode.type === 'FIXED_AMOUNT') {
      discountAmount = Math.min(discountCode.value, orderTotal) // Can't discount more than order total
    }

    return NextResponse.json({
      valid: true,
      discountCode: {
        id: discountCode.id,
        code: discountCode.code,
        name: discountCode.name,
        type: discountCode.type,
        value: discountCode.value,
        discountAmount: Math.round(discountAmount * 100) / 100 // Round to 2 decimal places
      }
    })

  } catch (error) {
    console.error('Failed to validate discount code:', error)
    return NextResponse.json({ error: 'Failed to validate discount code' }, { status: 500 })
  }
}