import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Beverages',
        description: 'Drinks and beverages',
        color: '#3B82F6'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Snacks',
        description: 'Snacks and quick bites',
        color: '#10B981'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Electronics',
        description: 'Electronic devices and accessories',
        color: '#8B5CF6'
      }
    })
  ])

  // Create users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Admin User',
        pin: '1234',
        nfcCode: 'NFC001',
        role: 'ADMIN'
      }
    }),
    prisma.user.create({
      data: {
        name: 'Manager User',
        pin: '5678',
        nfcCode: 'NFC002',
        role: 'MANAGER'
      }
    }),
    prisma.user.create({
      data: {
        name: 'Cashier User',
        pin: '9999',
        nfcCode: 'NFC003',
        role: 'CASHIER'
      }
    })
  ])

  // Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Coca Cola 330ml',
        description: 'Classic Coca Cola in a 330ml can',
        price: 1.50,
        cost: 0.75,
        sku: 'COKE-330',
        barcode: '1234567890123',
        stock: 100,
        minStock: 10,
        categoryId: categories[0].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Pepsi 330ml',
        description: 'Pepsi cola in a 330ml can',
        price: 1.45,
        cost: 0.70,
        sku: 'PEPSI-330',
        barcode: '1234567890124',
        stock: 85,
        minStock: 10,
        categoryId: categories[0].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Potato Chips',
        description: 'Crispy potato chips 150g bag',
        price: 2.25,
        cost: 1.10,
        sku: 'CHIPS-150',
        barcode: '1234567890125',
        stock: 50,
        minStock: 5,
        categoryId: categories[1].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'USB Cable',
        description: 'USB-C to USB-A cable 1m',
        price: 12.99,
        cost: 6.50,
        sku: 'USB-C-1M',
        barcode: '1234567890126',
        stock: 25,
        minStock: 5,
        categoryId: categories[2].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Smartphone Case',
        description: 'Universal smartphone protective case',
        price: 19.99,
        cost: 8.00,
        sku: 'CASE-UNI',
        barcode: '1234567890127',
        stock: 30,
        minStock: 3,
        categoryId: categories[2].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Energy Bar',
        description: 'Chocolate energy bar 60g',
        price: 3.50,
        cost: 1.75,
        sku: 'ENERGY-60',
        barcode: '1234567890128',
        stock: 40,
        minStock: 8,
        categoryId: categories[1].id
      }
    })
  ])

  console.log('Seeded database with:')
  console.log(`- ${categories.length} categories`)
  console.log(`- ${users.length} users`)
  console.log(`- ${products.length} products`)
  console.log('\nTest users:')
  console.log('Admin: PIN 1234 | NFC NFC001')
  console.log('Manager: PIN 5678 | NFC NFC002')
  console.log('Cashier: PIN 9999 | NFC NFC003')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })