import { PrismaClient } from '@prisma/client'
import sqlite3 from 'sqlite3'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'

// Color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  info: string[]
}

interface SQLiteTable {
  name: string
}

interface SQLiteCount {
  count: number
}

async function validateEnvironmentVariables(): Promise<Partial<ValidationResult>> {
  const errors: string[] = []
  const warnings: string[] = []
  const info: string[] = []

  // Check if .env.local exists
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) {
    errors.push('Missing .env.local file. Copy .env.example and configure your Supabase credentials.')
  } else {
    info.push('✓ Found .env.local file')
  }

  // Check DATABASE_URL
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    errors.push('DATABASE_URL environment variable is not set')
  } else if (dbUrl.includes('postgresql://')) {
    info.push('✓ DATABASE_URL is configured for PostgreSQL')
    if (dbUrl.includes('[YOUR_')) {
      warnings.push('DATABASE_URL contains placeholder values. Please update with your actual Supabase credentials.')
    }
  } else {
    warnings.push('DATABASE_URL does not appear to be a PostgreSQL connection string')
  }

  return { errors, warnings, info }
}

async function validateSQLiteDatabase(): Promise<Partial<ValidationResult>> {
  const errors: string[] = []
  const info: string[] = []

  const sqlitePath = path.join(process.cwd(), 'prisma', 'dev.db')
  
  if (!fs.existsSync(sqlitePath)) {
    errors.push('SQLite database (prisma/dev.db) not found. Run "npm run db:push && npm run db:seed" to create it.')
    return { errors, info }
  }

  info.push('✓ Found SQLite database')

  // Check database content
  try {
    const db = new sqlite3.Database(sqlitePath)
    const all = promisify(db.all.bind(db))

    // Check if tables exist
    const tables = await all("SELECT name FROM sqlite_master WHERE type='table'") as SQLiteTable[]
    const tableNames = tables.map(t => t.name)
    
    const expectedTables = [
      'users', 'workers', 'categories', 'products', 
      'customers', 'transactions', 'transaction_items', 'discount_codes'
    ]

    const missingTables = expectedTables.filter(table => !tableNames.includes(table))
    if (missingTables.length > 0) {
      errors.push(`Missing tables in SQLite: ${missingTables.join(', ')}. Run "npm run db:push" to create them.`)
    } else {
      info.push('✓ All required tables exist in SQLite')
    }

    // Check for data
    const dataCounts: Record<string, number> = {}
    for (const table of expectedTables) {
      if (tableNames.includes(table)) {
        const result = await all(`SELECT COUNT(*) as count FROM ${table}`) as SQLiteCount[]
        dataCounts[table] = result[0].count
      }
    }

    const totalRecords = Object.values(dataCounts).reduce((a, b) => a + b, 0)
    if (totalRecords === 0) {
      errors.push('SQLite database is empty. Run "npm run db:seed" to add sample data.')
    } else {
      info.push(`✓ Found ${totalRecords} total records in SQLite`)
      Object.entries(dataCounts).forEach(([table, count]) => {
        if (count > 0) {
          info.push(`  - ${table}: ${count} records`)
        }
      })
    }

    db.close()
  } catch (error) {
    errors.push(`Error reading SQLite database: ${error}`)
  }

  return { errors, info }
}

async function validatePostgreSQLConnection(): Promise<Partial<ValidationResult>> {
  const errors: string[] = []
  const warnings: string[] = []
  const info: string[] = []

  if (!process.env.DATABASE_URL) {
    errors.push('Cannot test PostgreSQL connection: DATABASE_URL not configured')
    return { errors, warnings, info }
  }

  try {
    const prisma = new PrismaClient()
    await prisma.$connect()
    info.push('✓ Successfully connected to PostgreSQL (Supabase)')

    // Check if tables exist
    try {
      const result = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ` as Array<{ table_name: string }>

      const tableNames = result.map(t => t.table_name)
      const expectedTables = [
        'users', 'workers', 'categories', 'products', 
        'customers', 'transactions', 'transaction_items', 'discount_codes'
      ]

      const missingTables = expectedTables.filter(table => !tableNames.includes(table))
      if (missingTables.length > 0) {
        warnings.push(`PostgreSQL schema not initialized. Missing tables: ${missingTables.join(', ')}. Run "npm run db:push" first.`)
      } else {
        info.push('✓ PostgreSQL schema is properly initialized')

        // Check for existing data
        const counts = await Promise.all([
          prisma.user.count(),
          prisma.worker.count(),
          prisma.category.count(),
          prisma.product.count(),
          prisma.customer.count(),
          prisma.transaction.count(),
          prisma.transactionItem.count(),
          prisma.discountCode.count()
        ])

        const totalRecords = counts.reduce((a, b) => a + b, 0)
        if (totalRecords > 0) {
          warnings.push(`PostgreSQL database already contains ${totalRecords} records. Migration will update existing records.`)
        } else {
          info.push('✓ PostgreSQL database is ready for migration (empty)')
        }
      }
    } catch (error) {
      warnings.push('Could not check PostgreSQL schema. Make sure to run "npm run db:push" before migration.')
    }

    await prisma.$disconnect()
  } catch (error) {
    errors.push(`Failed to connect to PostgreSQL: ${error}`)
  }

  return { errors, warnings, info }
}

async function validateDependencies(): Promise<Partial<ValidationResult>> {
  const errors: string[] = []
  const warnings: string[] = []
  const info: string[] = []

  // Check package.json
  const packagePath = path.join(process.cwd(), 'package.json')
  if (!fs.existsSync(packagePath)) {
    errors.push('package.json not found')
    return { errors, warnings, info }
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  
  // Check required dependencies
  const requiredDeps = ['@prisma/client', 'prisma', 'sqlite3']
  const missingDeps = requiredDeps.filter(dep => 
    !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
  )

  if (missingDeps.length > 0) {
    errors.push(`Missing dependencies: ${missingDeps.join(', ')}. Run "npm install" to install them.`)
  } else {
    info.push('✓ All required dependencies are installed')
  }

  // Check if node_modules exists
  const nodeModulesPath = path.join(process.cwd(), 'node_modules')
  if (!fs.existsSync(nodeModulesPath)) {
    errors.push('node_modules directory not found. Run "npm install" to install dependencies.')
  } else {
    info.push('✓ node_modules directory exists')
  }

  return { errors, warnings, info }
}

function printResults(results: ValidationResult) {
  console.log(`${colors.blue}🔍 OpenPOS Migration Setup Validation${colors.reset}`)
  console.log('==========================================\n')

  if (results.info.length > 0) {
    console.log(`${colors.green}✅ Validation Results:${colors.reset}`)
    results.info.forEach(msg => console.log(`${colors.green}${msg}${colors.reset}`))
    console.log()
  }

  if (results.warnings.length > 0) {
    console.log(`${colors.yellow}⚠️  Warnings:${colors.reset}`)
    results.warnings.forEach(msg => console.log(`${colors.yellow}${msg}${colors.reset}`))
    console.log()
  }

  if (results.errors.length > 0) {
    console.log(`${colors.red}❌ Errors:${colors.reset}`)
    results.errors.forEach(msg => console.log(`${colors.red}${msg}${colors.reset}`))
    console.log()
  }

  // Summary
  if (results.isValid) {
    console.log(`${colors.green}🎉 Setup validation passed! You can proceed with the migration.${colors.reset}`)
    console.log(`${colors.blue}Next steps:${colors.reset}`)
    console.log(`${colors.blue}1. Create a backup: npm run db:backup${colors.reset}`)
    console.log(`${colors.blue}2. Run migration: npm run db:migrate-to-supabase${colors.reset}`)
  } else {
    console.log(`${colors.red}❌ Setup validation failed. Please fix the errors above before proceeding.${colors.reset}`)
    process.exit(1)
  }
}

async function main() {
  const allResults: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    info: []
  }

  // Run all validations
  const validations = [
    await validateDependencies(),
    await validateEnvironmentVariables(),
    await validateSQLiteDatabase(),
    await validatePostgreSQLConnection()
  ]

  // Aggregate results
  validations.forEach(result => {
    if (result.errors) allResults.errors.push(...result.errors)
    if (result.warnings) allResults.warnings.push(...result.warnings)
    if (result.info) allResults.info.push(...result.info)
  })

  allResults.isValid = allResults.errors.length === 0

  printResults(allResults)
}

if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Validation failed:${colors.reset}`, error)
    process.exit(1)
  })
}