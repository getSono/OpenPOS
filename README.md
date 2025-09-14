# OpenPOS - Modern Point of Sale System

OpenPOS is a modern, web-based Point of Sale (POS) system built with Next.js, Prisma, and powered by Supabase PostgreSQL for enhanced scalability and performance.

## Features

- 🛒 **Product Management** - Categorized inventory with stock tracking
- 💳 **Transaction Processing** - Multiple payment methods and receipt generation
- 👥 **User Management** - Role-based access (Admin, Manager, Cashier)
- 🏷️ **Discount System** - Flexible promotional codes and discounts
- 📊 **Real-time Updates** - Powered by Supabase for live data synchronization
- 🔒 **Secure Authentication** - NFC and PIN-based user authentication

## Database - Supabase PostgreSQL

OpenPOS now runs exclusively on Supabase PostgreSQL, providing:
- **Scalability**: Handle more transactions and users
- **Real-time Updates**: Live data synchronization across devices
- **Cloud Integration**: Built-in backup, monitoring, and security
- **Advanced Features**: Row-level security, real-time subscriptions

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account ([create one free](https://supabase.com))

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/getSono/OpenPOS.git
   cd OpenPOS
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your Supabase database:

   **Create your Supabase project:**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Copy your project URL and API keys

   **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```
   DATABASE_URL="postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres"
   NEXT_PUBLIC_SUPABASE_URL="https://[project-id].supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="[your-anon-key]"
   ```

4. Initialize the database:
   ```bash
   npm run setup
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) to access OpenPOS

## Database Management

### Available Scripts

- `npm run setup` - Complete setup: schema + seed data
- `npm run db:push` - Push schema to Supabase
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio for database management
- `npm run db:migrate` - Create and apply migrations
- `npm run db:reset` - Reset database (development only)

### Default Test Users

After running `npm run setup`, you can log in with:

**Admin User:**
- PIN: `1234` or NFC: `NFC001`

**Manager User:**
- PIN: `5678` or NFC: `NFC002`

**Cashier User:**
- PIN: `9999` or NFC: `NFC003`

**Workers (for kitchen stations):**
- Kitchen Worker 1: NFC `WORKER001`
- Kitchen Worker 2: NFC `WORKER002`
- Prep Worker: NFC `WORKER003`
   # Copy environment template
   cp .env.example .env.local
   # Update .env.local with your Supabase credentials
   
   # Initialize database schema
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

   **For Local SQLite:**
   ```bash
   # Initialize local database
   npm run db:push
   npm run db:seed
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Default Login Credentials

After seeding the database, you can use these test accounts:

- **Admin**: PIN `1234` | NFC `NFC001`
- **Manager**: PIN `5678` | NFC `NFC002`  
- **Cashier**: PIN `9999` | NFC `NFC003`

## Database Scripts

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema changes to database |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:migrate` | Create and apply migrations |
| `npm run db:backup` | Create SQLite backup before migration |
| `npm run db:validate-setup` | Validate migration setup |
| `npm run db:migrate-to-supabase` | Migrate from SQLite to Supabase |

## Project Structure

```
├── prisma/
│   ├── schema.prisma          # Database schema (PostgreSQL)
│   └── seed.ts               # Sample data seeding
├── scripts/
│   ├── migrate-to-supabase.ts    # Migration script
│   ├── validate-migration-setup.ts # Setup validation
│   └── backup-sqlite.sh          # Database backup
├── src/
│   ├── app/                  # Next.js app directory
│   ├── components/           # React components
│   └── lib/                  # Utility functions
├── .env.example              # Environment template
└── MIGRATION.md             # Detailed migration guide
```

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Database**: Supabase PostgreSQL (upgraded from SQLite)
- **ORM**: Prisma
- **Authentication**: Custom PIN/NFC system
- **UI Components**: Radix UI, Lucide React
- **PDF Generation**: jsPDF
- **Barcode Scanning**: ZXing

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For migration assistance or general support:
- 📖 Read the [Migration Guide](./MIGRATION.md)
- 🐛 Open an issue for bugs or feature requests
- 💬 Start a discussion for questions

---

Built with ❤️ using Next.js and powered by Supabase
