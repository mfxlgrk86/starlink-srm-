import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reconciliationsAPI, invoicesAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const Finance = () => {
  const { user } = useAuthStore();
  const [reconciliations, setReconciliations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [activeTab, setActiveTab] = useState('reconciliations');
  const [loading, setLoading] = useState(true);
  const [showCreateReconciliation, setShowCreateReconciliation] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reconRes, invoiceRes] = await Promise.all([
        reconciliationsAPI.getAll({}),
        invoicesAPI.getAll({})
      ]);
      setReconciliations(reconRes.data.data);
      setInvoices(invoiceRes.data.data);
    } catch (error) {
      console.error('Fetch finance data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReconciliation = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      supplier_id: parseInt(formData.get('supplier_id')),
      period_start: formData.get('period_start'),
      period_end: formData.get('period_end')
    };

    try {
      await reconciliationsAPI.create(data);
      setShowCreateReconciliation(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || '创建失败');
    }
  };

  const handleSend = async (id) => {
    try {
      await reconciliationsAPI.send(id);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || '操作失败');
    }
  };

  const handleVerify = async (id) => {
    try {
      await invoicesAPI.verify(id);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || '操作失败');
    }
  };

  const getReconciliationStatusBadge = (status) => {
    const statusMap = {
      draft: '草稿',
      sent: '已发送',
      confirmed: '已确认',
      paid: '已付款'
    };
    return <span className={`badge ${status === 'paid' ? 'badge-completed' : status === 'confirmed' ? 'badge-confirmed' : status === 'sent' ? 'badge-received' : 'badge-pending'}`}>{statusMap[status] || status}</span>;
  };

  const getInvoiceStatusBadge = (status) => {
    const statusMap = {
      pending: '待验证',
      verified: '已验证',
      rejected: '已拒绝'
    };
    return <span className={`badge ${status === 'verified' ? 'badge-completed' : status === 'rejected' ? 'badge-cancelled' : 'badge-pending'}`}>{statusMap[status] || status}</span>;
  };

  const isFinance = user?.role === 'finance' || user?.role === 'admin';
  const isSupplier = user?.role === 'supplier';

  // Stats
  const stats = {
    totalReconciliations: reconciliations.length,
    pendingAmount: reconciliations.filter(r => ['draft', 'sent'].includes(r.status)).reduce((sum, r) => sum + Number(r.total_amount || 0), 0),
    totalInvoices: invoices.length,
    verifiedAmount: invoices.filter(i => i.status === 'verified').reduce((sum, i) => sum + Number(i.amount || 0), 0)
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">财务协同</h2>
          <p className="text-sm text-gray-500 mt-1">管理对账单和发票</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/finance/ai-history"
            className="flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-colors"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI审计记录
          </Link>
          {isFinance && (
            <button
              onClick={() => setShowCreateReconciliation(true)}
              className="btn-primary flex items-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              创建对账单
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-gray-500 text-sm">对账单总数</div>
          <div className="text-2xl font-semibold text-gray-800 mt-1">{stats.totalReconciliations}</div>
        </div>
        <div className="card p-4">
          <div className="text-gray-500 text-sm">待处理金额</div>
          <div className="text-2xl font-semibold text-amber-600 mt-1">¥{stats.pendingAmount.toLocaleString()}</div>
        </div>
        <div className="card p-4">
          <div className="text-gray-500 text-sm">发票总数</div>
          <div className="text-2xl font-semibold text-gray-800 mt-1">{stats.totalInvoices}</div>
        </div>
        <div className="card p-4">
          <div className="text-gray-500 text-sm">已验证金额</div>
          <div className="text-2xl font-semibold text-emerald-600 mt-1">¥{stats.verifiedAmount.toLocaleString()}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('reconciliations')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'reconciliations'
              ? 'text-gray-800 border-b-2 border-gray-800'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          对账管理
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'invoices'
              ? 'text-gray-800 border-b-2 border-gray-800'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          发票管理
        </button>
      </div>

      {/* Reconciliations */}
      {activeTab === 'reconciliations' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500">加载中...</div>
          ) : reconciliations.length > 0 ? (
            reconciliations.map((recon) => (
              <div key={recon.id} className="card">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-800">{recon.reconciliation_no}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      供应商: {recon.supplier_name}
                    </p>
                  </div>
                  {getReconciliationStatusBadge(recon.status)}
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">对账期间</span>
                    <span className="text-gray-800">
                      {recon.period_start} ~ {recon.period_end}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-gray-500 text-sm">金额</span>
                    <span className="text-lg font-semibold text-gray-800">
                      ¥{Number(recon.total_amount).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="px-4 pb-4 space-y-2">
                  <Link
                    to={`/finance/ai/${recon.id}`}
                    className="flex items-center justify-center w-full px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI审计
                  </Link>
                  {isFinance && recon.status === 'draft' && (
                    <button
                      onClick={() => handleSend(recon.id)}
                      className="btn-primary text-sm w-full"
                    >
                      发送给供应商
                    </button>
                  )}
                  {isSupplier && recon.status === 'sent' && (
                    <button
                      onClick={() => handleSend(recon.id)}
                      className="btn-primary text-sm w-full"
                    >
                      确认对账单
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="card text-center py-12 text-gray-500">
              暂无对账单数据
            </div>
          )}
        </div>
      )}

      {/* Invoices */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500">加载中...</div>
          ) : invoices.length > 0 ? (
            <div className="card p-0 overflow-hidden">
              <table className="table">
                <thead>
                  <tr>
                    <th>发票号</th>
                    <th>供应商</th>
                    <th>金额</th>
                    <th>税额</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="font-medium text-gray-800">{invoice.invoice_no}</td>
                      <td className="text-gray-600">{invoice.supplier_name}</td>
                      <td className="font-medium">¥{Number(invoice.amount).toLocaleString()}</td>
                      <td className="text-gray-600">¥{Number(invoice.tax_amount || 0).toLocaleString()}</td>
                      <td>{getInvoiceStatusBadge(invoice.status)}</td>
                      <td>
                        {isFinance && invoice.status === 'pending' && (
                          <button
                            onClick={() => handleVerify(invoice.id)}
                            className="text-gray-800 hover:text-gray-600 font-medium text-sm"
                          >
                            验证
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card text-center py-12 text-gray-500">
              暂无发票数据
            </div>
          )}
        </div>
      )}

      {/* Create reconciliation Modal */}
      {showCreateReconciliation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">创建对账单</h3>
            </div>
            <form onSubmit={handleCreateReconciliation} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  供应商 *
                </label>
                <select
                  name="supplier_id"
                  required
                  className="input-field"
                  defaultValue=""
                >
                  <option value="" disabled>选择供应商</option>
                  <option value="1">华威机械</option>
                  <option value="2">立讯电子</option>
                  <option value="3">悦力材料</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    开始日期 *
                  </label>
                  <input
                    type="date"
                    name="period_start"
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    结束日期 *
                  </label>
                  <input
                    type="date"
                    name="period_end"
                    required
                    className="input-field"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateReconciliation(false)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
