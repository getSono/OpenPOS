import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'
import { randomUUID } from 'crypto'

// GET /api/custom-fields - Get all custom field definitions
export async function GET() {
  try {
    const customFields = await db.all(`
      SELECT * FROM custom_field_definitions
      WHERE isActive = 1
      ORDER BY label ASC
    `)

    // Parse options JSON for each field
    const formattedFields = (customFields as Array<Record<string, unknown> & { options: string; isRequired: number }>).map(field => ({
      ...field,
      options: JSON.parse(field.options || '[]'),
      isRequired: Boolean(field.isRequired)
    }))

    return NextResponse.json(formattedFields)
  } catch (error) {
    console.error('Failed to fetch custom field definitions:', error)
    return NextResponse.json({ error: 'Failed to fetch custom field definitions' }, { status: 500 })
  }
}

// POST /api/custom-fields - Create a new custom field definition
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const fieldId = randomUUID()
    
    await db.run(`
      INSERT INTO custom_field_definitions (id, name, label, type, options, isRequired)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      fieldId,
      data.name,
      data.label,
      data.type,
      JSON.stringify(data.options || []),
      data.isRequired ? 1 : 0
    ])

    const customField = await db.get(`
      SELECT * FROM custom_field_definitions WHERE id = ?
    `, [fieldId])

    if (!customField) {
      return NextResponse.json({ error: 'Failed to retrieve created custom field' }, { status: 500 })
    }

    const formattedField = {
      ...(customField as Record<string, unknown> & { options: string; isRequired: number }),
      options: JSON.parse((customField as { options: string }).options || '[]'),
      isRequired: Boolean((customField as { isRequired: number }).isRequired)
    }

    return NextResponse.json(formattedField, { status: 201 })
  } catch (error) {
    console.error('Failed to create custom field definition:', error)
    return NextResponse.json({ error: 'Failed to create custom field definition' }, { status: 500 })
  }
}