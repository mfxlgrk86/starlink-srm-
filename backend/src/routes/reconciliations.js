import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate, authorize, authorizeSupplier } from '../middlewares/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new Database(path.join(__dirname, '..', 'database', 'starlink.db'));

const router = express.Router();

const generateReconciliationNo = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `RC${year}${month}${random}`;
};

// Get all reconciliations
router.get('/', authenticate, (req, res) => {
  try {
    const { status, supplier_id, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT r.*, s.name as supplier_name
      FROM reconciliations r
      JOIN suppliers s ON r.supplier_id = s.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by role
    if (req.user.role === 'supplier') {
      query += ' AND r.supplier_id = ?';
      params.push(req.user.supplierId);
    }

    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }

    if (supplier_id && req.user.role !== 'supplier') {
      query += ' AND r.supplier_id = ?';
      params.push(supplier_id);
    }

    query += ' ORDER BY r.created_at DESC';

    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const reconciliations = db.prepare(query).all(...params);

    res.json({ data: reconciliations });
  } catch (error) {
    console.error('Get reconciliations error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Get single reconciliation
router.get('/:id', authenticate, (req, res) => {
  try {
    const reconciliation = db.prepare(`
      SELECT r.*, s.name as supplier_name
      FROM reconciliations r
      JOIN suppliers s ON r.supplier_id = s.id
      WHERE r.id = ?
    `).get(req.params.id);

    if (!reconciliation) {
      return res.status(404).json({ error: '对账单不存在' });
    }

    // Get related orders
    const orders = db.prepare(`
      SELECT * FROM orders
      WHERE supplier_id = ?
      AND status IN ('received', 'completed')
      AND created_at BETWEEN ? AND ?
    `).all(reconciliation.supplier_id, reconciliation.period_start, reconciliation.period_end);

    // Get related invoices
    const invoices = db.prepare(`
      SELECT * FROM invoices
      WHERE supplier_id = ?
      AND created_at BETWEEN ? AND ?
    `).all(reconciliation.supplier_id, reconciliation.period_start, reconciliation.period_end);

    res.json({ ...reconciliation, orders, invoices });
  } catch (error) {
    console.error('Get reconciliation error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Create reconciliation
router.post('/', authenticate, authorize('admin', 'purchaser', 'finance'), (req, res) => {
  try {
    const { supplier_id, period_start, period_end } = req.body;

    if (!supplier_id || !period_start || !period_end) {
      return res.status(400).json({ error: '供应商和期间不能为空' });
    }

    // Calculate total from completed orders
    const orders = db.prepare(`
      SELECT SUM(total_amount) as total
      FROM orders
      WHERE supplier_id = ?
      AND status IN ('received', 'completed')
      AND delivery_date BETWEEN ? AND ?
    `).get(supplier_id, period_start, period_end);

    const reconciliation_no = generateReconciliationNo();
    const total_amount = orders.total || 0;

    const result = db.prepare(`
      INSERT INTO reconciliations (reconciliation_no, supplier_id, period_start, period_end, total_amount, status)
      VALUES (?, ?, ?, ?, ?, 'draft')
    `).run(reconciliation_no, supplier_id, period_start, period_end, total_amount);

    const reconciliation = db.prepare('SELECT * FROM reconciliations WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(reconciliation);
  } catch (error) {
    console.error('Create reconciliation error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Send reconciliation to supplier
router.post('/:id/send', authenticate, authorize('admin', 'purchaser', 'finance'), (req, res) => {
  try {
    const reconciliation = db.prepare('SELECT * FROM reconciliations WHERE id = ?').get(req.params.id);

    if (!reconciliation) {
      return res.status(404).json({ error: '对账单不存在' });
    }

    if (reconciliation.status !== 'draft') {
      return res.status(400).json({ error: '只能发送草稿状态的对账单' });
    }

    db.prepare('UPDATE reconciliations SET status = ? WHERE id = ?').run('sent', req.params.id);

    const updatedReconciliation = db.prepare('SELECT * FROM reconciliations WHERE id = ?').get(req.params.id);

    res.json(updatedReconciliation);
  } catch (error) {
    console.error('Send reconciliation error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Confirm reconciliation (supplier)
router.post('/:id/confirm', authenticate, authorizeSupplier, (req, res) => {
  try {
    const reconciliation = db.prepare('SELECT * FROM reconciliations WHERE id = ?').get(req.params.id);

    if (!reconciliation) {
      return res.status(404).json({ error: '对账单不存在' });
    }

    if (reconciliation.supplier_id !== req.user.supplierId) {
      return res.status(403).json({ error: '权限不足' });
    }

    if (reconciliation.status !== 'sent') {
      return res.status(400).json({ error: '只能确认已发送的对账单' });
    }

    db.prepare('UPDATE reconciliations SET status = ? WHERE id = ?').run('confirmed', req.params.id);

    const updatedReconciliation = db.prepare('SELECT * FROM reconciliations WHERE id = ?').get(req.params.id);

    res.json(updatedReconciliation);
  } catch (error) {
    console.error('Confirm reconciliation error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Mark as paid
router.post('/:id/paid', authenticate, authorize('admin', 'purchaser', 'finance'), (req, res) => {
  try {
    const reconciliation = db.prepare('SELECT * FROM reconciliations WHERE id = ?').get(req.params.id);

    if (!reconciliation) {
      return res.status(404).json({ error: '对账单不存在' });
    }

    if (reconciliation.status !== 'confirmed') {
      return res.status(400).json({ error: '只能标记已确认的对账单为已付款' });
    }

    db.prepare('UPDATE reconciliations SET status = ? WHERE id = ?').run('paid', req.params.id);

    const updatedReconciliation = db.prepare('SELECT * FROM reconciliations WHERE id = ?').get(req.params.id);

    res.json(updatedReconciliation);
  } catch (error) {
    console.error('Mark paid error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
