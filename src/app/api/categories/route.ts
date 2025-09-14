import { NextRequest, NextResponse } from 'next/server'
import { supabase, TABLES, checkSupabaseConfig } from '@/lib/supabase'

export async function GET() {
  try {
    const configCheck = checkSupabaseConfig()
    if (configCheck) return configCheck

    const { data: categories, error } = await supabase!
      .from(TABLES.CATEGORIES)
      .select('id, name, description, color, createdAt, updatedAt')
      .order('name', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const configCheck = checkSupabaseConfig()
    if (configCheck) return configCheck

    const data = await request.json()
    
    const categoryData = {
      name: data.name,
      description: data.description || null,
      color: data.color || '#000000',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const { data: category, error } = await supabase!
      .from(TABLES.CATEGORIES)
      .insert(categoryData)
      .select('id, name, description, color, createdAt, updatedAt')
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Failed to create category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}