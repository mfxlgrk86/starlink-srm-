import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI, suppliersAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import dayjs from 'dayjs';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalSuppliers: 0,
    activeSuppliers: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, suppliersRes] = await Promise.all([
        ordersAPI.getAll({ limit: 5 }),
        suppliersAPI.getAll({})
      ]);

      const orders = ordersRes.data.data;
      const suppliers = suppliersRes.data.data;

      setStats({
        totalOrders: ordersRes.data.pagination?.total || orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
        totalSuppliers: suppliers.length,
        activeSuppliers: suppliers.filter(s => s.status === 'active').length
      });

      setRecentOrders(orders);
    } catch (error) {
      console.error('Fetch dashboard data error:', error);
    } finally {
      setLoading(false);
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
    return (
      <span className={`badge badge-${status}`}>
        {statusMap[status] || status}
      </span>
    );
  };

  const roleLabels = {
    admin: '管理员',
    purchaser: '采购员',
    supplier: '供应商',
    finance: '财务'
  };

  // Icons
  const PackageIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );

  const ClockIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const CheckIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const BuildingIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome */}
      <div className="bg-white rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-800">
          欢迎回来，{user?.username}
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          今天是 {dayjs().format('YYYY年MM月DD日')}，{roleLabels[user?.role]}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-500 text-sm">总订单</div>
              <div className="text-3xl font-semibold text-gray-800 mt-1">
                {stats.totalOrders}
              </div>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <PackageIcon className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-500 text-sm">待处理</div>
              <div className="text-3xl font-semibold text-amber-600 mt-1">
                {stats.pendingOrders}
              </div>
            </div>
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-500 text-sm">已完成</div>
              <div className="text-3xl font-semibold text-emerald-600 mt-1">
                {stats.completedOrders}
              </div>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckIcon className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-500 text-sm">活跃供应商</div>
              <div className="text-3xl font-semibold text-gray-800 mt-1">
                {stats.activeSuppliers}
              </div>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <BuildingIcon className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          to="/orders"
          className="card hover:shadow-md transition-shadow text-center p-5"
        >
          <div className="w-10 h-10 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
            <PackageIcon className="w-5 h-5 text-gray-600" />
          </div>
          <div className="font-medium text-gray-800">订单管理</div>
        </Link>
        <Link
          to="/suppliers"
          className="card hover:shadow-md transition-shadow text-center p-5"
        >
          <div className="w-10 h-10 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
            <BuildingIcon className="w-5 h-5 text-gray-600" />
          </div>
          <div className="font-medium text-gray-800">供应商</div>
        </Link>
        <Link
          to="/sourcing"
          className="card hover:shadow-md transition-shadow text-center p-5"
        >
          <div className="w-10 h-10 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="font-medium text-gray-800">寻源中心</div>
        </Link>
        <Link
          to="/finance"
          className="card hover:shadow-md transition-shadow text-center p-5"
        >
          <div className="w-10 h-10 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="font-medium text-gray-800">财务协同</div>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex justify-between items-center mb-4 p-5 pb-0">
          <h3 className="text-lg font-semibold text-gray-800">最近订单</h3>
          <Link to="/orders" className="text-gray-600 text-sm hover:text-gray-800 font-medium">
            查看全部 →
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="table-container mx-5 mb-5">
            <table className="table">
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>供应商</th>
                  <th>物料</th>
                  <th>金额</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-gray-800 hover:text-gray-600 font-medium"
                      >
                        {order.order_no}
                      </Link>
                    </td>
                    <td className="text-gray-600">{order.supplier_name}</td>
                    <td className="text-gray-600">{order.material_name}</td>
                    <td className="font-medium">¥{Number(order.total_amount).toLocaleString()}</td>
                    <td>{getStatusBadge(order.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            暂无订单数据
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
