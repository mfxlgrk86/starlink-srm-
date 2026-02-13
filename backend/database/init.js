import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database', 'starlink.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK(role IN ('admin', 'purchaser', 'supplier', 'finance')),
    supplier_id INTEGER NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Suppliers table
  CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    contact_name VARCHAR(50),
    contact_phone VARCHAR(20),
    address TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK(status IN ('active', 'blocked', 'pending')),
    rating DECIMAL(2,1) DEFAULT 5.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Materials table
  CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    specification TEXT,
    unit VARCHAR(20),
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Orders table
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2),
    total_amount DECIMAL(12,2),
    delivery_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'shipped', 'received', 'completed', 'cancelled')),
    tracking_no VARCHAR(100),
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (material_id) REFERENCES materials(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  -- Order logs table
  CREATE TABLE IF NOT EXISTS order_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    operator_id INTEGER,
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (operator_id) REFERENCES users(id)
  );

  -- Inquiries table
  CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inquiry_no VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200),
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'closed')),
    deadline DATE,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  -- Quotations table
  CREATE TABLE IF NOT EXISTS quotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inquiry_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    material_id INTEGER,
    quantity DECIMAL(10,2),
    unit_price DECIMAL(10,2),
    delivery_days INTEGER,
    valid_until DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inquiry_id) REFERENCES inquiries(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (material_id) REFERENCES materials(id)
  );

  -- Reconciliations table
  CREATE TABLE IF NOT EXISTS reconciliations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reconciliation_no VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INTEGER NOT NULL,
    period_start DATE,
    period_end DATE,
    total_amount DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'confirmed', 'paid')),
    ai_audit_result TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
  );

  -- Invoices table
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reconciliation_id INTEGER,
    supplier_id INTEGER NOT NULL,
    invoice_no VARCHAR(50),
    invoice_date DATE,
    amount DECIMAL(12,2),
    tax_amount DECIMAL(12,2),
    image_url TEXT,
    ocr_result TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending', 'verified', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reconciliation_id) REFERENCES reconciliations(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
  );

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_orders_supplier ON orders(supplier_id);
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
  CREATE INDEX IF NOT EXISTS idx_order_logs_order ON order_logs(order_id);
  CREATE INDEX IF NOT EXISTS idx_quotations_inquiry ON quotations(inquiry_id);
  CREATE INDEX IF NOT EXISTS idx_invoices_supplier ON invoices(supplier_id);
`);

// Seed data
const seedDatabase = () => {
  // Check if already seeded
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count > 0) {
    console.log('Database already seeded');
    return;
  }

  console.log('Seeding database...');

  // Create password hashes
  const adminPassword = bcrypt.hashSync('admin123', 10);
  const purchaserPassword = bcrypt.hashSync('purchase123', 10);
  const financePassword = bcrypt.hashSync('finance123', 10);
  const huaweiPassword = bcrypt.hashSync('huawei123', 10);
  const lixunPassword = bcrypt.hashSync('lixun123', 10);

  // Insert users
  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, role, supplier_id)
    VALUES (?, ?, ?, ?)
  `);

  const admin = insertUser.run('admin', adminPassword, 'admin', null);
  const purchaser = insertUser.run('purchaser', purchaserPassword, 'purchaser', null);
  const finance = insertUser.run('finance', financePassword, 'finance', null);

  // Insert suppliers
  const insertSupplier = db.prepare(`
    INSERT INTO suppliers (name, contact_name, contact_phone, address, status, rating)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const huawei = insertSupplier.run('华威机械', '张经理', '13800138001', '深圳市宝安区', 'active', 4.8);
  const lixun = insertSupplier.run('立讯电子', '李总监', '13800138002', '东莞市长安镇', 'active', 4.5);
  const yueli = insertSupplier.run('悦力材料', '王总', '13800138003', '广州市天河区', 'active', 4.2);
  const huaxin = insertSupplier.run('华鑫五金', '刘经理', '13800138004', '佛山市顺德区', 'blocked', 3.5);

  // Insert supplier users
  insertUser.run('huawei', huaweiPassword, 'supplier', huawei.lastInsertRowid);
  insertUser.run('lixun', lixunPassword, 'supplier', lixun.lastInsertRowid);

  // Insert materials
  const insertMaterial = db.prepare(`
    INSERT INTO materials (code, name, specification, unit, category)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertMaterial.run('BJ-001', '精密轴承', 'P0级精度', '个', '轴承');
  insertMaterial.run('DJ-002', '电机', '2.2kW三相异步', '台', '电机');
  insertMaterial.run('DL-003', '电缆', '3*16+1*10', '米', '电缆');
  insertMaterial.run('SS-004', '不锈钢板', '304 3mm', '平方米', '板材');
  insertMaterial.run('JG-005', '紧固件套装', 'M3-M20', '套', '五金');
  insertMaterial.run('KF-006', '控制器', 'PLC可编程', '个', '电气');
  insertMaterial.run('DM-007', '导轨', '直线导轨', '米', '传动');
  insertMaterial.run('CJ-008', '传感器', '光电式', '个', '传感器');

  // Insert sample orders
  const insertOrder = db.prepare(`
    INSERT INTO orders (order_no, supplier_id, material_id, quantity, unit_price, total_amount, delivery_date, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const order1 = insertOrder.run('PO2024010001', huawei.lastInsertRowid, 1, 500, 25.00, 12500.00, '2024-02-15', 'pending', purchaser.lastInsertRowid);
  const order2 = insertOrder.run('PO2024010002', lixun.lastInsertRowid, 2, 10, 2500.00, 25000.00, '2024-02-20', 'confirmed', purchaser.lastInsertRowid);
  const order3 = insertOrder.run('PO2024010003', huawei.lastInsertRowid, 3, 1000, 45.00, 45000.00, '2024-02-10', 'shipped', purchaser.lastInsertRowid);
  const order4 = insertOrder.run('PO2024010004', yueli.lastInsertRowid, 4, 200, 180.00, 36000.00, '2024-02-08', 'received', purchaser.lastInsertRowid);
  const order5 = insertOrder.run('PO2024010005', lixun.lastInsertRowid, 6, 50, 800.00, 40000.00, '2024-01-25', 'completed', purchaser.lastInsertRowid);

  // Insert order logs
  const insertLog = db.prepare(`
    INSERT INTO order_logs (order_id, action, old_status, new_status, operator_id, remark)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertLog.run(order1.lastInsertRowid, 'created', null, 'pending', purchaser.lastInsertRowid, '订单创建');
  insertLog.run(order2.lastInsertRowid, 'created', null, 'pending', purchaser.lastInsertRowid, '订单创建');
  insertLog.run(order2.lastInsertRowid, 'confirmed', 'pending', 'confirmed', huawei.lastInsertRowid, '供应商确认接单');
  insertLog.run(order3.lastInsertRowid, 'created', null, 'pending', purchaser.lastInsertRowid, '订单创建');
  insertLog.run(order3.lastInsertRowid, 'confirmed', 'pending', 'confirmed', huawei.lastInsertRowid, '供应商确认接单');
  insertLog.run(order3.lastInsertRowid, 'shipped', 'confirmed', 'shipped', huawei.lastInsertRowid, '发货，运单号：SF1234567890');
  insertLog.run(order4.lastInsertRowid, 'created', null, 'pending', purchaser.lastInsertRowid, '订单创建');
  insertLog.run(order4.lastInsertRowid, 'confirmed', 'pending', 'confirmed', yueli.lastInsertRowid, '供应商确认接单');
  insertLog.run(order4.lastInsertRowid, 'shipped', 'confirmed', 'shipped', yueli.lastInsertRowid, '发货');
  insertLog.run(order4.lastInsertRowid, 'received', 'shipped', 'received', purchaser.lastInsertRowid, '确认收货');
  insertLog.run(order4.lastInsertRowid, 'completed', 'received', 'completed', purchaser.lastInsertRowid, '订单完成');
  insertLog.run(order5.lastInsertRowid, 'completed', 'received', 'completed', purchaser.lastInsertRowid, '订单完成');

  // Insert sample inquiry
  const insertInquiry = db.prepare(`
    INSERT INTO inquiries (inquiry_no, title, description, status, deadline, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertInquiry.run('IQ2024010001', '精密轴承采购询价', '长期采购精密轴承，月需求500-1000个，要求P0级精度', 'published', '2024-03-01', purchaser.lastInsertRowid);
  insertInquiry.run('IQ2024010002', '电机设备询价', '采购三相异步电机若干，功率2.2kW', 'draft', '2024-03-15', purchaser.lastInsertRowid);

  console.log('Database seeded successfully!');
};

// Run seed
seedDatabase();

console.log('Database initialized successfully!');
console.log('Path:', dbPath);
