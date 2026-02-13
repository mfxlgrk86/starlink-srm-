import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI, suppliersAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const Orders = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    supplier_id: '',
    search: ''
  });

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.supplier_id) params.supplier_id = filters.supplier_id;
      if (filters.search) params.search = filters.search;

      const response = await ordersAPI.getAll(params);
      setOrders(response.data.data);
    } catch (error) {
      console.error('Fetch orders error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await suppliersAPI.getAll({ status: 'active' });
      setSuppliers(response.data.data);
    } catch (error) {
      console.error('Fetch suppliers error:', error);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      supplier_id: parseInt(formData.get('supplier_id')),
      material_id: parseInt(formData.get('material_id')),
      quantity: parseFloat(formData.get('quantity')),
      unit_price: parseFloat(formData.get('unit_price')) || undefined,
      delivery_date: formData.get('delivery_date') || undefined,
      notes: formData.get('notes') || undefined
    };

    try {
      await ordersAPI.create(data);
      setShowCreateModal(false);
      fetchOrders();
    } catch (error) {
      alert(error.response?.data?.error || '创建失败');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: '待确认',
      confirmed: '已确认',
      shipped: '已发货',
      received: '已收货',
      completed: '已完成',
      cancelled: '已取消'
    };
    return <span className={`badge badge-${status}`}>{statusMap[status] || status}</span>;
  };

  const isPurchaser = user?.role === 'purchaser' || user?.role === 'admin';

  // Search Icon
  const SearchIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">订单管理</h2>
          <p className="text-sm text-gray-500 mt-1">管理所有采购订单</p>
        </div>
        {isPurchaser && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            创建订单
          </button>
        )}
      </div>

      {/* Filters - Card Style */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 md:w-64">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索订单号/供应商/物料..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all cursor-pointer"
          >
            <option value="">全部状态</option>
            <option value="pending">待确认</option>
            <option value="confirmed">已确认</option>
            <option value="shipped">已发货</option>
            <option value="received">已收货</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
          <select
            value={filters.supplier_id}
            onChange={(e) => setFilters({ ...filters, supplier_id: e.target.value })}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all cursor-pointer"
          >
            <option value="">全部供应商</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : orders.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>供应商</th>
                  <th>物料</th>
                  <th>数量</th>
                  <th>金额</th>
                  <th>交货日期</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        {order.order_no}
                      </Link>
                    </td>
                    <td className="text-gray-600">{order.supplier_name}</td>
                    <td className="text-gray-600">{order.material_name}</td>
                    <td className="text-gray-600">{order.quantity}</td>
                    <td className="font-medium">¥{Number(order.total_amount).toLocaleString()}</td>
                    <td className="text-gray-600">{order.delivery_date || '-'}</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                      >
                        查看
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            暂无订单数据
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">创建订单</h3>
                <p className="text-sm text-gray-500 mt-1">填写订单信息</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateOrder} className="p-6 space-y-4">
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
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  物料 *
                </label>
                <select
                  name="material_id"
                  required
                  className="input-field"
                  defaultValue=""
                >
                  <option value="" disabled>选择物料</option>
                  <option value="1">精密轴承</option>
                  <option value="2">电机</option>
                  <option value="3">电缆</option>
                  <option value="4">不锈钢板</option>
                  <option value="5">紧固件套装</option>
                  <option value="6">控制器</option>
                  <option value="7">导轨</option>
                  <option value="8">传感器</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    数量 *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    required
                    min="0.01"
                    step="0.01"
                    className="input-field"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    单价
                  </label>
                  <input
                    type="number"
                    name="unit_price"
                    min="0"
                    step="0.01"
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  交货日期
                </label>
                <input
                  type="date"
                  name="delivery_date"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  className="input-field resize-none"
                  placeholder="可选备注信息"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  创建订单
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
