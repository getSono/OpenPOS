import { NextRequest, NextResponse } from 'next/server'

// Product variants feature is not yet implemented in Supabase version
// GET /api/products/[id]/variants - Get all variants for a product
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return NextResponse.json({ error: 'Product variants not yet implemented in Supabase version' }, { status: 501 })
}

// POST /api/products/[id]/variants - Create a new variant for a product
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return NextResponse.json({ error: 'Product variants not yet implemented in Supabase version' }, { status: 501 })
}