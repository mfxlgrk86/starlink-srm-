import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { ordersAPI } from '../../services/api';
import dayjs from 'dayjs';

const MobileDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingOrders: 0,
    shippedOrders: 0,
    invoicesPending: 0,
    reconciliationsPending: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const ordersRes = await ordersAPI.getAll({ status: 'pending', limit: 5 });
      const orders = ordersRes.data?.data || [];
      const shippedRes = await ordersAPI.getAll({ status: 'shipped', limit: 5 });
      const shippedOrders = shippedRes.data?.data || [];

      setRecentOrders([...orders, ...shippedOrders].slice(0, 5));
      setStats({
        pendingOrders: orders.length,
        shippedOrders: shippedOrders.length,
        invoicesPending: 2,
        reconciliationsPending: 1,
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { bg: 'bg-amber-50 text-amber-600', text: '待确认' },
      confirmed: { bg: 'bg-blue-50 text-blue-600', text: '已确认' },
      shipped: { bg: 'bg-purple-50 text-purple-600', text: '已发货' },
      received: { bg: 'bg-emerald-50 text-emerald-600', text: '已收货' },
    };
    return statusMap[status] || { bg: 'bg-gray-50 text-gray-600', text: status };
  };

  return (
    <div className="space-y-4">
      {/* Welcome */}
      <div className="bg-white rounded-xl p-4">
        <h1 className="text-xl font-medium text-gray-800 mb-1">早上好，{user?.username}</h1>
        <p className="text-sm text-gray-400">供应商移动端</p>
      </div>

      {/* Quick Stats - Clean Cards */}
      <div className="grid grid-cols-4 gap-2">
        <div
          onClick={() => navigate('/mobile/orders?status=pending')}
          className="bg-white rounded-xl p-3 text-center cursor-pointer"
        >
          <div className="w-10 h-10 mx-auto mb-2 bg-amber-50 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div className="text-lg font-semibold text-gray-800">{stats.pendingOrders}</div>
          <div className="text-xs text-gray-400">待确认</div>
        </div>
        <div
          onClick={() => navigate('/mobile/orders?status=shipped')}
          className="bg-white rounded-xl p-3 text-center cursor-pointer"
        >
          <div className="w-10 h-10 mx-auto mb-2 bg-purple-50 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div className="text-lg font-semibold text-gray-800">{stats.shippedOrders}</div>
          <div className="text-xs text-gray-400">待发货</div>
        </div>
        <div
          onClick={() => navigate('/mobile/invoices?status=pending')}
          className="bg-white rounded-xl p-3 text-center cursor-pointer"
        >
          <div className="w-10 h-10 mx-auto mb-2 bg-orange-50 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="text-lg font-semibold text-gray-800">{stats.invoicesPending}</div>
          <div className="text-xs text-gray-400">待上传</div>
        </div>
        <div
          onClick={() => navigate('/mobile/reconciliations?status=pending')}
          className="bg-white rounded-xl p-3 text-center cursor-pointer"
        >
          <div className="w-10 h-10 mx-auto mb-2 bg-emerald-50 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-lg font-semibold text-gray-800">{stats.reconciliationsPending}</div>
          <div className="text-xs text-gray-400">待确认</div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b flex justify-between items-center">
          <h2 className="font-medium text-gray-800">最新订单</h2>
          <button
            onClick={() => navigate('/mobile/orders')}
            className="text-sm text-gray-400"
          >
            查看全部 →
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">加载中...</div>
        ) : recentOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-400">暂无订单</div>
        ) : (
          <div className="divide-y">
            {recentOrders.map((order) => {
              const status = getStatusBadge(order.status);
              return (
                <div
                  key={order.id}
                  onClick={() => navigate(`/mobile/orders/${order.id}`)}
                  className="p-4 cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{order.order_no}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${status.bg}`}>
                        {status.text}
                      </span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {dayjs(order.created_at).format('MM-DD')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {order.material_name} · {order.quantity}件
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-4">
        <h2 className="font-medium text-gray-800 mb-3">快捷操作</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/mobile/orders?action=ship')}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <span className="text-sm text-gray-700">发货</span>
          </button>
          <button
            onClick={() => navigate('/mobile/invoices?action=upload')}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
          >
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-sm text-gray-700">上传发票</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileDashboard;
