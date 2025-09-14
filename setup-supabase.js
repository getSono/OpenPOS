#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

console.log('Setting up OpenPOS with Supabase PostgreSQL...');

async function setupSupabase() {
  try {
    // Step 1: Generate Prisma client
    console.log('1. Generating Prisma client...');
    await execAsync('npx prisma generate');
    console.log('✓ Prisma client generated successfully');

    // Step 2: Push schema to database
    console.log('2. Pushing database schema to Supabase...');
    await execAsync('npx prisma db push');
    console.log('✓ Database schema pushed successfully');

    // Step 3: Seed the database
    console.log('3. Seeding database with sample data...');
    await execAsync('npm run db:seed');
    console.log('✓ Database seeded successfully');

    console.log('\n🎉 OpenPOS setup complete!');
    console.log('\nTest users:');
    console.log('Admin: PIN 1234 or NFC001');
    console.log('Manager: PIN 5678 or NFC002');
    console.log('Cashier: PIN 9999 or NFC003');
    console.log('\nTest workers:');
    console.log('Kitchen Worker 1: NFC WORKER001');
    console.log('Kitchen Worker 2: NFC WORKER002');
    console.log('Prep Worker: NFC WORKER003');
    console.log('\nPages available:');
    console.log('Main POS: http://localhost:3000');
    console.log('Handheld Scanner: http://localhost:3000/handheld');
    console.log('Worker Station: http://localhost:3000/worker');
    console.log('Order Display: http://localhost:3000/order-display');
    console.log('Customer Display: http://localhost:3000/customer-display');
    console.log('\nDatabase Management:');
    console.log('Prisma Studio: npm run db:studio');

  } catch (error) {
    console.error('Error setting up OpenPOS:', error.message);
    console.error('\nMake sure you have:');
    console.error('1. Set DATABASE_URL in your .env file');
    console.error('2. Configured your Supabase project correctly');
    console.error('3. Installed all dependencies with npm install');
    process.exit(1);
  }
}

// Check if DATABASE_URL is configured
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  console.error('Please copy .env.example to .env and configure your Supabase connection string.');
  process.exit(1);
}

setupSupabase();