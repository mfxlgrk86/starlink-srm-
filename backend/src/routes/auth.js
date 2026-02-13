import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new Database(path.join(__dirname, '..', '..', 'database', 'starlink.db'));

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'starlink-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const user = db.prepare(`
      SELECT u.*, s.name as supplier_name
      FROM users u
      LEFT JOIN suppliers s ON u.supplier_id = s.id
      WHERE u.username = ?
    `).get(username);

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, supplierId: user.supplier_id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        supplierId: user.supplier_id,
        supplierName: user.supplier_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  // JWT is stateless, just return success
  res.json({ message: '登出成功' });
});

// Get current user profile
router.get('/profile', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未授权' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = db.prepare(`
      SELECT u.*, s.name as supplier_name
      FROM users u
      LEFT JOIN suppliers s ON u.supplier_id = s.id
      WHERE u.id = ?
    `).get(decoded.id);

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      supplierId: user.supplier_id,
      supplierName: user.supplier_name,
      createdAt: user.created_at
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: '无效的令牌' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '令牌已过期' });
    }
    console.error('Profile error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// WeChat login (placeholder)
router.post('/wechat-login', (req, res) => {
  const { code } = req.body;
  // WeChat OAuth integration would go here
  res.status(501).json({ error: '微信登录功能开发中' });
});

// Update profile
router.put('/profile', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未授权' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // Note: We don't allow changing username or role, only additional profile info
    // For now, just return success - the profile is read-only
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Change password
router.post('/change-password', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未授权' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: '当前密码和新密码不能为空' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: '新密码长度至少6位' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // Verify current password
    const validPassword = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: '当前密码错误' });
    }

    // Hash new password
    const passwordHash = bcrypt.hashSync(newPassword, 10);

    // Update password
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, decoded.id);

    res.json({ message: '密码修改成功' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
