import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate, authorize } from '../middlewares/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new Database(path.join(__dirname, '..', '..', 'database', 'starlink.db'));

const router = express.Router();

const generateInquiryNo = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `IQ${year}${month}${random}`;
};

// Get all inquiries
router.get('/', authenticate, (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT i.*, u.username as created_by_name
      FROM inquiries i
      LEFT JOIN users u ON i.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }

    query += ' ORDER BY i.created_at DESC';

    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const inquiries = db.prepare(query).all(...params);

    const { total } = db.prepare('SELECT COUNT(*) as total FROM inquiries').get();

    res.json({
      data: inquiries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get inquiries error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Get single inquiry with quotations
router.get('/:id', authenticate, (req, res) => {
  try {
    const inquiry = db.prepare(`
      SELECT i.*, u.username as created_by_name
      FROM inquiries i
      LEFT JOIN users u ON i.created_by = u.id
      WHERE i.id = ?
    `).get(req.params.id);

    if (!inquiry) {
      return res.status(404).json({ error: '询价不存在' });
    }

    const quotations = db.prepare(`
      SELECT q.*, s.name as supplier_name, m.name as material_name
      FROM quotations q
      JOIN suppliers s ON q.supplier_id = s.id
      LEFT JOIN materials m ON q.material_id = m.id
      WHERE q.inquiry_id = ?
      ORDER BY q.created_at DESC
    `).all(req.params.id);

    res.json({ ...inquiry, quotations });
  } catch (error) {
    console.error('Get inquiry error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Create inquiry
router.post('/', authenticate, authorize('admin', 'purchaser'), (req, res) => {
  try {
    const { title, description, deadline } = req.body;

    if (!title) {
      return res.status(400).json({ error: '询价标题不能为空' });
    }

    const inquiry_no = generateInquiryNo();

    const result = db.prepare(`
      INSERT INTO inquiries (inquiry_no, title, description, status, deadline, created_by)
      VALUES (?, ?, ?, 'draft', ?, ?)
    `).run(inquiry_no, title, description, deadline, req.user.id);

    const inquiry = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(inquiry);
  } catch (error) {
    console.error('Create inquiry error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Update inquiry
router.put('/:id', authenticate, authorize('admin', 'purchaser'), (req, res) => {
  try {
    const inquiry = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(req.params.id);

    if (!inquiry) {
      return res.status(404).json({ error: '询价不存在' });
    }

    if (inquiry.status !== 'draft') {
      return res.status(400).json({ error: '只能修改草稿状态的询价' });
    }

    const { title, description, deadline } = req.body;

    db.prepare(`
      UPDATE inquiries
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          deadline = COALESCE(?, deadline)
      WHERE id = ?
    `).run(title, description, deadline, req.params.id);

    const updatedInquiry = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(req.params.id);

    res.json(updatedInquiry);
  } catch (error) {
    console.error('Update inquiry error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Publish inquiry
router.post('/:id/publish', authenticate, authorize('admin', 'purchaser'), (req, res) => {
  try {
    const { target_suppliers } = req.body;

    const inquiry = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(req.params.id);

    if (!inquiry) {
      return res.status(404).json({ error: '询价不存在' });
    }

    if (inquiry.status !== 'draft') {
      return res.status(400).json({ error: '只能发布草稿状态的询价' });
    }

    db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run('published', req.params.id);

    const updatedInquiry = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(req.params.id);

    res.json(updatedInquiry);
  } catch (error) {
    console.error('Publish inquiry error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Close inquiry
router.post('/:id/close', authenticate, authorize('admin', 'purchaser'), (req, res) => {
  try {
    const inquiry = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(req.params.id);

    if (!inquiry) {
      return res.status(404).json({ error: '询价不存在' });
    }

    if (inquiry.status !== 'published') {
      return res.status(400).json({ error: '只能关闭已发布的询价' });
    }

    db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run('closed', req.params.id);

    const updatedInquiry = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(req.params.id);

    res.json(updatedInquiry);
  } catch (error) {
    console.error('Close inquiry error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
