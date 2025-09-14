const { PrismaClient } = require('@prisma/client');
const sqlite3 = require('sqlite3');
const { promisify } = require('util');

// Enum type definitions (matching Prisma schema)
enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER'
}

enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  DIGITAL = 'DIGITAL',
  CHECK = 'CHECK',
  PAYPAL = 'PAYPAL'
}

enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

enum OrderStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT'
}

// Initialize Prisma client for PostgreSQL (Supabase)
const prismaPostgres = new PrismaClient()

// SQLite connection
const sqliteDb = new sqlite3.Database('./prisma/dev.db')
const sqliteGet = promisify(sqliteDb.get.bind(sqliteDb))
const sqliteAll = promisify(sqliteDb.all.bind(sqliteDb))

interface MigrationStats {
  categories: number
  users: number
  workers: number
  customers: number
  discountCodes: number
  products: number
  transactions: number
  transactionItems: number
}

// Type definitions for SQLite records
interface SQLiteCategory {
  id: string
  name: string
  description: string | null
  color: string | null
  createdAt: string
  updatedAt: string
}

interface SQLiteUser {
  id: string
  name: string
  pin: string
  nfcCode: string | null
  role: string
  isActive: number
  createdAt: string
  updatedAt: string
}

interface SQLiteWorker {
  id: string
  name: string
  pin: string
  nfcCode: string | null
  isActive: number
  currentStation: string | null
  createdAt: string
  updatedAt: string
}

interface SQLiteCustomer {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  address: string | null
  createdAt: string
  updatedAt: string
}

interface SQLiteDiscountCode {
  id: string
  code: string
  name: string
  description: string | null
  type: string
  value: number
  minAmount: number | null
  maxUses: number | null
  currentUses: number
  isActive: number
  validFrom: string
  validUntil: string | null
  createdAt: string
  updatedAt: string
}

interface SQLiteProduct {
  id: string
  name: string
  description: string | null
  price: number
  cost: number | null
  sku: string | null
  barcode: string | null
  stock: number
  minStock: number
  isActive: number
  image: string | null
  categoryId: string
  createdAt: string
  updatedAt: string
}

interface SQLiteTransaction {
  id: string
  receiptNumber: string
  orderNumber: number
  subtotal: number
  tax: number
  discount: number
  total: number
  amountPaid: number | null
  changeAmount: number | null
  paymentMethod: string
  status: string
  orderStatus: string
  notes: string | null
  userId: string
  customerId: string | null
  workerId: string | null
  discountCodeId: string | null
  createdAt: string
  updatedAt: string
}

interface SQLiteTransactionItem {
  id: string
  quantity: number
  unitPrice: number
  totalPrice: number
  transactionId: string
  productId: string
}

// Utility functions to convert string values to proper enum types
function parseRole(role: string): Role {
  switch (role.toUpperCase()) {
    case 'ADMIN':
      return Role.ADMIN
    case 'MANAGER':
      return Role.MANAGER
    case 'CASHIER':
      return Role.CASHIER
    default:
      console.warn(`Unknown role: ${role}, defaulting to CASHIER`)
      return Role.CASHIER
  }
}

function parsePaymentMethod(method: string): PaymentMethod {
  switch (method.toUpperCase()) {
    case 'CASH':
      return PaymentMethod.CASH
    case 'CARD':
      return PaymentMethod.CARD
    case 'DIGITAL':
      return PaymentMethod.DIGITAL
    case 'CHECK':
      return PaymentMethod.CHECK
    case 'PAYPAL':
      return PaymentMethod.PAYPAL
    default:
      console.warn(`Unknown payment method: ${method}, defaulting to CASH`)
      return PaymentMethod.CASH
  }
}

function parseTransactionStatus(status: string): TransactionStatus {
  switch (status.toUpperCase()) {
    case 'PENDING':
      return TransactionStatus.PENDING
    case 'COMPLETED':
      return TransactionStatus.COMPLETED
    case 'CANCELLED':
      return TransactionStatus.CANCELLED
    case 'REFUNDED':
      return TransactionStatus.REFUNDED
    default:
      console.warn(`Unknown transaction status: ${status}, defaulting to COMPLETED`)
      return TransactionStatus.COMPLETED
  }
}

function parseOrderStatus(status: string): OrderStatus {
  switch (status.toUpperCase()) {
    case 'PENDING':
      return OrderStatus.PENDING
    case 'IN_PROGRESS':
      return OrderStatus.IN_PROGRESS
    case 'READY':
      return OrderStatus.READY
    case 'COMPLETED':
      return OrderStatus.COMPLETED
    case 'CANCELLED':
      return OrderStatus.CANCELLED
    default:
      console.warn(`Unknown order status: ${status}, defaulting to PENDING`)
      return OrderStatus.PENDING
  }
}

function parseDiscountType(type: string): DiscountType {
  switch (type.toUpperCase()) {
    case 'PERCENTAGE':
      return DiscountType.PERCENTAGE
    case 'FIXED_AMOUNT':
      return DiscountType.FIXED_AMOUNT
    default:
      console.warn(`Unknown discount type: ${type}, defaulting to PERCENTAGE`)
      return DiscountType.PERCENTAGE
  }
}

async function checkSQLiteDatabase(): Promise<boolean> {
  try {
    const result = await sqliteGet("SELECT name FROM sqlite_master WHERE type='table'")
    return !!result
  } catch (error) {
    console.error('SQLite database not found or cannot be accessed:', error)
    return false
  }
}

async function migrateCategories(): Promise<number> {
  console.log('Migrating categories...')
  const categories = await sqliteAll('SELECT * FROM categories ORDER BY createdAt') as SQLiteCategory[]
  
  let count = 0
  for (const category of categories) {
    try {
      await prismaPostgres.category.upsert({
        where: { id: category.id },
        update: {
          name: category.name,
          description: category.description,
          color: category.color,
          createdAt: new Date(category.createdAt),
          updatedAt: new Date(category.updatedAt)
        },
        create: {
          id: category.id,
          name: category.name,
          description: category.description,
          color: category.color,
          createdAt: new Date(category.createdAt),
          updatedAt: new Date(category.updatedAt)
        }
      })
      count++
    } catch (error) {
      console.error(`Error migrating category ${category.id}:`, error)
    }
  }
  
  console.log(`✓ Migrated ${count} categories`)
  return count
}

async function migrateUsers(): Promise<number> {
  console.log('Migrating users...')
  const users = await sqliteAll('SELECT * FROM users ORDER BY createdAt') as SQLiteUser[]
  
  let count = 0
  for (const user of users) {
    try {
      await prismaPostgres.user.upsert({
        where: { id: user.id },
        update: {
          name: user.name,
          pin: user.pin,
          nfcCode: user.nfcCode,
          role: parseRole(user.role),
          isActive: Boolean(user.isActive),
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        },
        create: {
          id: user.id,
          name: user.name,
          pin: user.pin,
          nfcCode: user.nfcCode,
          role: parseRole(user.role),
          isActive: Boolean(user.isActive),
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        }
      })
      count++
    } catch (error) {
      console.error(`Error migrating user ${user.id}:`, error)
    }
  }
  
  console.log(`✓ Migrated ${count} users`)
  return count
}

async function migrateWorkers(): Promise<number> {
  console.log('Migrating workers...')
  const workers = await sqliteAll('SELECT * FROM workers ORDER BY createdAt') as SQLiteWorker[]
  
  let count = 0
  for (const worker of workers) {
    try {
      await prismaPostgres.worker.upsert({
        where: { id: worker.id },
        update: {
          name: worker.name,
          pin: worker.pin,
          nfcCode: worker.nfcCode,
          isActive: Boolean(worker.isActive),
          currentStation: worker.currentStation,
          createdAt: new Date(worker.createdAt),
          updatedAt: new Date(worker.updatedAt)
        },
        create: {
          id: worker.id,
          name: worker.name,
          pin: worker.pin,
          nfcCode: worker.nfcCode,
          isActive: Boolean(worker.isActive),
          currentStation: worker.currentStation,
          createdAt: new Date(worker.createdAt),
          updatedAt: new Date(worker.updatedAt)
        }
      })
      count++
    } catch (error) {
      console.error(`Error migrating worker ${worker.id}:`, error)
    }
  }
  
  console.log(`✓ Migrated ${count} workers`)
  return count
}

async function migrateCustomers(): Promise<number> {
  console.log('Migrating customers...')
  const customers = await sqliteAll('SELECT * FROM customers ORDER BY createdAt') as SQLiteCustomer[]
  
  let count = 0
  for (const customer of customers) {
    try {
      await prismaPostgres.customer.upsert({
        where: { id: customer.id },
        update: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          createdAt: new Date(customer.createdAt),
          updatedAt: new Date(customer.updatedAt)
        },
        create: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          createdAt: new Date(customer.createdAt),
          updatedAt: new Date(customer.updatedAt)
        }
      })
      count++
    } catch (error) {
      console.error(`Error migrating customer ${customer.id}:`, error)
    }
  }
  
  console.log(`✓ Migrated ${count} customers`)
  return count
}

async function migrateDiscountCodes(): Promise<number> {
  console.log('Migrating discount codes...')
  const discountCodes = await sqliteAll('SELECT * FROM discount_codes ORDER BY createdAt') as SQLiteDiscountCode[]
  
  let count = 0
  for (const discountCode of discountCodes) {
    try {
      await prismaPostgres.discountCode.upsert({
        where: { id: discountCode.id },
        update: {
          code: discountCode.code,
          name: discountCode.name,
          description: discountCode.description,
          type: parseDiscountType(discountCode.type),
          value: Number(discountCode.value),
          minAmount: discountCode.minAmount ? Number(discountCode.minAmount) : null,
          maxUses: discountCode.maxUses,
          currentUses: discountCode.currentUses || 0,
          isActive: Boolean(discountCode.isActive),
          validFrom: new Date(discountCode.validFrom),
          validUntil: discountCode.validUntil ? new Date(discountCode.validUntil) : null,
          createdAt: new Date(discountCode.createdAt),
          updatedAt: new Date(discountCode.updatedAt)
        },
        create: {
          id: discountCode.id,
          code: discountCode.code,
          name: discountCode.name,
          description: discountCode.description,
          type: parseDiscountType(discountCode.type),
          value: Number(discountCode.value),
          minAmount: discountCode.minAmount ? Number(discountCode.minAmount) : null,
          maxUses: discountCode.maxUses,
          currentUses: discountCode.currentUses || 0,
          isActive: Boolean(discountCode.isActive),
          validFrom: new Date(discountCode.validFrom),
          validUntil: discountCode.validUntil ? new Date(discountCode.validUntil) : null,
          createdAt: new Date(discountCode.createdAt),
          updatedAt: new Date(discountCode.updatedAt)
        }
      })
      count++
    } catch (error) {
      console.error(`Error migrating discount code ${discountCode.id}:`, error)
    }
  }
  
  console.log(`✓ Migrated ${count} discount codes`)
  return count
}

async function migrateProducts(): Promise<number> {
  console.log('Migrating products...')
  const products = await sqliteAll('SELECT * FROM products ORDER BY createdAt') as SQLiteProduct[]
  
  let count = 0
  for (const product of products) {
    try {
      await prismaPostgres.product.upsert({
        where: { id: product.id },
        update: {
          name: product.name,
          description: product.description,
          price: Number(product.price),
          cost: product.cost ? Number(product.cost) : null,
          sku: product.sku,
          barcode: product.barcode,
          stock: product.stock || 0,
          minStock: product.minStock || 0,
          isActive: Boolean(product.isActive),
          image: product.image,
          categoryId: product.categoryId,
          createdAt: new Date(product.createdAt),
          updatedAt: new Date(product.updatedAt)
        },
        create: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: Number(product.price),
          cost: product.cost ? Number(product.cost) : null,
          sku: product.sku,
          barcode: product.barcode,
          stock: product.stock || 0,
          minStock: product.minStock || 0,
          isActive: Boolean(product.isActive),
          image: product.image,
          categoryId: product.categoryId,
          createdAt: new Date(product.createdAt),
          updatedAt: new Date(product.updatedAt)
        }
      })
      count++
    } catch (error) {
      console.error(`Error migrating product ${product.id}:`, error)
    }
  }
  
  console.log(`✓ Migrated ${count} products`)
  return count
}

async function migrateTransactions(): Promise<number> {
  console.log('Migrating transactions...')
  const transactions = await sqliteAll('SELECT * FROM transactions ORDER BY createdAt') as SQLiteTransaction[]
  
  let count = 0
  for (const transaction of transactions) {
    try {
      await prismaPostgres.transaction.upsert({
        where: { id: transaction.id },
        update: {
          receiptNumber: transaction.receiptNumber,
          orderNumber: transaction.orderNumber,
          subtotal: Number(transaction.subtotal),
          tax: Number(transaction.tax) || 0,
          discount: Number(transaction.discount) || 0,
          total: Number(transaction.total),
          amountPaid: transaction.amountPaid ? Number(transaction.amountPaid) : null,
          changeAmount: Number(transaction.changeAmount) || 0,
          paymentMethod: parsePaymentMethod(transaction.paymentMethod),
          status: parseTransactionStatus(transaction.status),
          orderStatus: parseOrderStatus(transaction.orderStatus),
          notes: transaction.notes,
          userId: transaction.userId,
          customerId: transaction.customerId,
          workerId: transaction.workerId,
          discountCodeId: transaction.discountCodeId,
          createdAt: new Date(transaction.createdAt),
          updatedAt: new Date(transaction.updatedAt)
        },
        create: {
          id: transaction.id,
          receiptNumber: transaction.receiptNumber,
          orderNumber: transaction.orderNumber,
          subtotal: Number(transaction.subtotal),
          tax: Number(transaction.tax) || 0,
          discount: Number(transaction.discount) || 0,
          total: Number(transaction.total),
          amountPaid: transaction.amountPaid ? Number(transaction.amountPaid) : null,
          changeAmount: Number(transaction.changeAmount) || 0,
          paymentMethod: parsePaymentMethod(transaction.paymentMethod),
          status: parseTransactionStatus(transaction.status),
          orderStatus: parseOrderStatus(transaction.orderStatus),
          notes: transaction.notes,
          userId: transaction.userId,
          customerId: transaction.customerId,
          workerId: transaction.workerId,
          discountCodeId: transaction.discountCodeId,
          createdAt: new Date(transaction.createdAt),
          updatedAt: new Date(transaction.updatedAt)
        }
      })
      count++
    } catch (error) {
      console.error(`Error migrating transaction ${transaction.id}:`, error)
    }
  }
  
  console.log(`✓ Migrated ${count} transactions`)
  return count
}

async function migrateTransactionItems(): Promise<number> {
  console.log('Migrating transaction items...')
  const transactionItems = await sqliteAll('SELECT * FROM transaction_items') as SQLiteTransactionItem[]
  
  let count = 0
  for (const item of transactionItems) {
    try {
      await prismaPostgres.transactionItem.upsert({
        where: { id: item.id },
        update: {
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
          transactionId: item.transactionId,
          productId: item.productId
        },
        create: {
          id: item.id,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
          transactionId: item.transactionId,
          productId: item.productId
        }
      })
      count++
    } catch (error) {
      console.error(`Error migrating transaction item ${item.id}:`, error)
    }
  }
  
  console.log(`✓ Migrated ${count} transaction items`)
  return count
}

async function verifyMigration(): Promise<void> {
  console.log('\n🔍 Verifying migration...')
  
  // Count records in PostgreSQL
  const stats = {
    categories: await prismaPostgres.category.count(),
    users: await prismaPostgres.user.count(),
    workers: await prismaPostgres.worker.count(),
    customers: await prismaPostgres.customer.count(),
    discountCodes: await prismaPostgres.discountCode.count(),
    products: await prismaPostgres.product.count(),
    transactions: await prismaPostgres.transaction.count(),
    transactionItems: await prismaPostgres.transactionItem.count(),
  }
  
  console.log('📊 Final counts in PostgreSQL:')
  console.log(`- Categories: ${stats.categories}`)
  console.log(`- Users: ${stats.users}`)
  console.log(`- Workers: ${stats.workers}`)
  console.log(`- Customers: ${stats.customers}`)
  console.log(`- Discount Codes: ${stats.discountCodes}`)
  console.log(`- Products: ${stats.products}`)
  console.log(`- Transactions: ${stats.transactions}`)
  console.log(`- Transaction Items: ${stats.transactionItems}`)
  
  // Test some relationships
  console.log('\n🔗 Testing relationships...')
  const productWithCategory = await prismaPostgres.product.findFirst({
    include: { category: true }
  })
  if (productWithCategory?.category) {
    console.log(`✓ Product-Category relationship verified`)
  }
  
  const transactionWithItems = await prismaPostgres.transaction.findFirst({
    include: { items: true, user: true }
  })
  if (transactionWithItems?.items.length) {
    console.log(`✓ Transaction-Items relationship verified`)
  }
  if (transactionWithItems?.user) {
    console.log(`✓ Transaction-User relationship verified`)
  }
}

async function main() {
  console.log('🚀 Starting OpenPOS SQLite to Supabase PostgreSQL migration...\n')
  
  // Check if SQLite database exists
  const sqliteExists = await checkSQLiteDatabase()
  if (!sqliteExists) {
    console.error('❌ SQLite database not found. Please ensure dev.db exists in the prisma directory.')
    process.exit(1)
  }
  
  try {
    // Test PostgreSQL connection
    await prismaPostgres.$connect()
    console.log('✓ Connected to PostgreSQL (Supabase)')
    
    // Perform migration in order (respecting foreign key dependencies)
    const stats: MigrationStats = {
      categories: await migrateCategories(),
      users: await migrateUsers(),
      workers: await migrateWorkers(),
      customers: await migrateCustomers(),
      discountCodes: await migrateDiscountCodes(),
      products: await migrateProducts(),
      transactions: await migrateTransactions(),
      transactionItems: await migrateTransactionItems(),
    }
    
    await verifyMigration()
    
    console.log('\n🎉 Migration completed successfully!')
    console.log('📝 Summary:')
    Object.entries(stats).forEach(([table, count]) => {
      console.log(`- ${table}: ${count} records migrated`)
    })
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prismaPostgres.$disconnect()
    sqliteDb.close()
  }
}

// Handle script execution
if (require.main === module) {
  main()
    .catch((error) => {
      console.error('Migration error:', error)
      process.exit(1)
    })
}

export { main as migrateSQLiteToSupabase }