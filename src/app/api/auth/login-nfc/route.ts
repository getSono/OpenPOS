import { NextRequest, NextResponse } from 'next/server'
import { supabase, TABLES, checkSupabaseConfig } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const configCheck = checkSupabaseConfig()
    if (configCheck) return configCheck

    const { nfcCode } = await request.json()

    if (!nfcCode || typeof nfcCode !== 'string') {
      return NextResponse.json({ error: 'NFC code is required' }, { status: 400 })
    }

    // Find user by NFC code
    const { data: user, error } = await supabase!
      .from(TABLES.USERS)
      .select('id, name, role')
      .eq('nfcCode', nfcCode.trim())
      .eq('isActive', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Invalid NFC code' }, { status: 401 })
      }
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('NFC login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}