import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ordersAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import dayjs from 'dayjs';

const OrderDetail = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShipModal, setShowShipModal] = useState(false);
  const [trackingNo, setTrackingNo] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await ordersAPI.getById(id);
      setOrder(response.data);
    } catch (error) {
      console.error('Fetch order error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      await ordersAPI.confirm(id);
      fetchOrder();
    } catch (error) {
      alert(error.response?.data?.error || '操作失败');
    }
  };

  const handleShip = async (e) => {
    e.preventDefault();
    try {
      await ordersAPI.ship(id, { tracking_no: trackingNo });
      setShowShipModal(false);
      fetchOrder();
    } catch (error) {
      alert(error.response?.data?.error || '操作失败');
    }
  };

  const handleReceive = async () => {
    try {
      await ordersAPI.receive(id);
      fetchOrder();
    } catch (error) {
      alert(error.response?.data?.error || '操作失败');
    }
  };

  const handleComplete = async () => {
    try {
      await ordersAPI.complete(id);
      fetchOrder();
    } catch (error) {
      alert(error.response?.data?.error || '操作失败');
    }
  };

  const handleCancel = async () => {
    if (!confirm('确定要取消此订单吗？')) return;
    try {
      await ordersAPI.cancel(id);
      fetchOrder();
    } catch (error) {
      alert(error.response?.data?.error || '操作失败');
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

  if (loading) {
    return <div className="text-center py-12 text-gray-500">加载中...</div>;
  }

  if (!order) {
    return <div className="text-center py-12 text-gray-500">订单不存在</div>;
  }

  const isPurchaser = user?.role === 'purchaser' || user?.role === 'admin';
  const isSupplier = user?.role === 'supplier' && order.supplier_id === user.supplierId;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/orders" className="hover:text-apple-blue">订单管理</Link>
        <span>/</span>
        <span>{order.order_no}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">订单信息</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">订单号</div>
                <div className="font-medium">{order.order_no}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">状态</div>
                <div>{getStatusBadge(order.status)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">供应商</div>
                <div className="font-medium">{order.supplier_name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">物料</div>
                <div className="font-medium">{order.material_name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">数量</div>
                <div className="font-medium">{order.quantity}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">单价</div>
                <div className="font-medium">¥{Number(order.unit_price || 0).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">总金额</div>
                <div className="font-medium text-lg text-green-600">
                  ¥{Number(order.total_amount).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">交货日期</div>
                <div className="font-medium">{order.delivery_date || '-'}</div>
              </div>
              {order.tracking_no && (
                <div className="col-span-2">
                  <div className="text-sm text-gray-500">运单号</div>
                  <div className="font-medium">{order.tracking_no}</div>
                </div>
              )}
              {order.notes && (
                <div className="col-span-2">
                  <div className="text-sm text-gray-500">备注</div>
                  <div className="font-medium">{order.notes}</div>
                </div>
              )}
            </div>
          </div>

          {/* Order Timeline */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">订单日志</h3>
            {order.logs && order.logs.length > 0 ? (
              <div className="space-y-4">
                {order.logs.map((log) => (
                  <div key={log.id} className="flex gap-4">
                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium">{log.action}</span>
                        <span className="text-sm text-gray-500">
                          {dayjs(log.created_at).format('MM-DD HH:mm')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {log.old_status && `${log.old_status} → `}{log.new_status}
                        {log.operator_name && ` by ${log.operator_name}`}
                      </div>
                      {log.remark && (
                        <div className="text-sm mt-1">{log.remark}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500">暂无日志</div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">操作</h3>
            <div className="space-y-3">
              {isSupplier && order.status === 'pending' && (
                <button onClick={handleConfirm} className="btn-primary w-full">
                  确认接单
                </button>
              )}
              {isSupplier && order.status === 'confirmed' && (
                <>
                  <button
                    onClick={() => setShowShipModal(true)}
                    className="btn-primary w-full"
                  >
                    发货
                  </button>
                </>
              )}
              {isPurchaser && order.status === 'shipped' && (
                <button onClick={handleReceive} className="btn-primary w-full">
                  确认收货
                </button>
              )}
              {isPurchaser && order.status === 'received' && (
                <button onClick={handleComplete} className="btn-primary w-full">
                  完成订单
                </button>
              )}
              {(isPurchaser || isSupplier) &&
                ['pending', 'confirmed'].includes(order.status) && (
                  <button onClick={handleCancel} className="btn-danger w-full">
                    取消订单
                  </button>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Ship Modal */}
      {showShipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">发货</h3>
            <form onSubmit={handleShip}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  运单号
                </label>
                <input
                  type="text"
                  value={trackingNo}
                  onChange={(e) => setTrackingNo(e.target.value)}
                  className="input-field"
                  placeholder="请输入运单号"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowShipModal(false)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  确认发货
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
