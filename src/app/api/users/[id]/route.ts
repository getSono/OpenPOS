import { NextRequest, NextResponse } from 'next/server'
import { supabase, TABLES, checkSupabaseConfig } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// GET /api/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const configCheck = checkSupabaseConfig()
    if (configCheck) return configCheck

    const { id } = await params
    const { data: user, error } = await supabase!
      .from(TABLES.USERS)
      .select('id, name, role, nfcCode, isActive, createdAt, updatedAt')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const configCheck = checkSupabaseConfig()
    if (configCheck) return configCheck

    const { id } = await params
    const { name, pin, role, nfcCode, isActive } = await request.json()

    // Check if user exists
  const { data: existingUser, error: findError } = await supabase!
      .from(TABLES.USERS)
      .select('id, role')
      .eq('id', id)
      .single()

    if (findError) {
      if (findError.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      console.error('Supabase error:', findError)
      return NextResponse.json({ error: 'Failed to find user' }, { status: 500 })
    }

    // Validate required fields
    if (!name || !role) {
      return NextResponse.json(
        { error: 'Name and role are required' }, 
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['ADMIN', 'MANAGER', 'CASHIER']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be ADMIN, MANAGER, or CASHIER' }, 
        { status: 400 }
      )
    }

    let hashedPin = undefined
    
    // If PIN is being updated, validate and hash it
    if (pin) {
      if (!/^\d{4,6}$/.test(pin)) {
        return NextResponse.json(
          { error: 'PIN must be 4-6 digits' }, 
          { status: 400 }
        )
      }

      // Check if PIN already exists (exclude current user)
  const { data: existingPin } = await supabase!
        .from(TABLES.USERS)
        .select('id')
        .eq('pin', pin)
        .neq('id', id)
        .single()

      if (existingPin) {
        return NextResponse.json(
          { error: 'PIN already exists' }, 
          { status: 400 }
        )
      }

      hashedPin = await bcrypt.hash(pin, 10)
    }

    // Check if NFC code already exists (if provided and exclude current user)
    if (nfcCode) {
  const { data: existingNFC } = await supabase!
        .from(TABLES.USERS)
        .select('id')
        .eq('nfcCode', nfcCode)
        .neq('id', id)
        .single()

      if (existingNFC) {
        return NextResponse.json(
          { error: 'NFC code already exists' }, 
          { status: 400 }
        )
      }
    }

    // Build update data
    const updateData: any = {
      name,
      role: role,
      updatedAt: new Date().toISOString()
    }

    if (hashedPin) {
      updateData.pin = hashedPin
    }

    if (nfcCode !== undefined) {
      updateData.nfcCode = nfcCode || null
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive
    }

    // Update user
  const { data: updatedUser, error: updateError } = await supabase!
      .from(TABLES.USERS)
      .update(updateData)
      .eq('id', id)
      .select('id, name, role, nfcCode, isActive, createdAt, updatedAt')
      .single()

    if (updateError) {
      console.error('Supabase error:', updateError)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const configCheck = checkSupabaseConfig()
    if (configCheck) return configCheck

    const { id } = await params
    
    // Check if user exists
  const { data: existingUser, error: findError } = await supabase!
      .from(TABLES.USERS)
      .select('id, role')
      .eq('id', id)
      .single()

    if (findError) {
      if (findError.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      console.error('Supabase error:', findError)
      return NextResponse.json({ error: 'Failed to find user' }, { status: 500 })
    }

    // Check if user has any transactions (prevent deletion if they do)
  const { data: hasTransactions } = await supabase!
      .from(TABLES.TRANSACTIONS)
      .select('id')
      .eq('userId', id)
      .limit(1)
      .single()
    
    if (hasTransactions) {
      return NextResponse.json({
        error: 'Cannot delete user with existing transactions. Deactivate user instead.'
      }, { status: 400 })
    }

    // Count total admin users
  const { count: adminCount } = await supabase!
      .from(TABLES.USERS)
      .select('*', { count: 'exact', head: true })
      .eq('role', 'ADMIN')
      .eq('isActive', true)

    // Prevent deletion of the last admin user
    if (existingUser.role === 'ADMIN' && (adminCount || 0) <= 1) {
      return NextResponse.json({
        error: 'Cannot delete the last admin user'
      }, { status: 400 })
    }

    // Delete user
  const { error: deleteError } = await supabase!
      .from(TABLES.USERS)
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Supabase error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}