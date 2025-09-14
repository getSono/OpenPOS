import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    let settings = await prisma.receiptSettings.findFirst({
      where: { isActive: true }
    })

    // If no settings exist, create default ones
    if (!settings) {
      settings = await prisma.receiptSettings.create({
        data: {
          businessName: "OpenPOS",
          footerText: "Thank you for shopping with us!",
          isActive: true
        }
      })
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
    const data = await request.json()
    
    // Get current active settings
    const currentSettings = await prisma.receiptSettings.findFirst({
      where: { isActive: true }
    })

    let settings
    if (currentSettings) {
      // Update existing settings
      settings = await prisma.receiptSettings.update({
        where: { id: currentSettings.id },
        data: {
          businessName: data.businessName,
          headerText: data.headerText,
          footerText: data.footerText,
          logoUrl: data.logoUrl,
          address: data.address,
          phone: data.phone,
          email: data.email,
          website: data.website
        }
      })
    } else {
      // Create new settings
      settings = await prisma.receiptSettings.create({
        data: {
          businessName: data.businessName || "OpenPOS",
          headerText: data.headerText,
          footerText: data.footerText || "Thank you for shopping with us!",
          logoUrl: data.logoUrl,
          address: data.address,
          phone: data.phone,
          email: data.email,
          website: data.website,
          isActive: true
        }
      })
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