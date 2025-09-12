#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database file
const dbPath = path.join(__dirname, 'dev.db');
const db = new sqlite3.Database(dbPath);

// SQL to create tables
const createTables = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    name TEXT NOT NULL,
    pin TEXT NOT NULL,
    nfcCode TEXT UNIQUE,
    role TEXT NOT NULL DEFAULT 'CASHIER' CHECK (role IN ('ADMIN', 'MANAGER', 'CASHIER')),
    isActive INTEGER NOT NULL DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#000000',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    cost REAL DEFAULT 0,
    sku TEXT UNIQUE,
    barcode TEXT UNIQUE,
    stock INTEGER DEFAULT 0,
    minStock INTEGER DEFAULT 0,
    isActive INTEGER DEFAULT 1,
    image TEXT,
    categoryId TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoryId) REFERENCES categories (id)
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    receiptNumber TEXT UNIQUE NOT NULL,
    orderNumber INTEGER UNIQUE NOT NULL,
    subtotal REAL NOT NULL,
    tax REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    total REAL NOT NULL,
    paymentMethod TEXT DEFAULT 'CASH' CHECK (paymentMethod IN ('CASH', 'CARD', 'DIGITAL', 'CHECK')),
    status TEXT DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED')),
    orderStatus TEXT DEFAULT 'PENDING' CHECK (orderStatus IN ('PENDING', 'IN_PROGRESS', 'READY', 'COMPLETED', 'CANCELLED')),
    notes TEXT,
    userId TEXT NOT NULL,
    customerId TEXT,
    workerId TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users (id),
    FOREIGN KEY (customerId) REFERENCES customers (id),
    FOREIGN KEY (workerId) REFERENCES workers (id)
);

-- Workers table
CREATE TABLE IF NOT EXISTS workers (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    name TEXT NOT NULL,
    pin TEXT NOT NULL,
    nfcCode TEXT UNIQUE,
    isActive INTEGER NOT NULL DEFAULT 1,
    currentStation TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Transaction Items table
CREATE TABLE IF NOT EXISTS transaction_items (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    quantity INTEGER NOT NULL,
    unitPrice REAL NOT NULL,
    totalPrice REAL NOT NULL,
    transactionId TEXT NOT NULL,
    productId TEXT NOT NULL,
    FOREIGN KEY (transactionId) REFERENCES transactions (id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES products (id)
);
`;

// Sample data
const insertSampleData = `
-- Insert categories
INSERT OR IGNORE INTO categories (id, name, description, color) VALUES 
    ('cat1', 'Beverages', 'Drinks and beverages', '#3B82F6'),
    ('cat2', 'Snacks', 'Snacks and quick bites', '#10B981'),
    ('cat3', 'Electronics', 'Electronic devices and accessories', '#8B5CF6');

-- Insert users
INSERT OR IGNORE INTO users (id, name, pin, nfcCode, role) VALUES 
    ('user1', 'Admin User', '1234', 'NFC001', 'ADMIN'),
    ('user2', 'Manager User', '5678', 'NFC002', 'MANAGER'),
    ('user3', 'Cashier User', '9999', 'NFC003', 'CASHIER');

-- Insert workers
INSERT OR IGNORE INTO workers (id, name, pin, nfcCode, currentStation) VALUES 
    ('worker1', 'Kitchen Worker 1', '0000', 'WORKER001', 'Kitchen'),
    ('worker2', 'Kitchen Worker 2', '0000', 'WORKER002', 'Grill'),
    ('worker3', 'Prep Worker', '0000', 'WORKER003', 'Prep');

-- Insert products
INSERT OR IGNORE INTO products (id, name, description, price, cost, sku, barcode, stock, minStock, categoryId) VALUES 
    ('prod1', 'Coca Cola 330ml', 'Classic Coca Cola in a 330ml can', 1.50, 0.75, 'COKE-330', '1234567890123', 100, 10, 'cat1'),
    ('prod2', 'Pepsi 330ml', 'Pepsi cola in a 330ml can', 1.45, 0.70, 'PEPSI-330', '1234567890124', 85, 10, 'cat1'),
    ('prod3', 'Potato Chips', 'Crispy potato chips 150g bag', 2.25, 1.10, 'CHIPS-150', '1234567890125', 50, 5, 'cat2'),
    ('prod4', 'USB Cable', 'USB-C to USB-A cable 1m', 12.99, 6.50, 'USB-C-1M', '1234567890126', 25, 5, 'cat3'),
    ('prod5', 'Smartphone Case', 'Universal smartphone protective case', 19.99, 8.00, 'CASE-UNI', '1234567890127', 30, 3, 'cat3'),
    ('prod6', 'Energy Bar', 'Chocolate energy bar 60g', 3.50, 1.75, 'ENERGY-60', '1234567890128', 40, 8, 'cat2');
`;

console.log('Creating database and tables...');

db.serialize(() => {
    // Create tables
    db.exec(createTables, (err) => {
        if (err) {
            console.error('Error creating tables:', err);
            return;
        }
        console.log('Tables created successfully');
    });

    // Insert sample data
    db.exec(insertSampleData, (err) => {
        if (err) {
            console.error('Error inserting sample data:', err);
            return;
        }
        console.log('Sample data inserted successfully');
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
    });
});

db.close((err) => {
    if (err) {
        console.error('Error closing database:', err);
        return;
    }
    console.log('Database setup complete!');
});