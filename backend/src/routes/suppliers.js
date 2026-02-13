import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate, authorize } from '../middlewares/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new Database(path.join(__dirname, '..', '..', 'database', 'starlink.db'));

const router = express.Router();

// Get all suppliers
router.get('/', authenticate, (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT * FROM suppliers WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (name LIKE ? OR contact_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const suppliers = db.prepare(query).all(...params);

    const { total } = db.prepare('SELECT COUNT(*) as total FROM suppliers').get();

    res.json({
      data: suppliers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Get single supplier
router.get('/:id', authenticate, (req, res) => {
  try {
    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id);

    if (!supplier) {
      return res.status(404).json({ error: '供应商不存在' });
    }

    // Get supplier orders count
    const orderStats = db.prepare(`
      SELECT
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM orders WHERE supplier_id = ?
    `).get(req.params.id);

    res.json({ ...supplier, orderStats });
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Create supplier
router.post('/', authenticate, authorize('admin', 'purchaser'), (req, res) => {
  try {
    const { name, contact_name, contact_phone, address } = req.body;

    if (!name) {
      return res.status(400).json({ error: '供应商名称不能为空' });
    }

    // Check if name already exists
    const existing = db.prepare('SELECT id FROM suppliers WHERE name = ?').get(name);
    if (existing) {
      return res.status(400).json({ error: '供应商名称已存在' });
    }

    const result = db.prepare(`
      INSERT INTO suppliers (name, contact_name, contact_phone, address, status)
      VALUES (?, ?, ?, ?, 'active')
    `).run(name, contact_name, contact_phone, address);

    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(supplier);
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Update supplier
router.put('/:id', authenticate, authorize('admin', 'purchaser'), (req, res) => {
  try {
    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id);

    if (!supplier) {
      return res.status(404).json({ error: '供应商不存在' });
    }

    const { name, contact_name, contact_phone, address } = req.body;

    // Check if name already exists (excluding current supplier)
    if (name && name !== supplier.name) {
      const existing = db.prepare('SELECT id FROM suppliers WHERE name = ? AND id != ?').get(name, req.params.id);
      if (existing) {
        return res.status(400).json({ error: '供应商名称已存在' });
      }
    }

    db.prepare(`
      UPDATE suppliers
      SET name = COALESCE(?, name),
          contact_name = COALESCE(?, contact_name),
          contact_phone = COALESCE(?, contact_phone),
          address = COALESCE(?, address)
      WHERE id = ?
    `).run(name, contact_name, contact_phone, address, req.params.id);

    const updatedSupplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id);

    res.json(updatedSupplier);
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Block supplier
router.put('/:id/block', authenticate, authorize('admin', 'purchaser'), (req, res) => {
  try {
    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id);

    if (!supplier) {
      return res.status(404).json({ error: '供应商不存在' });
    }

    if (supplier.status === 'blocked') {
      return res.status(400).json({ error: '供应商已经被禁用' });
    }

    db.prepare('UPDATE suppliers SET status = ? WHERE id = ?').run('blocked', req.params.id);

    const updatedSupplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id);

    res.json(updatedSupplier);
  } catch (error) {
    console.error('Block supplier error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Activate supplier
router.put('/:id/activate', authenticate, authorize('admin', 'purchaser'), (req, res) => {
  try {
    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id);

    if (!supplier) {
      return res.status(404).json({ error: '供应商不存在' });
    }

    if (supplier.status === 'active') {
      return res.status(400).json({ error: '供应商已经是启用状态' });
    }

    db.prepare('UPDATE suppliers SET status = ? WHERE id = ?').run('active', req.params.id);

    const updatedSupplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id);

    res.json(updatedSupplier);
  } catch (error) {
    console.error('Activate supplier error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Update rating
router.put('/:id/rating', authenticate, authorize('admin', 'purchaser'), (req, res) => {
  try {
    const { rating } = req.body;

    if (rating < 0 || rating > 5) {
      return res.status(400).json({ error: '评分必须在0-5之间' });
    }

    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id);

    if (!supplier) {
      return res.status(404).json({ error: '供应商不存在' });
    }

    db.prepare('UPDATE suppliers SET rating = ? WHERE id = ?').run(rating, req.params.id);

    const updatedSupplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id);

    res.json(updatedSupplier);
  } catch (error) {
    console.error('Update rating error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
