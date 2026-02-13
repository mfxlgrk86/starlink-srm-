import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/orders.js';
import supplierRoutes from './routes/suppliers.js';
import inquiryRoutes from './routes/inquiries.js';
import quotationRoutes from './routes/quotations.js';
import reconciliationRoutes from './routes/reconciliations.js';
import invoiceRoutes from './routes/invoices.js';
import aiRoutes from './routes/ai.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/inquiries', inquiryRoutes);
app.use('/api/v1/quotations', quotationRoutes);
app.use('/api/v1/reconciliations', reconciliationRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Version
app.get('/api/version', (req, res) => {
  res.json({ version: '1.0.0', name: 'StarLink SRM API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`StarLink SRM API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

export default app;
