import { NextRequest, NextResponse } from 'next/server'
import { supabase, TABLES, checkSupabaseConfig } from '@/lib/supabase'

export async function GET() {
  try {
    const configCheck = checkSupabaseConfig()
    if (configCheck) return configCheck

    const { data: orders, error } = await supabase!
      .from(TABLES.TRANSACTIONS)
      .select(`
        *,
        user:users (
          name
        ),
        worker:workers (
          name
        ),
        items:transaction_items (
          *,
          product:products (
            name,
            description
          )
        )
      `)
      .eq('status', 'COMPLETED')
      .order('createdAt', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}