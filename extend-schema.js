#!/usr/bin/env node

const Database = require('sqlite3').Database;
const path = require('path');

const dbPath = path.join(__dirname, 'dev.db');
const db = new Database(dbPath);

console.log('Adding product variants and custom fields support...');

// Add customFields column to products table
db.run(`
  ALTER TABLE products 
  ADD COLUMN customFields TEXT DEFAULT '{}';
`, (err) => {
  if (err) {
    console.log('customFields column may already exist:', err.message);
  } else {
    console.log('✓ Added customFields column to products');
  }
});

// Create product_variants table
db.run(`
  CREATE TABLE IF NOT EXISTS product_variants (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    productId TEXT NOT NULL,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    barcode TEXT UNIQUE,
    price REAL,
    cost REAL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    attributes TEXT DEFAULT '{}',
    isActive INTEGER DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE
  );
`, (err) => {
  if (err) {
    console.error('Error creating product_variants table:', err);
  } else {
    console.log('✓ Created product_variants table');
  }
});

// Create custom_field_definitions table for reusable custom field definitions
db.run(`
  CREATE TABLE IF NOT EXISTS custom_field_definitions (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'number', 'boolean', 'date', 'select')),
    options TEXT DEFAULT '[]',
    isRequired INTEGER DEFAULT 0,
    isActive INTEGER DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`, (err) => {
  if (err) {
    console.error('Error creating custom_field_definitions table:', err);
  } else {
    console.log('✓ Created custom_field_definitions table');
  }
});

// Insert some example custom field definitions
db.run(`
  INSERT OR IGNORE INTO custom_field_definitions (id, name, label, type, options, isRequired)
  VALUES 
    ('field_brand', 'brand', 'Brand', 'text', '[]', 0),
    ('field_weight', 'weight', 'Weight (kg)', 'number', '[]', 0),
    ('field_color', 'color', 'Color', 'select', '["Red", "Blue", "Green", "Black", "White"]', 0),
    ('field_size', 'size', 'Size', 'select', '["XS", "S", "M", "L", "XL", "XXL"]', 0),
    ('field_warranty', 'warranty', 'Warranty (months)', 'number', '[]', 0),
    ('field_organic', 'organic', 'Organic Product', 'boolean', '[]', 0);
`, (err) => {
  if (err) {
    console.error('Error inserting custom field definitions:', err);
  } else {
    console.log('✓ Added sample custom field definitions');
  }
});

// Add some example product variants for existing products
db.run(`
  INSERT OR IGNORE INTO product_variants (id, productId, name, sku, price, cost, stock, attributes)
  SELECT 
    'variant_' || p.id || '_330ml' as id,
    p.id as productId,
    p.name || ' - 330ml' as name,
    p.sku || '-330' as sku,
    p.price as price,
    p.cost as cost,
    CAST(p.stock * 0.6 AS INTEGER) as stock,
    '{"size": "330ml", "volume": "330"}' as attributes
  FROM products p 
  WHERE p.name LIKE '%Cola%' OR p.name LIKE '%Pepsi%'
  LIMIT 5;
`, (err) => {
  if (err) {
    console.error('Error adding sample variants:', err);
  } else {
    console.log('✓ Added sample product variants');
  }
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err);
  } else {
    console.log('✓ Database schema updated successfully!');
  }
});