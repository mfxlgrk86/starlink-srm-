import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { ordersAPI } from '../../services/api';
import dayjs from 'dayjs';

const MobileOrders = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get('status') || 'all');

  useEffect(() => {
    const status = searchParams.get('status');
    if (status) {
      setFilter(status);
    }
    fetchOrders(status || null);
  }, [searchParams]);

  const fetchOrders = async (status) => {
    try {
      const params = status && status !== 'all' ? { status } : {};
      const response = await ordersAPI.getMy ? ordersAPI.getMy(params) : ordersAPI.getAll(params);
      setOrders(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (orderId) => {
    try {
      await ordersAPI.confirm(orderId);
      fetchOrders(filter);
    } catch (error) {
      alert('确认失败: ' + (error.response?.data?.error || '未知错误'));
    }
  };

  const handleShip = async (orderId, trackingNo) => {
    try {
      await ordersAPI.ship(orderId, { tracking_no: trackingNo });
      fetchOrders(filter);
    } catch (error) {
      alert('发货失败: ' + (error.response?.data?.error || '未知错误'));
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { bg: 'bg-amber-50 text-amber-600', text: '待确认' },
      confirmed: { bg: 'bg-blue-50 text-blue-600', text: '已确认' },
      shipped: { bg: 'bg-purple-50 text-purple-600', text: '已发货' },
      received: { bg: 'bg-emerald-50 text-emerald-600', text: '已收货' },
      completed: { bg: 'bg-gray-50 text-gray-600', text: '已完成' },
      cancelled: { bg: 'bg-red-50 text-red-600', text: '已取消' },
    };
    return statusMap[status] || { bg: 'bg-gray-50 text-gray-600', text: status };
  };

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待确认' },
    { key: 'confirmed', label: '待发货' },
    { key: 'shipped', label: '已发货' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl p-4">
        <h1 className="text-xl font-medium text-gray-800 mb-4">订单管理</h1>

        {/* Tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                filter === tab.key
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-50 text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Order List */}
      {loading ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400">
          加载中...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400">
          暂无订单
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => {
            const status = getStatusBadge(order.status);
            return (
              <div key={order.id} className="bg-white rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{order.order_no}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${status.bg}`}>
                      {status.text}
                    </span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {dayjs(order.created_at).format('MM-DD HH:mm')}
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">物料</span>
                    <span className="text-gray-800">{order.material_name || order.material_id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">数量</span>
                    <span className="text-gray-800">{order.quantity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">金额</span>
                    <span className="text-gray-800 font-medium">¥{order.total_amount}</span>
                  </div>
                  {order.delivery_date && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">交货日期</span>
                      <span className="text-gray-800">
                        {dayjs(order.delivery_date).format('YYYY-MM-DD')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="px-4 pb-4 flex space-x-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleConfirm(order.id)}
                      className="flex-1 bg-gray-800 text-white py-2.5 rounded-lg text-sm font-medium"
                    >
                      确认接单
                    </button>
                  )}
                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => {
                        const trackingNo = prompt('请输入物流单号（可选）:');
                        handleShip(order.id, trackingNo || '');
                      }}
                      className="flex-1 bg-gray-800 text-white py-2.5 rounded-lg text-sm font-medium"
                    >
                      发货
                    </button>
                  )}
                  {order.status === 'shipped' && (
                    <div className="flex-1 bg-gray-100 text-gray-500 py-2.5 rounded-lg text-sm font-medium text-center">
                      等待收货
                    </div>
                  )}
                  <button
                    onClick={() => navigate(`/mobile/orders/${order.id}`)}
                    className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600"
                  >
                    详情
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MobileOrders;
