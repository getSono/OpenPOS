import { NextRequest, NextResponse } from 'next/server'

// Mock custom field definitions for now
const mockCustomFields = [
  {
    id: 'brand',
    name: 'brand',
    label: 'Brand',
    type: 'text',
    options: [],
    isRequired: false
  },
  {
    id: 'color',
    name: 'color',
    label: 'Color',
    type: 'select',
    options: ['Red', 'Blue', 'Green', 'Black', 'White'],
    isRequired: false
  },
  {
    id: 'warranty',
    name: 'warranty',
    label: 'Warranty (months)',
    type: 'number',
    options: [],
    isRequired: false
  },
  {
    id: 'featured',
    name: 'featured',
    label: 'Featured Product',
    type: 'boolean',
    options: [],
    isRequired: false
  }
]

// GET /api/custom-fields - Get all custom field definitions
export async function GET() {
  try {
    // Return mock data for now
    return NextResponse.json(mockCustomFields)
  } catch (error) {
    console.error('Failed to fetch custom field definitions:', error)
    return NextResponse.json({ error: 'Failed to fetch custom field definitions' }, { status: 500 })
  }
}

// POST /api/custom-fields - Create a new custom field definition
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // For now, just return the data as if it was created
    const newField = {
      id: data.name,
      name: data.name,
      label: data.label,
      type: data.type,
      options: data.options || [],
      isRequired: data.isRequired || false
    }

    return NextResponse.json(newField, { status: 201 })
  } catch (error) {
    console.error('Failed to create custom field definition:', error)
    return NextResponse.json({ error: 'Failed to create custom field definition' }, { status: 500 })
  }
}