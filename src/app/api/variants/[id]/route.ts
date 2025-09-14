import { NextRequest, NextResponse } from 'next/server'

// Product variants feature is not yet implemented in Supabase version
// PUT /api/variants/[id] - Update a variant
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return NextResponse.json({ error: 'Product variants not yet implemented in Supabase version' }, { status: 501 })
}

// DELETE /api/variants/[id] - Delete a variant
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return NextResponse.json({ error: 'Product variants not yet implemented in Supabase version' }, { status: 501 })
}