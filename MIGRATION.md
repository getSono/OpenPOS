# OpenPOS Database Migration Guide: SQLite to Supabase PostgreSQL

This guide provides step-by-step instructions for migrating your OpenPOS database from SQLite to Supabase PostgreSQL.

## Overview

The migration transfers all data and schema from the local SQLite database (`dev.db`) to Supabase PostgreSQL, including:

- **Users** - Admin, Manager, and Cashier accounts with roles and NFC codes
- **Workers** - Staff members with station assignments  
- **Categories** - Product categories with colors and descriptions
- **Products** - Items with pricing, stock, SKUs, and barcodes
- **Customers** - Customer information and contact details
- **Discount Codes** - Promotional codes with validation rules
- **Transactions** - Sales records with payment methods and status
- **Transaction Items** - Individual line items within transactions

All relationships, constraints, timestamps, and foreign keys are preserved during migration.

## Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Existing SQLite Database**: Ensure `prisma/dev.db` exists with data to migrate
3. **Node.js Environment**: Working Node.js installation with npm

## Step 1: Set Up Supabase Project

1. Create a new project in your Supabase dashboard
2. Go to **Settings > Database** to find your connection details
3. Note down your:
   - Project URL: `https://[your-project-id].supabase.co`
   - Database Password (set during project creation)
   - Project ID

## Step 2: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your Supabase credentials:
   ```env
   # Required for migration
   DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT_ID].supabase.co:5432/postgres?schema=public"
   
   # Optional for additional Supabase features
   NEXT_PUBLIC_SUPABASE_URL="https://[YOUR_PROJECT_ID].supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR_ANON_KEY]"
   SUPABASE_SERVICE_ROLE_KEY="[YOUR_SERVICE_ROLE_KEY]"
   ```

## Step 3: Update Database Schema

The Prisma schema has been updated to use PostgreSQL. Generate the new client:

```bash
npm run db:generate
```

## Step 4: Initialize PostgreSQL Database

Push the schema to your Supabase database:

```bash
npm run db:push
```

This creates all tables, relationships, and constraints in PostgreSQL.

## Step 5: Run the Migration

Execute the migration script to transfer all data:

```bash
npm run db:migrate-to-supabase
```

The migration script will:
1. ✅ Verify SQLite database exists
2. ✅ Connect to Supabase PostgreSQL  
3. ✅ Migrate data in dependency order:
   - Categories (no dependencies)
   - Users (no dependencies)
   - Workers (no dependencies)
   - Customers (no dependencies)
   - Discount Codes (no dependencies)
   - Products (depends on Categories)
   - Transactions (depends on Users, Customers, Workers, Discount Codes)
   - Transaction Items (depends on Transactions, Products)
4. ✅ Verify migration integrity
5. ✅ Test relationships

## Step 6: Verify Migration

The script automatically verifies the migration by:
- Counting records in each table
- Testing key relationships (Product-Category, Transaction-Items, etc.)
- Displaying a summary report

You can also manually verify in Supabase:
1. Go to **Table Editor** in your Supabase dashboard
2. Check each table has the expected data
3. Verify relationships are working correctly

## Migration Features

### Data Integrity
- ✅ Preserves all timestamps (`createdAt`, `updatedAt`)
- ✅ Maintains unique constraints (emails, SKUs, barcodes, etc.)
- ✅ Preserves foreign key relationships
- ✅ Converts boolean values correctly
- ✅ Handles nullable fields appropriately

### Error Handling
- ✅ Individual record error handling (continues on single failures)
- ✅ Connection validation before starting
- ✅ Detailed error reporting
- ✅ Rollback-safe operations (uses upsert)

### Performance
- ✅ Batch processing by table
- ✅ Dependency-aware migration order
- ✅ Connection pooling
- ✅ Progress reporting

## Rollback Plan

If you need to rollback:

1. **Keep SQLite backup**: The original `dev.db` file is not modified
2. **Revert schema**: Change `schema.prisma` back to SQLite provider
3. **Update environment**: Remove Supabase environment variables
4. **Regenerate client**: Run `npm run db:generate`

## Troubleshooting

### Common Issues

**Connection Failed**
```
Error: getaddrinfo ENOTFOUND db.[project-id].supabase.co
```
- Verify your project ID in the DATABASE_URL
- Check your internet connection
- Ensure Supabase project is active

**Authentication Failed**
```
Error: password authentication failed
```
- Verify your database password
- Check if password contains special characters (URL encode them)
- Try resetting your database password in Supabase dashboard

**Schema Mismatch**
```
Error: relation "categories" does not exist
```
- Ensure you ran `npm run db:push` first
- Check if the schema was applied correctly in Supabase

**Missing SQLite Database**
```
❌ SQLite database not found
```
- Ensure `prisma/dev.db` exists
- Run `npm run db:seed` to create sample data if needed

### Getting Help

1. Check the migration script logs for specific error messages
2. Verify your Supabase project settings and credentials
3. Ensure all dependencies are installed: `npm install`
4. Test the connection manually in Supabase dashboard

## Post-Migration Steps

After successful migration:

1. **Update Application**: Your app will now use Supabase PostgreSQL
2. **Test Features**: Verify all POS functionality works correctly
3. **Monitor Performance**: Check query performance in Supabase dashboard
4. **Backup Strategy**: Set up regular backups in Supabase
5. **Scale Settings**: Configure connection limits and performance settings

## Benefits of PostgreSQL/Supabase

- 🚀 **Better Performance**: Optimized for larger datasets
- 🌐 **Remote Access**: Access database from anywhere
- 🔄 **Real-time Features**: Built-in real-time subscriptions
- 🔒 **Security**: Row-level security and authentication
- 📊 **Analytics**: Built-in analytics and monitoring
- 🔧 **APIs**: Auto-generated REST and GraphQL APIs
- ☁️ **Cloud Native**: Managed infrastructure and scaling

Your OpenPOS system is now ready to scale with Supabase PostgreSQL!