import React, { useState, useEffect } from 'react';
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

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-xl font-semibold">财务协同</h2>
        {isFinance && (
          <button
            onClick={() => setShowCreateReconciliation(true)}
            className="btn-primary"
          >
            + 创建对账单
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('reconciliations')}
          className={`px-4 py-2 font-medium ${activeTab === 'reconciliations' ? 'border-b-2 border-apple-blue text-apple-blue' : 'text-gray-500'}`}
        >
          对账管理
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 font-medium ${activeTab === 'invoices' ? 'border-b-2 border-apple-blue text-apple-blue' : 'text-gray-500'}`}
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
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium">{recon.reconciliation_no}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      供应商: {recon.supplier_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      期间: {recon.period_start} ~ {recon.period_end}
                    </p>
                    <p className="text-lg font-semibold text-green-600 mt-2">
                      ¥{Number(recon.total_amount).toLocaleString()}
                    </p>
                  </div>
                  {getReconciliationStatusBadge(recon.status)}
                </div>
                {isFinance && recon.status === 'draft' && (
                  <button
                    onClick={() => handleSend(recon.id)}
                    className="btn-primary text-sm mt-2"
                  >
                    发送给供应商
                  </button>
                )}
                {isSupplier && recon.status === 'sent' && (
                  <button
                    onClick={() => handleSend(recon.id)}
                    className="btn-primary text-sm mt-2"
                  >
                    确认对账单
                  </button>
                )}
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
                      <td className="font-medium">{invoice.invoice_no}</td>
                      <td>{invoice.supplier_name}</td>
                      <td>¥{Number(invoice.amount).toLocaleString()}</td>
                      <td>¥{Number(invoice.tax_amount || 0).toLocaleString()}</td>
                      <td>{getInvoiceStatusBadge(invoice.status)}</td>
                      <td>
                        {isFinance && invoice.status === 'pending' && (
                          <button
                            onClick={() => handleVerify(invoice.id)}
                            className="text-apple-blue hover:underline"
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

      {/* Create Reconciliation Modal */}
      {showCreateReconciliation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">创建对账单</h3>
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
