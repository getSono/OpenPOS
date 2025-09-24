import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Only throw error if both are missing and not in build time
if ((!supabaseUrl || !supabaseKey) && process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  console.warn('Missing Supabase environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

// Helper function to check if Supabase is configured
export function checkSupabaseConfig() {
  if (!supabase) {
    return NextResponse.json({ 
      error: 'Database not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.' 
    }, { status: 500 })
  }
  return null
}

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