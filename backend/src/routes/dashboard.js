import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate, authorize } from '../middlewares/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new Database(path.join(__dirname, '..', '..', 'database', 'starlink.db'));

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticate, authorize('admin', 'purchaser', 'finance'), (req, res) => {
  try {
    // Get order stats
    const orderStats = db.prepare(`
      SELECT
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_orders,
        SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped_orders,
        SUM(CASE WHEN status = 'received' THEN 1 ELSE 0 END) as received_orders,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        SUM(total_amount) as total_amount
      FROM orders
    `).get();

    // Get supplier stats
    const supplierStats = db.prepare(`
      SELECT
        COUNT(*) as total_suppliers,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_suppliers,
        SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked_suppliers,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_suppliers,
        AVG(rating) as average_rating
      FROM suppliers
    `).get();

    // Get inquiry stats
    const inquiryStats = db.prepare(`
      SELECT
        COUNT(*) as total_inquiries,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_inquiries,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_inquiries,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_inquiries
      FROM inquiries
    `).get();

    // Get recent orders
    const recentOrders = db.prepare(`
      SELECT o.*, s.name as supplier_name, m.name as material_name
      FROM orders o
      LEFT JOIN suppliers s ON o.supplier_id = s.id
      LEFT JOIN materials m ON o.material_id = m.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `).all();

    // Get pending actions
    const pendingActions = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders_count,
        (SELECT COUNT(*) FROM orders WHERE status = 'shipped') as shipped_orders_count,
        (SELECT COUNT(*) FROM reconciliations WHERE status = 'draft') as draft_reconciliations_count,
        (SELECT COUNT(*) FROM invoices WHERE status = 'pending') as pending_invoices_count
    `).get();

    res.json({
      orderStats,
      supplierStats,
      inquiryStats,
      recentOrders,
      pendingActions
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
