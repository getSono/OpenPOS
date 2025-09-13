import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'
import { randomUUID } from 'crypto'

export async function GET() {
  try {
    const products = await db.all(`
      SELECT p.*, c.name as categoryName 
      FROM products p 
      JOIN categories c ON p.categoryId = c.id 
      WHERE p.isActive = 1 
      ORDER BY p.name ASC
    `)

    // Transform the data to match our interface
    const formattedProducts = (products as Array<Record<string, unknown> & { categoryName: string }>).map(product => ({
      ...product,
      category: { name: product.categoryName }
    }))

    return NextResponse.json(formattedProducts)
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Generate a unique ID for the product
    const productId = randomUUID()
    
    await db.run(`
      INSERT INTO products (id, name, description, price, cost, sku, barcode, stock, minStock, categoryId, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      productId,
      data.name,
      data.description || null,
      parseFloat(data.price),
      data.cost ? parseFloat(data.cost) : 0,
      data.sku || null,
      data.barcode || null,
      parseInt(data.stock) || 0,
      parseInt(data.minStock) || 0,
      data.categoryId,
      data.image || null
    ])

    // Get the created product with category info
    const product = await db.get(`
      SELECT p.*, c.name as categoryName 
      FROM products p 
      JOIN categories c ON p.categoryId = c.id 
      WHERE p.id = ?
    `, [productId])

    if (!product) {
      return NextResponse.json({ error: 'Failed to retrieve created product' }, { status: 500 })
    }

    const formattedProduct = {
      ...(product as Record<string, unknown> & { categoryName: string }),
      category: { name: (product as { categoryName: string }).categoryName }
    }

    return NextResponse.json(formattedProduct, { status: 201 })
  } catch (error) {
    console.error('Failed to create product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}