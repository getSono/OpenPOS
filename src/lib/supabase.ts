import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database table names (matching Prisma schema mapping)
export const TABLES = {
  USERS: 'users',
  WORKERS: 'workers', 
  CATEGORIES: 'categories',
  PRODUCTS: 'products',
  CUSTOMERS: 'customers',
  TRANSACTIONS: 'transactions',
  TRANSACTION_ITEMS: 'transaction_items',
  DISCOUNT_CODES: 'discount_codes',
  RECEIPT_SETTINGS: 'receipt_settings'
} as const

// Enums from Prisma schema
export const ENUMS = {
  Role: {
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER', 
    CASHIER: 'CASHIER'
  },
  PaymentMethod: {
    CASH: 'CASH',
    CARD: 'CARD',
    DIGITAL: 'DIGITAL',
    CHECK: 'CHECK',
    PAYPAL: 'PAYPAL'
  },
  TransactionStatus: {
    PENDING: 'PENDING',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    REFUNDED: 'REFUNDED'
  },
  OrderStatus: {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    READY: 'READY',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
  },
  DiscountType: {
    PERCENTAGE: 'PERCENTAGE',
    FIXED_AMOUNT: 'FIXED_AMOUNT'
  }
} as const

export default supabase