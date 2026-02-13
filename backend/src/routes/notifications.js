import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate } from '../middlewares/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new Database(path.join(__dirname, '..', '..', 'database', 'starlink.db'));

const router = express.Router();

// Get all notifications for current user
router.get('/', authenticate, (req, res) => {
  try {
    const { page = 1, limit = 20, unread_only } = req.query;

    let query = `
      SELECT * FROM notifications
      WHERE user_id = ?
    `;
    const params = [req.user.id];

    if (unread_only === 'true') {
      query += ' AND read = 0';
    }

    query += ' ORDER BY created_at DESC';

    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const notifications = db.prepare(query).all(...params);

    // Get unread count
    const { unread_count } = db.prepare(`
      SELECT COUNT(*) as unread_count FROM notifications
      WHERE user_id = ? AND read = 0
    `).get(req.user.id);

    res.json({
      data: notifications,
      unreadCount: unread_count,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: notifications.length,
        totalPages: Math.ceil(notifications.length / limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Get unread count
router.get('/unread-count', authenticate, (req, res) => {
  try {
    const { unread_count } = db.prepare(`
      SELECT COUNT(*) as unread_count FROM notifications
      WHERE user_id = ? AND read = 0
    `).get(req.user.id);

    res.json({ unreadCount: unread_count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Mark notification as read
router.put('/:id/read', authenticate, (req, res) => {
  try {
    const notification = db.prepare(`
      SELECT * FROM notifications WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!notification) {
      return res.status(404).json({ error: '通知不存在' });
    }

    db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.id);

    res.json({ message: '标记已读成功' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Mark all as read
router.put('/read-all', authenticate, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.user.id);

    res.json({ message: '全部标记已读成功' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Delete notification
router.delete('/:id', authenticate, (req, res) => {
  try {
    const notification = db.prepare(`
      SELECT * FROM notifications WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!notification) {
      return res.status(404).json({ error: '通知不存在' });
    }

    db.prepare('DELETE FROM notifications WHERE id = ?').run(req.params.id);

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Create notification (internal use)
export const createNotification = (userId, type, title, content, link = null) => {
  try {
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, content, link)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, type, title, content, link);
  } catch (error) {
    console.error('Create notification error:', error);
  }
};

export default router;
