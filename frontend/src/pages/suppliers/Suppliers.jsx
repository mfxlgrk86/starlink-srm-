import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { suppliersAPI } from '../../services/api';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });

  useEffect(() => {
    fetchSuppliers();
  }, [filters]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;

      const response = await suppliersAPI.getAll(params);
      setSuppliers(response.data.data);
    } catch (error) {
      console.error('Fetch suppliers error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      contact_name: formData.get('contact_name') || undefined,
      contact_phone: formData.get('contact_phone') || undefined,
      address: formData.get('address') || undefined
    };

    try {
      await suppliersAPI.create(data);
      setShowCreateModal(false);
      fetchSuppliers();
    } catch (error) {
      alert(error.response?.data?.error || '创建失败');
    }
  };

  const handleBlock = async (id) => {
    if (!confirm('确定要禁用此供应商吗？')) return;
    try {
      await suppliersAPI.block(id);
      fetchSuppliers();
    } catch (error) {
      alert(error.response?.data?.error || '操作失败');
    }
  };

  const handleActivate = async (id) => {
    try {
      await suppliersAPI.activate(id);
      fetchSuppliers();
    } catch (error) {
      alert(error.response?.data?.error || '操作失败');
    }
  };

  const getStatusBadge = (status) => {
    return (
      <span className={`badge badge-${status}`}>
        {status === 'active' ? '启用' : status === 'blocked' ? '禁用' : '待审核'}
      </span>
    );
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-xl font-semibold">供应商管理</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          + 添加供应商
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="搜索供应商名称..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="input-field md:w-64"
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="input-field md:w-40"
          >
            <option value="">全部状态</option>
            <option value="active">启用</option>
            <option value="blocked">禁用</option>
          </select>
        </div>
      </div>

      {/* Suppliers Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : suppliers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="card hover:shadow-apple-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <Link
                  to={`/suppliers/${supplier.id}`}
                  className="text-lg font-medium text-apple-blue hover:underline"
                >
                  {supplier.name}
                </Link>
                {getStatusBadge(supplier.status)}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">联系人</span>
                  <span>{supplier.contact_name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">电话</span>
                  <span>{supplier.contact_phone || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">评分</span>
                  <span className="text-yellow-500">★ {supplier.rating}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Link
                  to={`/suppliers/${supplier.id}`}
                  className="btn-secondary flex-1 text-center text-sm"
                >
                  详情
                </Link>
                {supplier.status === 'active' ? (
                  <button
                    onClick={() => handleBlock(supplier.id)}
                    className="btn-danger flex-1 text-sm"
                  >
                    禁用
                  </button>
                ) : (
                  <button
                    onClick={() => handleActivate(supplier.id)}
                    className="btn-primary flex-1 text-sm"
                  >
                    启用
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12 text-gray-500">
          暂无供应商数据
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">添加供应商</h3>
            </div>
            <form onSubmit={handleCreateSupplier} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  供应商名称 *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="input-field"
                  placeholder="请输入供应商名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  联系人
                </label>
                <input
                  type="text"
                  name="contact_name"
                  className="input-field"
                  placeholder="请输入联系人姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  联系电话
                </label>
                <input
                  type="text"
                  name="contact_phone"
                  className="input-field"
                  placeholder="请输入联系电话"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  地址
                </label>
                <textarea
                  name="address"
                  rows={2}
                  className="input-field"
                  placeholder="请输入供应商地址"
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

export default Suppliers;
