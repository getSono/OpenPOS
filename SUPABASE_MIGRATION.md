# OpenPOS: Prisma to Supabase Migration

## Overview

OpenPOS has been successfully migrated from Prisma ORM to Supabase for improved performance, scalability, and real-time capabilities.

## What Changed

### Database Layer
- **Before**: Prisma ORM with SQLite/PostgreSQL
- **After**: Direct Supabase client with PostgreSQL

### Key Benefits
- ✅ **Better Performance**: Direct database queries without ORM overhead
- ✅ **Real-time Features**: Built-in subscriptions and live updates
- ✅ **Simplified Stack**: One service for database, auth, and APIs
- ✅ **Type Safety**: Still maintained with TypeScript
- ✅ **Scalability**: Cloud-native PostgreSQL with connection pooling

## Technical Details

### Database Schema
The database schema remains the same, with all tables and relationships preserved:
- `users` - System users with roles and authentication
- `workers` - Kitchen/station workers
- `categories` - Product categories
- `products` - Inventory items
- `customers` - Customer information
- `transactions` - Sales records
- `transaction_items` - Line items for transactions
- `discount_codes` - Promotional codes
- `receipt_settings` - Business configuration

### API Changes
All API routes have been updated to use Supabase client instead of Prisma:
- Direct SQL-like queries using Supabase PostgREST
- Proper error handling for Supabase responses
- Maintained backward compatibility for request/response formats

### Environment Variables
Updated environment configuration:
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-key"
```

### Removed Dependencies
- `@prisma/client`
- `prisma`
- All Prisma-related npm scripts

### Added Dependencies
- `@supabase/supabase-js`

## Migration Impact

### What Works the Same
- All existing API endpoints
- User authentication (PIN/NFC)
- Product management
- Transaction processing
- Receipt generation
- User interface

### What's Improved
- Better real-time updates
- Faster query performance
- Simplified deployment
- Built-in database backups
- Advanced security features

### What's Different
- Database connections use Supabase client
- Error messages may differ slightly
- No more Prisma Studio (use Supabase Dashboard)

## For Developers

### Query Examples

**Before (Prisma):**
```typescript
const users = await prisma.user.findMany({
  where: { isActive: true },
  include: { transactions: true }
})
```

**After (Supabase):**
```typescript
const { data: users } = await supabase
  .from('users')
  .select('*, transactions(*)')
  .eq('isActive', true)
```

### Error Handling

**Before (Prisma):**
```typescript
try {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
} catch (error) {
  // Handle Prisma errors
}
```

**After (Supabase):**
```typescript
const { data: user, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', id)
  .single()

if (error && error.code === 'PGRST116') {
  return NextResponse.json({ error: 'User not found' }, { status: 404 })
}
```

## Legacy Files

Legacy Prisma files have been moved to `prisma-legacy/` directory for reference and are excluded from git tracking.

## Support

For questions about the migration or Supabase implementation, please check:
- [Supabase Documentation](https://supabase.com/docs)
- [OpenPOS GitHub Issues](https://github.com/getSono/OpenPOS/issues)