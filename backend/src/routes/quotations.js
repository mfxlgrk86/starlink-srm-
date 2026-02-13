import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate, authorize, authorizeSupplier } from '../middlewares/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new Database(path.join(__dirname, '..', '..', 'database', 'starlink.db'));

const router = express.Router();

// Get quotations for an inquiry
router.get('/inquiry/:inquiryId', authenticate, (req, res) => {
  try {
    const quotations = db.prepare(`
      SELECT q.*, s.name as supplier_name, m.name as material_name
      FROM quotations q
      JOIN suppliers s ON q.supplier_id = s.id
      LEFT JOIN materials m ON q.material_id = m.id
      WHERE q.inquiry_id = ?
      ORDER BY q.created_at DESC
    `).all(req.params.inquiryId);

    res.json(quotations);
  } catch (error) {
    console.error('Get quotations error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Get supplier's quotations
router.get('/my', authenticate, authorizeSupplier, (req, res) => {
  try {
    const quotations = db.prepare(`
      SELECT q.*, i.title as inquiry_title, m.name as material_name
      FROM quotations q
      JOIN inquiries i ON q.inquiry_id = i.id
      LEFT JOIN materials m ON q.material_id = m.id
      WHERE q.supplier_id = ?
      ORDER BY q.created_at DESC
    `).all(req.user.supplierId);

    res.json(quotations);
  } catch (error) {
    console.error('Get my quotations error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Submit quotation
router.post('/', authenticate, authorizeSupplier, (req, res) => {
  try {
    const { inquiry_id, material_id, quantity, unit_price, delivery_days, valid_until } = req.body;

    if (!inquiry_id || !unit_price) {
      return res.status(400).json({ error: '询价和单价不能为空' });
    }

    // Check if inquiry exists and is published
    const inquiry = db.prepare('SELECT * FROM inquiries WHERE id = ? AND status = ?').get(inquiry_id, 'published');
    if (!inquiry) {
      return res.status(400).json({ error: '询价不存在或未发布' });
    }

    // Check if supplier already quoted
    const existing = db.prepare(`
      SELECT id FROM quotations WHERE inquiry_id = ? AND supplier_id = ?
    `).get(inquiry_id, req.user.supplierId);

    if (existing) {
      return res.status(400).json({ error: '已经提交过报价' });
    }

    const result = db.prepare(`
      INSERT INTO quotations (inquiry_id, supplier_id, material_id, quantity, unit_price, delivery_days, valid_until, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(inquiry_id, req.user.supplierId, material_id, quantity, unit_price, delivery_days, valid_until);

    const quotation = db.prepare('SELECT * FROM quotations WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(quotation);
  } catch (error) {
    console.error('Submit quotation error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Accept quotation and create PO
router.post('/:id/accept', authenticate, authorize('admin', 'purchaser'), (req, res) => {
  try {
    const quotation = db.prepare(`
      SELECT q.*, i.title as inquiry_title
      FROM quotations q
      JOIN inquiries i ON q.inquiry_id = i.id
      WHERE q.id = ?
    `).get(req.params.id);

    if (!quotation) {
      return res.status(404).json({ error: '报价不存在' });
    }

    if (quotation.status !== 'pending') {
      return res.status(400).json({ error: '只能接受待处理的报价' });
    }

    // Update quotation status
    db.prepare('UPDATE quotations SET status = ? WHERE id = ?').run('accepted', req.params.id);

    // Get order number generator
    const generateOrderNo = () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
      return `PO${year}${month}${random}`;
    };

    const total_amount = (quotation.quantity || 0) * quotation.unit_price;
    const order_no = generateOrderNo();

    // Create order
    const result = db.prepare(`
      INSERT INTO orders (order_no, supplier_id, material_id, quantity, unit_price, total_amount, delivery_date, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, DATE('now', '+' || ? || ' days'), 'pending', ?)
    `).run(order_no, quotation.supplier_id, quotation.material_id, quotation.quantity, quotation.unit_price, total_amount, quotation.delivery_days, req.user.id);

    res.json({
      message: '报价已采纳，订单已创建',
      orderId: result.lastInsertRowid,
      quotationId: quotation.id
    });
  } catch (error) {
    console.error('Accept quotation error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Reject quotation
router.post('/:id/reject', authenticate, authorize('admin', 'purchaser'), (req, res) => {
  try {
    const { reason } = req.body;

    const quotation = db.prepare('SELECT * FROM quotations WHERE id = ?').get(req.params.id);

    if (!quotation) {
      return res.status(404).json({ error: '报价不存在' });
    }

    if (quotation.status !== 'pending') {
      return res.status(400).json({ error: '只能拒绝待处理的报价' });
    }

    db.prepare('UPDATE quotations SET status = ? WHERE id = ?').run('rejected', req.params.id);

    res.json({ message: '报价已拒绝' });
  } catch (error) {
    console.error('Reject quotation error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
