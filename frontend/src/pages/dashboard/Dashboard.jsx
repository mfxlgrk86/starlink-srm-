import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI, suppliersAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
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
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-semibold mb-2">
          欢迎回来，{user?.username}
        </h2>
        <p className="text-blue-100">
          今天是 {dayjs().format('YYYY年MM月DD日')}，{roleLabels[user?.role]}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-gray-500 text-sm">总订单</div>
          <div className="text-3xl font-semibold text-apple-dark mt-1">
            {stats.totalOrders}
          </div>
        </div>
        <div className="card">
          <div className="text-gray-500 text-sm">待处理</div>
          <div className="text-3xl font-semibold text-yellow-600 mt-1">
            {stats.pendingOrders}
          </div>
        </div>
        <div className="card">
          <div className="text-gray-500 text-sm">已完成</div>
          <div className="text-3xl font-semibold text-green-600 mt-1">
            {stats.completedOrders}
          </div>
        </div>
        <div className="card">
          <div className="text-gray-500 text-sm">活跃供应商</div>
          <div className="text-3xl font-semibold text-blue-600 mt-1">
            {stats.activeSuppliers}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          to="/orders"
          className="card hover:shadow-apple-lg transition-shadow text-center"
        >
          <div className="text-3xl mb-2">📦</div>
          <div className="font-medium">订单管理</div>
        </Link>
        <Link
          to="/suppliers"
          className="card hover:shadow-apple-lg transition-shadow text-center"
        >
          <div className="text-3xl mb-2">🏭</div>
          <div className="font-medium">供应商</div>
        </Link>
        <Link
          to="/sourcing"
          className="card hover:shadow-apple-lg transition-shadow text-center"
        >
          <div className="text-3xl mb-2">🔍</div>
          <div className="font-medium">寻源中心</div>
        </Link>
        <Link
          to="/finance"
          className="card hover:shadow-apple-lg transition-shadow text-center"
        >
          <div className="text-3xl mb-2">💰</div>
          <div className="font-medium">财务协同</div>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">最近订单</h3>
          <Link to="/orders" className="text-apple-blue text-sm hover:underline">
            查看全部
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="table-container">
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
                        className="text-apple-blue hover:underline"
                      >
                        {order.order_no}
                      </Link>
                    </td>
                    <td>{order.supplier_name}</td>
                    <td>{order.material_name}</td>
                    <td>¥{Number(order.total_amount).toLocaleString()}</td>
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
