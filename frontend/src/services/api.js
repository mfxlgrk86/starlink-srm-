import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data)
};

// Orders API
export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  getMy: () => api.get('/orders/my'),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  confirm: (id) => api.post(`/orders/${id}/confirm`),
  ship: (id, data) => api.post(`/orders/${id}/ship`, data),
  receive: (id) => api.post(`/orders/${id}/receive`),
  complete: (id) => api.post(`/orders/${id}/complete`),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
  export: (params) => api.get('/orders/export', { params }),
  getTimeline: (id) => api.get(`/orders/${id}/timeline`)
};

// Suppliers API
export const suppliersAPI = {
  getAll: (params) => api.get('/suppliers', { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  block: (id) => api.put(`/suppliers/${id}/block`),
  activate: (id) => api.put(`/suppliers/${id}/activate`),
  updateRating: (id, data) => api.put(`/suppliers/${id}/rating`, data),
  export: (params) => api.get('/suppliers/export', { params })
};

// Inquiries API
export const inquiriesAPI = {
  getAll: (params) => api.get('/inquiries', { params }),
  getById: (id) => api.get(`/inquiries/${id}`),
  create: (data) => api.post('/inquiries', data),
  update: (id, data) => api.put(`/inquiries/${id}`, data),
  publish: (id, data) => api.post(`/inquiries/${id}/publish`, data),
  close: (id) => api.post(`/inquiries/${id}/close`)
};

// Quotations API
export const quotationsAPI = {
  getByInquiry: (inquiryId) => api.get(`/quotations/inquiry/${inquiryId}`),
  getMy: () => api.get('/quotations/my'),
  create: (data) => api.post('/quotations', data),
  accept: (id) => api.post(`/quotations/${id}/accept`),
  reject: (id, data) => api.post(`/quotations/${id}/reject`, data)
};

// Reconciliations API
export const reconciliationsAPI = {
  getAll: (params) => api.get('/reconciliations', { params }),
  getById: (id) => api.get(`/reconciliations/${id}`),
  create: (data) => api.post('/reconciliations', data),
  update: (id, data) => api.put(`/reconciliations/${id}`, data),
  send: (id) => api.post(`/reconciliations/${id}/send`),
  confirm: (id) => api.post(`/reconciliations/${id}/confirm`),
  markPaid: (id) => api.post(`/reconciliations/${id}/paid`),
  export: (params) => api.get('/reconciliations/export', { params })
};

// Invoices API
export const invoicesAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  verify: (id) => api.post(`/invoices/${id}/verify`),
  reject: (id, data) => api.post(`/invoices/${id}/reject`, data),
  link: (id, data) => api.post(`/invoices/${id}/link`, data)
};

// AI API
export const aiAPI = {
  parseOrder: (data) => api.post('/ai/parse-order', data),
  polishInquiry: (data) => api.post('/ai/polish-inquiry', data),
  auditReconciliation: (data) => api.post('/ai/audit-reconciliation', data),
  ocrInvoice: (data) => api.post('/ai/ocr-invoice', data),
  getAuditHistory: (params) => api.get('/ai/audit-history', { params }),
  approveReconciliation: (data) => api.post('/ai/approve-reconciliation', data),
  rejectReconciliation: (data) => api.post('/ai/reject-reconciliation', data)
};

// Notifications API
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`)
};

export default api;
