# OpenPOS - Modern Point of Sale System

OpenPOS is a modern, web-based Point of Sale (POS) system built with Next.js, Prisma, and now powered by Supabase PostgreSQL for enhanced scalability and performance.

## Features

- 🛒 **Product Management** - Categorized inventory with stock tracking
- 💳 **Transaction Processing** - Multiple payment methods and receipt generation
- 👥 **User Management** - Role-based access (Admin, Manager, Cashier)
- 🏷️ **Discount System** - Flexible promotional codes and discounts
- 📊 **Real-time Updates** - Powered by Supabase for live data synchronization
- 🔒 **Secure Authentication** - NFC and PIN-based user authentication

## Database Migration to Supabase

OpenPOS has been upgraded from SQLite to Supabase PostgreSQL for better performance, scalability, and cloud integration. See [MIGRATION.md](./MIGRATION.md) for detailed migration instructions.

### Quick Migration Steps

1. **Setup Supabase**: Create a project at [supabase.com](https://supabase.com)
2. **Configure Environment**: Copy `.env.example` to `.env.local` and update with your Supabase credentials
3. **Validate Setup**: `npm run db:validate-setup`
4. **Backup Current Data**: `npm run db:backup`
5. **Initialize Schema**: `npm run db:push`
6. **Migrate Data**: `npm run db:migrate-to-supabase`

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for production) or existing SQLite setup (for development)

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

3. Set up your database:

   **For Supabase (Recommended):**
   ```bash
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
