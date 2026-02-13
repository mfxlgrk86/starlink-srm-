import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate, authorize } from '../middlewares/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new Database(path.join(__dirname, '..', '..', 'database', 'starlink.db'));

const router = express.Router();

// AI parse order from natural language
router.post('/parse-order', authenticate, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: '请输入采购需求描述' });
    }

    // Simulated AI response - in production would call MiniMax API
    const mockAIResponse = {
      supplier_name: '华威机械',
      material_name: '精密轴承',
      quantity: 500,
      delivery_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      confidence: 0.92,
      raw_response: `从需求"${text}"中提取的信息：供应商:华威机械,物料:精密轴承,数量:500,交货日期:明天`
    };

    // In production, this would call the MiniMax API
    // const response = await minimaxClient.chat(prompt);

    res.json(mockAIResponse);
  } catch (error) {
    console.error('AI parse order error:', error);
    res.status(500).json({ error: 'AI处理失败' });
  }
});

// AI polish inquiry description
router.post('/polish-inquiry', authenticate, async (req, res) => {
  try {
    const { description, title } = req.body;

    if (!description) {
      return res.status(400).json({ error: '请输入询价描述' });
    }

    // Simulated AI response
    const mockAIResponse = {
      polished_title: title || '采购询价',
      polished_description: description,
      suggestions: [
        '建议补充具体规格参数',
        '建议明确交货地点',
        '建议说明付款方式'
      ],
      enhanced_description: `${description}\n\n【规格要求】请明确具体技术参数\n【交货要求】请说明交货地点和时间要求\n【付款方式】可协商`
    };

    res.json(mockAIResponse);
  } catch (error) {
    console.error('AI polish inquiry error:', error);
    res.status(500).json({ error: 'AI处理失败' });
  }
});

// AI audit reconciliation
router.post('/audit-reconciliation', authenticate, async (req, res) => {
  try {
    const { reconciliation_id } = req.body;

    if (!reconciliation_id) {
      return res.status(400).json({ error: '请提供对账单ID' });
    }

    // Simulated AI audit response
    const mockAIResponse = {
      reconciliation_id,
      status: 'pass',
      issues: [],
      summary: '对账单数据核对一致，无异常',
      suggestions: [
        '建议定期与供应商核对往来账目',
        '及时处理差异项'
      ],
      audit_details: {
        order_count: 5,
        total_order_amount: 150000,
        invoice_count: 5,
        total_invoice_amount: 150000,
        difference: 0
      }
    };

    res.json(mockAIResponse);
  } catch (error) {
    console.error('AI audit reconciliation error:', error);
    res.status(500).json({ error: 'AI处理失败' });
  }
});

// AI OCR invoice recognition
router.post('/ocr-invoice', authenticate, async (req, res) => {
  try {
    const { image_url } = req.body;

    if (!image_url) {
      return res.status(400).json({ error: '请提供发票图片URL' });
    }

    // Simulated OCR response
    const mockOCRResult = {
      invoice_no: 'FP2024010001',
      invoice_date: '2024-01-15',
      amount: 10000.00,
      tax_amount: 1300.00,
      seller_name: '华威机械有限公司',
      confidence: 0.95,
      raw_text: '发票号:FP2024010001\n日期:2024-01-15\n金额:10000元\n税额:1300元'
    };

    res.json(mockOCRResult);
  } catch (error) {
    console.error('AI OCR invoice error:', error);
    res.status(500).json({ error: 'AI处理失败' });
  }
});

// Get audit history
router.get('/audit-history', authenticate, (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    let query = `
      SELECT r.*, s.name as supplier_name, r.ai_audit_result
      FROM reconciliations r
      JOIN suppliers s ON r.supplier_id = s.id
      WHERE r.ai_audit_result IS NOT NULL
    `;
    const params = [];

    // Filter by role
    if (req.user.role === 'supplier') {
      query += ' AND r.supplier_id = ?';
      params.push(req.user.supplierId);
    }

    query += ' ORDER BY r.created_at DESC';

    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const history = db.prepare(query).all(...params);

    // Parse JSON results
    const parsedHistory = history.map(item => ({
      ...item,
      audit_result: item.ai_audit_result ? JSON.parse(item.ai_audit_result) : null
    }));

    res.json({
      data: parsedHistory,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: history.length,
        totalPages: Math.ceil(history.length / limit)
      }
    });
  } catch (error) {
    console.error('Get audit history error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Approve reconciliation after AI audit
router.post('/approve-reconciliation', authenticate, authorize('admin', 'finance'), async (req, res) => {
  try {
    const { reconciliation_id, notes } = req.body;

    if (!reconciliation_id) {
      return res.status(400).json({ error: '请提供对账单ID' });
    }

    const reconciliation = db.prepare('SELECT * FROM reconciliations WHERE id = ?').get(reconciliation_id);

    if (!reconciliation) {
      return res.status(404).json({ error: '对账单不存在' });
    }

    // Update reconciliation status
    db.prepare(`
      UPDATE reconciliations SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(reconciliation_id);

    res.json({ message: '审批通过', status: 'confirmed' });
  } catch (error) {
    console.error('Approve reconciliation error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Reject reconciliation after AI audit
router.post('/reject-reconciliation', authenticate, authorize('admin', 'finance'), async (req, res) => {
  try {
    const { reconciliation_id, reason } = req.body;

    if (!reconciliation_id) {
      return res.status(400).json({ error: '请提供对账单ID' });
    }

    const reconciliation = db.prepare('SELECT * FROM reconciliations WHERE id = ?').get(reconciliation_id);

    if (!reconciliation) {
      return res.status(404).json({ error: '对账单不存在' });
    }

    // Update reconciliation status back to draft
    db.prepare(`
      UPDATE reconciliations SET status = 'draft', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(reconciliation_id);

    res.json({ message: '已驳回', status: 'draft' });
  } catch (error) {
    console.error('Reject reconciliation error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
