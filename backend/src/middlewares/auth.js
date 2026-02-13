import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'starlink-secret-key';

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未授权' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: '无效的令牌' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '令牌已过期' });
    }
    console.error('Auth error:', error);
    res.status(500).json({ error: '认证失败' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未授权' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }

    next();
  };
};

export const authorizeSupplier = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: '未授权' });
  }

  if (req.user.role !== 'supplier') {
    return res.status(403).json({ error: '权限不足' });
  }

  next();
};
