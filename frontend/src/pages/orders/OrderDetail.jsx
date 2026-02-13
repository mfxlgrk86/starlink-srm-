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

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-500',
      confirmed: 'bg-blue-500',
      shipped: 'bg-purple-500',
      received: 'bg-indigo-500',
      completed: 'bg-green-500',
      cancelled: 'bg-gray-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getActionLabel = (action) => {
    const labels = {
      created: '订单创建',
      confirmed: '订单确认',
      shipped: '已发货',
      received: '已收货',
      completed: '订单完成',
      cancelled: '订单取消'
    };
    return labels[action] || action;
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">加载中...</div>;
  }

  if (!order) {
    return <div className="text-center py-12 text-gray-500">订单不存在</div>;
  }

  const isPurchaser = user?.role === 'purchaser' || user?.role === 'admin';
  const isSupplier = user?.role === 'supplier' && order.supplier_id === user.supplierId;

  // Order status steps
  const statusSteps = [
    { key: 'pending', label: '待确认', icon: '📝' },
    { key: 'confirmed', label: '已确认', icon: '✅' },
    { key: 'shipped', label: '已发货', icon: '🚚' },
    { key: 'received', label: '已收货', icon: '📦' },
    { key: 'completed', label: '已完成', icon: '🎉' }
  ];

  const currentStepIndex = statusSteps.findIndex(s => s.key === order.status);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/orders" className="hover:text-apple-blue">订单管理</Link>
        <span>/</span>
        <span>{order.order_no}</span>
      </div>

      {/* Status Timeline */}
      {order.status !== 'cancelled' && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">订单进度</h3>
          <div className="flex items-center justify-between">
            {statusSteps.map((step, index) => (
              <React.Fragment key={step.key}>
                <div className="flex flex-col items-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-xl
                    ${index <= currentStepIndex ? getStatusColor(step.key) + ' text-white' : 'bg-gray-200 text-gray-400'}
                    transition-all duration-300
                  `}>
                    {step.icon}
                  </div>
                  <span className={`mt-2 text-sm font-medium ${index <= currentStepIndex ? 'text-gray-800' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
                {index < statusSteps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${index < currentStepIndex ? 'bg-indigo-500' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Basic Info Card */}
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

          {/* Material Details Card */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">物料详情</h3>
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                📦
              </div>
              <div className="flex-1">
                <div className="font-medium text-lg">{order.material_name}</div>
                <div className="text-sm text-gray-500 mt-1">物料编码: {order.material_code}</div>
                {order.material_spec && (
                  <div className="text-sm text-gray-500">规格: {order.material_spec}</div>
                )}
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">订单日志</h3>
            {order.logs && order.logs.length > 0 ? (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />

                <div className="space-y-6">
                  {order.logs.map((log, index) => (
                    <div key={log.id} className="relative flex gap-4 pl-8">
                      {/* Timeline dot */}
                      <div className={`
                        absolute left-1.5 w-3 h-3 rounded-full border-2 border-white
                        ${index === 0 ? 'bg-indigo-500' : 'bg-gray-300'}
                      `} />

                      <div className="flex-1 pb-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-800">
                            {getActionLabel(log.action)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {dayjs(log.created_at).format('YYYY-MM-DD HH:mm')}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {log.old_status && (
                            <span>
                              {log.old_status === 'pending' ? '待确认' :
                               log.old_status === 'confirmed' ? '已确认' :
                               log.old_status === 'shipped' ? '已发货' :
                               log.old_status === 'received' ? '已收货' :
                               log.old_status === 'completed' ? '已完成' :
                               log.old_status === 'cancelled' ? '已取消' : log.old_status}
                              {' → '}
                            </span>
                          )}
                          {log.new_status && (
                            <span>
                              {log.new_status === 'pending' ? '待确认' :
                               log.new_status === 'confirmed' ? '已确认' :
                               log.new_status === 'shipped' ? '已发货' :
                               log.new_status === 'received' ? '已收货' :
                               log.new_status === 'completed' ? '已完成' :
                               log.new_status === 'cancelled' ? '已取消' : log.new_status}
                            </span>
                          )}
                          {log.operator_name && (
                            <span className="ml-2">操作人: {log.operator_name}</span>
                          )}
                        </div>
                        {log.remark && (
                          <div className="text-sm mt-1 text-gray-600 bg-gray-50 p-2 rounded">
                            {log.remark}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-gray-500">暂无日志</div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Supplier Info */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">供应商信息</h3>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                {order.supplier_name?.charAt(0)}
              </div>
              <div>
                <div className="font-medium">{order.supplier_name}</div>
                <Link
                  to={`/suppliers/${order.supplier_id}`}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  查看详情 →
                </Link>
              </div>
            </div>
          </div>

          {/* Actions */}
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

          {/* Order Meta */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">订单信息</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">创建人</span>
                <span className="font-medium">{order.created_by_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">创建时间</span>
                <span className="font-medium">
                  {order.created_at ? dayjs(order.created_at).format('YYYY-MM-DD HH:mm') : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">更新时间</span>
                <span className="font-medium">
                  {order.updated_at ? dayjs(order.updated_at).format('YYYY-MM-DD HH:mm') : '-'}
                </span>
              </div>
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
