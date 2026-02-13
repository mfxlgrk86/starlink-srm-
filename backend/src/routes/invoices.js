import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate, authorize, authorizeSupplier } from '../middlewares/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new Database(path.join(__dirname, '..', '..', 'database', 'starlink.db'));

const router = express.Router();

// Get all invoices
router.get('/', authenticate, (req, res) => {
  try {
    const { status, supplier_id, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT i.*, s.name as supplier_name, r.reconciliation_no
      FROM invoices i
      JOIN suppliers s ON i.supplier_id = s.id
      LEFT JOIN reconciliations r ON i.reconciliation_id = r.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by role
    if (req.user.role === 'supplier') {
      query += ' AND i.supplier_id = ?';
      params.push(req.user.supplierId);
    }

    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }

    if (supplier_id && req.user.role !== 'supplier') {
      query += ' AND i.supplier_id = ?';
      params.push(supplier_id);
    }

    query += ' ORDER BY i.created_at DESC';

    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const invoices = db.prepare(query).all(...params);

    res.json({ data: invoices });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Get single invoice
router.get('/:id', authenticate, (req, res) => {
  try {
    const invoice = db.prepare(`
      SELECT i.*, s.name as supplier_name, r.reconciliation_no
      FROM invoices i
      JOIN suppliers s ON i.supplier_id = s.id
      LEFT JOIN reconciliations r ON i.reconciliation_id = r.id
      WHERE i.id = ?
    `).get(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: '发票不存在' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Upload invoice
router.post('/', authenticate, authorizeSupplier, (req, res) => {
  try {
    const { invoice_no, invoice_date, amount, tax_amount, image_url } = req.body;

    if (!invoice_no || !amount) {
      return res.status(400).json({ error: '发票号和金额不能为空' });
    }

    const result = db.prepare(`
      INSERT INTO invoices (supplier_id, invoice_no, invoice_date, amount, tax_amount, image_url, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(req.user.supplierId, invoice_no, invoice_date, amount, tax_amount, image_url);

    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Upload invoice error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Verify invoice
router.post('/:id/verify', authenticate, authorize('admin', 'purchaser', 'finance'), (req, res) => {
  try {
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: '发票不存在' });
    }

    if (invoice.status !== 'pending') {
      return res.status(400).json({ error: '只能验证待处理的发票' });
    }

    db.prepare('UPDATE invoices SET status = ? WHERE id = ?').run('verified', req.params.id);

    const updatedInvoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);

    res.json(updatedInvoice);
  } catch (error) {
    console.error('Verify invoice error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Reject invoice
router.post('/:id/reject', authenticate, authorize('admin', 'purchaser', 'finance'), (req, res) => {
  try {
    const { reason } = req.body;

    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: '发票不存在' });
    }

    if (invoice.status !== 'pending') {
      return res.status(400).json({ error: '只能拒绝待处理的发票' });
    }

    db.prepare('UPDATE invoices SET status = ? WHERE id = ?').run('rejected', req.params.id);

    res.json({ message: '发票已拒绝' });
  } catch (error) {
    console.error('Reject invoice error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Link invoice to reconciliation
router.post('/:id/link', authenticate, authorize('admin', 'purchaser', 'finance'), (req, res) => {
  try {
    const { reconciliation_id } = req.body;

    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: '发票不存在' });
    }

    const reconciliation = db.prepare('SELECT * FROM reconciliations WHERE id = ?').get(reconciliation_id);

    if (!reconciliation) {
      return res.status(404).json({ error: '对账单不存在' });
    }

    if (invoice.supplier_id !== reconciliation.supplier_id) {
      return res.status(400).json({ error: '发票和对账单的供应商不匹配' });
    }

    db.prepare('UPDATE invoices SET reconciliation_id = ? WHERE id = ?').run(reconciliation_id, req.params.id);

    const updatedInvoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);

    res.json(updatedInvoice);
  } catch (error) {
    console.error('Link invoice error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
