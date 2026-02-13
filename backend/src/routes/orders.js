import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, authorize, authorizeSupplier } from '../middlewares/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new Database(path.join(__dirname, '..', '..', 'database', 'starlink.db'));

const router = express.Router();

// Generate order number
const generateOrderNo = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `PO${year}${month}${random}`;
};

// Get all orders with filtering
router.get('/', authenticate, (req, res) => {
  try {
    const { status, supplier_id, start_date, end_date, search, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT o.*, s.name as supplier_name, m.name as material_name, m.code as material_code,
             u.username as created_by_name
      FROM orders o
      JOIN suppliers s ON o.supplier_id = s.id
      JOIN materials m ON o.material_id = m.id
      LEFT JOIN users u ON o.created_by = u.id
      WHERE 1=1
    `;

    const params = [];

    // Filter by role
    if (req.user.role === 'supplier') {
      query += ' AND o.supplier_id = ?';
      params.push(req.user.supplierId);
    }

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    if (supplier_id) {
      query += ' AND o.supplier_id = ?';
      params.push(supplier_id);
    }

    if (start_date) {
      query += ' AND o.delivery_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND o.delivery_date <= ?';
      params.push(end_date);
    }

    if (search) {
      query += ' AND (o.order_no LIKE ? OR s.name LIKE ? OR m.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY o.created_at DESC';

    // Pagination
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const orders = db.prepare(query).all(...params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      WHERE 1=1
    `;
    const countParams = [];

    if (req.user.role === 'supplier') {
      countQuery += ' AND o.supplier_id = ?';
      countParams.push(req.user.supplierId);
    }
    if (status) {
      countQuery += ' AND o.status = ?';
      countParams.push(status);
    }

    const { total } = db.prepare(countQuery).get(...countParams);

    res.json({
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Get single order
router.get('/:id', authenticate, (req, res) => {
  try {
    const order = db.prepare(`
      SELECT o.*, s.name as supplier_name, m.name as material_name, m.code as material_code,
             u.username as created_by_name
      FROM orders o
      JOIN suppliers s ON o.supplier_id = s.id
      JOIN materials m ON o.material_id = m.id
      LEFT JOIN users u ON o.created_by = u.id
      WHERE o.id = ?
    `).get(req.params.id);

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    // Check access
    if (req.user.role === 'supplier' && order.supplier_id !== req.user.supplierId) {
      return res.status(403).json({ error: '权限不足' });
    }

    // Get order logs
    const logs = db.prepare(`
      SELECT ol.*, u.username as operator_name
      FROM order_logs ol
      LEFT JOIN users u ON ol.operator_id = u.id
      WHERE ol.order_id = ?
      ORDER BY ol.created_at ASC
    `).all(req.params.id);

    res.json({ ...order, logs });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Create order
router.post('/', authenticate, authorize('admin', 'purchaser'), (req, res) => {
  try {
    const { supplier_id, material_id, quantity, unit_price, delivery_date, notes } = req.body;

    // Validation
    if (!supplier_id || !material_id || !quantity) {
      return res.status(400).json({ error: '供应商、物料和数量不能为空' });
    }

    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ? AND status = ?').get(supplier_id, 'active');
    if (!supplier) {
      return res.status(400).json({ error: '供应商不存在或已禁用' });
    }

    const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(material_id);
    if (!material) {
      return res.status(400).json({ error: '物料不存在' });
    }

    const total_amount = quantity * (unit_price || 0);
    const order_no = generateOrderNo();

    const result = db.prepare(`
      INSERT INTO orders (order_no, supplier_id, material_id, quantity, unit_price, total_amount, delivery_date, status, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(order_no, supplier_id, material_id, quantity, unit_price || null, total_amount, delivery_date, notes, req.user.id);

    // Create log
    db.prepare(`
      INSERT INTO order_logs (order_id, action, old_status, new_status, operator_id, remark)
      VALUES (?, 'created', NULL, 'pending', ?, '订单创建')
    `).run(result.lastInsertRowid, req.user.id);

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Update order
router.put('/:id', authenticate, authorize('admin', 'purchaser'), (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.status === 'completed' || order.status === 'cancelled') {
      return res.status(400).json({ error: '已完成或已取消的订单不能修改' });
    }

    const { quantity, unit_price, delivery_date, notes } = req.body;
    const total_amount = (quantity || order.quantity) * (unit_price !== undefined ? unit_price : order.unit_price || 0);

    db.prepare(`
      UPDATE orders
      SET quantity = COALESCE(?, quantity),
          unit_price = COALESCE(?, unit_price),
          total_amount = ?,
          delivery_date = COALESCE(?, delivery_date),
          notes = COALESCE(?, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(quantity, unit_price, total_amount, delivery_date, notes, req.params.id);

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

    res.json(updatedOrder);
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Confirm order (supplier)
router.post('/:id/confirm', authenticate, authorizeSupplier, (req, res) => {
  try {
    const order = db.prepare(`
      SELECT o.*, s.name as supplier_name
      FROM orders o
      JOIN suppliers s ON o.supplier_id = s.id
      WHERE o.id = ?
    `).get(req.params.id);

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.supplier_id !== req.user.supplierId) {
      return res.status(403).json({ error: '权限不足' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: '只能确认待确认的订单' });
    }

    db.prepare(`
      UPDATE orders SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(req.params.id);

    // Create log
    db.prepare(`
      INSERT INTO order_logs (order_id, action, old_status, new_status, operator_id, remark)
      VALUES (?, 'confirmed', 'pending', 'confirmed', ?, '供应商确认接单')
    `).run(req.params.id, req.user.id);

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

    res.json(updatedOrder);
  } catch (error) {
    console.error('Confirm order error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Ship order (supplier)
router.post('/:id/ship', authenticate, authorizeSupplier, (req, res) => {
  try {
    const { tracking_no } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.supplier_id !== req.user.supplierId) {
      return res.status(403).json({ error: '权限不足' });
    }

    if (order.status !== 'confirmed') {
      return res.status(400).json({ error: '只能发货已确认的订单' });
    }

    db.prepare(`
      UPDATE orders SET status = 'shipped', tracking_no = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(tracking_no, req.params.id);

    // Create log
    db.prepare(`
      INSERT INTO order_logs (order_id, action, old_status, new_status, operator_id, remark)
      VALUES (?, 'shipped', 'confirmed', 'shipped', ?, ?)
    `).run(req.params.id, req.user.id, tracking_no ? `发货，运单号：${tracking_no}` : '发货');

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

    res.json(updatedOrder);
  } catch (error) {
    console.error('Ship order error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Receive order (purchaser)
router.post('/:id/receive', authenticate, authorize('admin', 'purchaser'), (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.status !== 'shipped') {
      return res.status(400).json({ error: '只能收货已发货的订单' });
    }

    db.prepare(`
      UPDATE orders SET status = 'received', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(req.params.id);

    // Create log
    db.prepare(`
      INSERT INTO order_logs (order_id, action, old_status, new_status, operator_id, remark)
      VALUES (?, 'received', 'shipped', 'received', ?, '确认收货')
    `).run(req.params.id, req.user.id);

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

    res.json(updatedOrder);
  } catch (error) {
    console.error('Receive order error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Complete order
router.post('/:id/complete', authenticate, authorize('admin', 'purchaser'), (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.status !== 'received') {
      return res.status(400).json({ error: '只能完成已收货的订单' });
    }

    db.prepare(`
      UPDATE orders SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(req.params.id);

    // Create log
    db.prepare(`
      INSERT INTO order_logs (order_id, action, old_status, new_status, operator_id, remark)
      VALUES (?, 'completed', 'received', 'completed', ?, '订单完成')
    `).run(req.params.id, req.user.id);

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

    res.json(updatedOrder);
  } catch (error) {
    console.error('Complete order error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Cancel order
router.post('/:id/cancel', authenticate, authorize('admin', 'purchaser'), (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.status === 'completed' || order.status === 'cancelled') {
      return res.status(400).json({ error: '已完成或已取消的订单不能取消' });
    }

    db.prepare(`
      UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(req.params.id);

    // Create log
    db.prepare(`
      INSERT INTO order_logs (order_id, action, old_status, new_status, operator_id, remark)
      VALUES (?, 'cancelled', ?, 'cancelled', ?, '订单取消')
    `).run(req.params.id, order.status, req.user.id);

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

    res.json(updatedOrder);
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Import orders (placeholder for Excel import)
router.post('/import', authenticate, authorize('admin', 'purchaser'), (req, res) => {
  res.status(501).json({ error: 'Excel导入功能开发中' });
});

// Export orders
router.get('/export', authenticate, (req, res) => {
  try {
    const { status, supplier_id, start_date, end_date, search } = req.query;

    let query = `
      SELECT o.*, s.name as supplier_name, m.name as material_name, m.code as material_code,
             m.specification as material_spec, u.username as created_by_name
      FROM orders o
      JOIN suppliers s ON o.supplier_id = s.id
      JOIN materials m ON o.material_id = m.id
      LEFT JOIN users u ON o.created_by = u.id
      WHERE 1=1
    `;

    const params = [];

    // Filter by role
    if (req.user.role === 'supplier') {
      query += ' AND o.supplier_id = ?';
      params.push(req.user.supplierId);
    }

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    if (supplier_id) {
      query += ' AND o.supplier_id = ?';
      params.push(supplier_id);
    }

    if (start_date) {
      query += ' AND o.delivery_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND o.delivery_date <= ?';
      params.push(end_date);
    }

    if (search) {
      query += ' AND (o.order_no LIKE ? OR s.name LIKE ? OR m.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY o.created_at DESC';

    const orders = db.prepare(query).all(...params);

    res.json({ data: orders });
  } catch (error) {
    console.error('Export orders error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Get order timeline
router.get('/:id/timeline', authenticate, (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    // Check access
    if (req.user.role === 'supplier' && order.supplier_id !== req.user.supplierId) {
      return res.status(403).json({ error: '权限不足' });
    }

    const timeline = db.prepare(`
      SELECT ol.*, u.username as operator_name
      FROM order_logs ol
      LEFT JOIN users u ON ol.operator_id = u.id
      WHERE ol.order_id = ?
      ORDER BY ol.created_at ASC
    `).all(req.params.id);

    res.json({ timeline });
  } catch (error) {
    console.error('Get order timeline error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
