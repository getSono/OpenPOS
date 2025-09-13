import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await db.all(`
      SELECT id, name, description, color, createdAt, updatedAt
      FROM categories 
      ORDER BY name ASC
    `)

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const result = await db.run(`
      INSERT INTO categories (name, description, color)
      VALUES (?, ?, ?)
    `, [
      data.name,
      data.description || null,
      data.color || '#000000'
    ])

    const category = await db.get(`
      SELECT id, name, description, color, createdAt, updatedAt
      FROM categories 
      WHERE id = ?
    `, [result.lastID])

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Failed to create category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}