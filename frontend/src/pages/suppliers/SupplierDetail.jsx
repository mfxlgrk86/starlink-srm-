import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { suppliersAPI } from '../../services/api';

const SupplierDetail = () => {
  const { id } = useParams();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSupplier();
  }, [id]);

  const fetchSupplier = async () => {
    try {
      const response = await suppliersAPI.getById(id);
      setSupplier(response.data);
    } catch (error) {
      console.error('Fetch supplier error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (rating) => {
    try {
      await suppliersAPI.updateRating(id, { rating });
      fetchSupplier();
    } catch (error) {
      alert(error.response?.data?.error || '操作失败');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">加载中...</div>;
  }

  if (!supplier) {
    return <div className="text-center py-12 text-gray-500">供应商不存在</div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/suppliers" className="hover:text-apple-blue">供应商管理</Link>
        <span>/</span>
        <span>{supplier.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">供应商信息</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-500">名称</span>
              <span className="font-medium">{supplier.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">联系人</span>
              <span>{supplier.contact_name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">电话</span>
              <span>{supplier.contact_phone || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">地址</span>
              <span>{supplier.address || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">状态</span>
              <span className={`badge badge-${supplier.status}`}>
                {supplier.status === 'active' ? '启用' : '禁用'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">评分</span>
              <span className="text-yellow-500">★ {supplier.rating}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">订单统计</h3>
          {supplier.orderStats ? (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">总订单</span>
                <span className="font-medium">{supplier.orderStats.total_orders || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">待处理</span>
                <span className="text-yellow-600">{supplier.orderStats.pending || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">已完成</span>
                <span className="text-green-600">{supplier.orderStats.completed || 0}</span>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">暂无统计数据</div>
          )}
        </div>

        <div className="card md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">评分</h3>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRating(star)}
                className={`text-2xl ${star <= supplier.rating ? 'text-yellow-500' : 'text-gray-300'}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierDetail;
