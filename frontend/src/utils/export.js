import * as XLSX from 'xlsx';
import { format } from 'date-fns';

/**
 * Export data to Excel file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {Object} options - Optional configuration
 * @param {string} options.sheetName - Name of the worksheet (default: 'Sheet1')
 * @param {Array} options.headers - Custom headers mapping {key, label}
 */
export const exportToExcel = (data, filename, options = {}) => {
  const { sheetName = 'Sheet1', headers } = options;

  // If custom headers provided, map data to match
  let exportData = data;
  if (headers && headers.length > 0) {
    exportData = data.map(row => {
      const mapped = {};
      headers.forEach(({ key, label }) => {
        mapped[label] = row[key];
      });
      return mapped;
    });
  }

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Auto-size columns
  const columnWidths = [];
  if (exportData.length > 0) {
    const keys = Object.keys(exportData[0]);
    keys.forEach(key => {
      const maxLength = Math.max(
        key.length,
        ...exportData.map(row => String(row[key] || '').length)
      );
      columnWidths.push({ wch: Math.min(maxLength + 2, 50) });
    });
  }
  worksheet['!cols'] = columnWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate and download file
  const dateStr = format(new Date(), 'yyyyMMdd_HHmmss');
  XLSX.writeFile(workbook, `${filename}_${dateStr}.xlsx`);
};

/**
 * Export data to CSV file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {Object} options - Optional configuration
 * @param {string} options.sheetName - Name of the worksheet (default: 'Sheet1')
 * @param {Array} options.headers - Custom headers mapping {key, label}
 */
export const exportToCSV = (data, filename, options = {}) => {
  const { headers } = options;

  // If custom headers provided, map data to match
  let exportData = data;
  if (headers && headers.length > 0) {
    exportData = data.map(row => {
      const mapped = {};
      headers.forEach(({ key, label }) => {
        mapped[label] = row[key];
      });
      return mapped;
    });
  }

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  // Generate and download file as CSV
  const dateStr = format(new Date(), 'yyyyMMdd_HHmmss');
  XLSX.writeFile(workbook, `${filename}_${dateStr}.csv`, { bookType: 'csv' });
};

/**
 * Format order data for export
 * @param {Array} orders - Array of order objects
 * @returns {Array} Formatted order data
 */
export const formatOrdersForExport = (orders) => {
  return orders.map(order => ({
    '订单号': order.order_no,
    '供应商': order.supplier_name || '',
    '物料': order.material_name || '',
    '规格': order.material_spec || '',
    '数量': order.quantity,
    '单价': order.unit_price,
    '总金额': order.total_amount,
    '交货日期': order.delivery_date,
    '状态': getStatusLabel(order.status),
    '创建时间': order.created_at ? format(new Date(order.created_at), 'yyyy-MM-dd HH:mm') : ''
  }));
};

/**
 * Format supplier data for export
 * @param {Array} suppliers - Array of supplier objects
 * @returns {Array} Formatted supplier data
 */
export const formatSuppliersForExport = (suppliers) => {
  return suppliers.map(supplier => ({
    '供应商名称': supplier.name,
    '联系人': supplier.contact_name || '',
    '联系电话': supplier.contact_phone || '',
    '地址': supplier.address || '',
    '状态': getStatusLabel(supplier.status),
    '评分': supplier.rating || '',
    '创建时间': supplier.created_at ? format(new Date(supplier.created_at), 'yyyy-MM-dd HH:mm') : ''
  }));
};

/**
 * Format reconciliation data for export
 * @param {Array} reconciliations - Array of reconciliation objects
 * @returns {Array} Formatted reconciliation data
 */
export const formatReconciliationsForExport = (reconciliations) => {
  return reconciliations.map(rec => ({
    '对账单号': rec.reconciliation_no,
    '供应商': rec.supplier_name || '',
    '期间开始': rec.period_start,
    '期间结束': rec.period_end,
    '总金额': rec.total_amount,
    '状态': getStatusLabel(rec.status),
    '创建时间': rec.created_at ? format(new Date(rec.created_at), 'yyyy-MM-dd HH:mm') : ''
  }));
};

/**
 * Get status label in Chinese
 * @param {string} status - Status code
 * @returns {string} Chinese label
 */
const getStatusLabel = (status) => {
  const statusMap = {
    // Order statuses
    pending: '待确认',
    confirmed: '已确认',
    shipped: '已发货',
    received: '已收货',
    completed: '已完成',
    cancelled: '已取消',
    // Supplier statuses
    active: '活跃',
    blocked: '已停用',
    pending: '待审核',
    // Reconciliation statuses
    draft: '草稿',
    sent: '已发送',
    paid: '已付款',
    // Invoice statuses
    verified: '已验证'
  };
  return statusMap[status] || status;
};

export default {
  exportToExcel,
  exportToCSV,
  formatOrdersForExport,
  formatSuppliersForExport,
  formatReconciliationsForExport
};
