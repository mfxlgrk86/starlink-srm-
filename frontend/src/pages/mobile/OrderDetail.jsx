import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersAPI } from '../../services/api';
import dayjs from 'dayjs';

const MobileOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await ordersAPI.getById(id);
      setOrder(response.data?.data || response.data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      await ordersAPI.confirm(id);
      navigate('/mobile/orders');
    } catch (error) {
      alert('确认失败: ' + (error.response?.data?.error || '未知错误'));
    }
  };

  const handleShip = async () => {
    const trackingNo = prompt('请输入物流单号（可选）:');
    try {
      await ordersAPI.ship(id, { tracking_no: trackingNo || '' });
      navigate('/mobile/orders');
    } catch (error) {
      alert('发货失败: ' + (error.response?.data?.error || '未知错误'));
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { bg: 'bg-yellow-100', text: '待确认' },
      confirmed: { bg: 'bg-blue-100', text: '已确认' },
      shipped: { bg: 'bg-purple-100', text: '已发货' },
      received: { bg: 'bg-green-100', text: '已收货' },
    };
    return statusMap[status] || { bg: 'bg-gray-100', text: status };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-8 text-center text-gray-400">
        加载中...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white rounded-xl p-8 text-center text-gray-400">
        订单不存在
      </div>
    );
  }

  const status = getStatusBadge(order.status);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center space-x-3 mb-4">
          <button
            onClick={() => navigate('/mobile/orders')}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">订单详情</h1>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xl font-medium">{order.order_no}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs ${status.bg}`}>
            {status.text}
          </span>
        </div>
      </div>

      {/* Order Info */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <h2 className="font-semibold text-gray-800">订单信息</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">创建时间</span>
            <p className="text-gray-800">{dayjs(order.created_at).format('YYYY-MM-DD HH:mm')}</p>
          </div>
          <div>
            <span className="text-gray-500">交货日期</span>
            <p className="text-gray-800">
              {order.delivery_date ? dayjs(order.delivery_date).format('YYYY-MM-DD') : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Material Info */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <h2 className="font-semibold text-gray-800">物料信息</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">物料名称</span>
            <span className="text-gray-800">{order.material_name || order.material_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">数量</span>
            <span className="text-gray-800">{order.quantity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">单价</span>
            <span className="text-gray-800">¥{order.unit_price}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span className="text-gray-500">总价</span>
            <span className="text-gray-800">¥{order.total_amount}</span>
          </div>
        </div>
      </div>

      {/* Tracking */}
      {order.tracking_no && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-800 mb-2">物流信息</h2>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">物流单号</span>
            <span className="text-gray-800 font-mono">{order.tracking_no}</span>
          </div>
        </div>
      )}

      {/* Notes */}
      {order.notes && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-800 mb-2">备注</h2>
          <p className="text-sm text-gray-600">{order.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="pb-6">
        {order.status === 'pending' && (
          <button
            onClick={handleConfirm}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700"
          >
            确认接单
          </button>
        )}
        {order.status === 'confirmed' && (
          <button
            onClick={handleShip}
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium hover:bg-purple-700"
          >
            发货
          </button>
        )}
        {order.status === 'shipped' && (
          <div className="w-full bg-gray-100 text-gray-500 py-3 rounded-xl font-medium text-center">
            等待采购方收货
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileOrderDetail;
