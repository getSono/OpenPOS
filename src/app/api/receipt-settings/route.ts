import { NextRequest, NextResponse } from 'next/server'
import { supabase, TABLES, checkSupabaseConfig } from '@/lib/supabase'

export async function GET() {
  try {
    const configCheck = checkSupabaseConfig()
    if (configCheck) return configCheck

    let { data: settings, error } = await supabase!
      .from(TABLES.RECEIPT_SETTINGS)
      .select('*')
      .eq('isActive', true)
      .single()

    // If no settings exist, create default ones
    if (error && error.code === 'PGRST116') {
      const { data: newSettings, error: createError } = await supabase!
        .from(TABLES.RECEIPT_SETTINGS)
        .insert({
          businessName: "OpenPOS",
          footerText: "Thank you for shopping with us!",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select('*')
        .single()

      if (createError) {
        console.error('Supabase error creating settings:', createError)
        return NextResponse.json(
          { error: 'Failed to create receipt settings' },
          { status: 500 }
        )
      }

      settings = newSettings
    } else if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch receipt settings' },
        { status: 500 }
      )
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching receipt settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch receipt settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const configCheck = checkSupabaseConfig()
    if (configCheck) return configCheck

    const data = await request.json()
    
    // Get current active settings
    const { data: currentSettings } = await supabase!
      .from(TABLES.RECEIPT_SETTINGS)
      .select('*')
      .eq('isActive', true)
      .single()

    let settings
    if (currentSettings) {
      // Update existing settings
      const { data: updatedSettings, error } = await supabase!
        .from(TABLES.RECEIPT_SETTINGS)
        .update({
          businessName: data.businessName,
          headerText: data.headerText,
          footerText: data.footerText,
          logoUrl: data.logoUrl,
          address: data.address,
          phone: data.phone,
          email: data.email,
          website: data.website,
          updatedAt: new Date().toISOString()
        })
        .eq('id', currentSettings.id)
        .select('*')
        .single()

      if (error) {
        console.error('Supabase error updating settings:', error)
        return NextResponse.json(
          { error: 'Failed to update receipt settings' },
          { status: 500 }
        )
      }

      settings = updatedSettings
    } else {
      // Create new settings
      const { data: newSettings, error } = await supabase!
        .from(TABLES.RECEIPT_SETTINGS)
        .insert({
          businessName: data.businessName || "OpenPOS",
          headerText: data.headerText,
          footerText: data.footerText || "Thank you for shopping with us!",
          logoUrl: data.logoUrl,
          address: data.address,
          phone: data.phone,
          email: data.email,
          website: data.website,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select('*')
        .single()

      if (error) {
        console.error('Supabase error creating settings:', error)
        return NextResponse.json(
          { error: 'Failed to create receipt settings' },
          { status: 500 }
        )
      }

      settings = newSettings
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating receipt settings:', error)
    return NextResponse.json(
      { error: 'Failed to update receipt settings' },
      { status: 500 }
    )
  }
}