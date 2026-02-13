import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reconciliationsAPI } from '../../services/api';
import dayjs from 'dayjs';

const MobileReconciliations = () => {
  const navigate = useNavigate();
  const [reconciliations, setReconciliations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReconciliations();
  }, []);

  const fetchReconciliations = async () => {
    try {
      const response = await reconciliationsAPI.getAll
        ? reconciliationsAPI.getAll({})
        : { data: { data: [] } };
      setReconciliations(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch reconciliations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id) => {
    try {
      await reconciliationsAPI.confirm(id);
      fetchReconciliations();
    } catch (error) {
      alert('确认失败: ' + (error.response?.data?.error || '未知错误'));
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { bg: 'bg-gray-50 text-gray-600', text: '草稿' },
      sent: { bg: 'bg-amber-50 text-amber-600', text: '待确认' },
      confirmed: { bg: 'bg-emerald-50 text-emerald-600', text: '已确认' },
      paid: { bg: 'bg-blue-50 text-blue-600', text: '已付款' },
    };
    return statusMap[status] || { bg: 'bg-gray-50 text-gray-600', text: status };
  };

  const filterByStatus = (status) => {
    if (status === 'pending') {
      return reconciliations.filter((r) => ['draft', 'sent'].includes(r.status));
    }
    if (status === 'confirmed') {
      return reconciliations.filter((r) => ['confirmed', 'paid'].includes(r.status));
    }
    return reconciliations;
  };

  const [filter, setFilter] = useState('pending');

  const tabs = [
    { key: 'pending', label: '待确认' },
    { key: 'confirmed', label: '已确认' },
    { key: 'all', label: '全部' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl p-4">
        <h1 className="text-xl font-medium text-gray-800 mb-4">对账单</h1>

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

      {/* Reconciliation List */}
      {loading ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400">
          加载中...
        </div>
      ) : filterByStatus(filter).length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>暂无对账单</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filterByStatus(filter).map((rec) => {
            const status = getStatusBadge(rec.status);
            return (
              <div
                key={rec.id}
                className="bg-white rounded-xl overflow-hidden"
              >
                <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">
                      {rec.reconciliation_no}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${status.bg}`}>
                      {status.text}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-800">
                    ¥{rec.total_amount}
                  </span>
                </div>

                <div className="p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">对账期间</span>
                    <span className="text-gray-800">
                      {dayjs(rec.period_start).format('YYYY-MM-DD')} ~{' '}
                      {dayjs(rec.period_end).format('YYYY-MM-DD')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">创建时间</span>
                    <span className="text-gray-800">
                      {dayjs(rec.created_at).format('YYYY-MM-DD')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {rec.status === 'sent' && (
                  <div className="px-4 pb-4 flex space-x-2">
                    <button
                      onClick={() => handleConfirm(rec.id)}
                      className="flex-1 bg-gray-800 text-white py-2.5 rounded-lg text-sm font-medium"
                    >
                      确认对账单
                    </button>
                  </div>
                )}

                {rec.status === 'paid' && (
                  <div className="px-4 pb-4">
                    <div className="w-full bg-gray-50 text-gray-500 py-2.5 rounded-lg text-sm font-medium text-center">
                      已付款
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MobileReconciliations;
