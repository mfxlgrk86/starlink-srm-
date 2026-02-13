import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { aiAPI } from '../../services/api';
import dayjs from 'dayjs';

const AuditHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchHistory();
  }, [pagination.page]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await aiAPI.getAuditHistory({
        page: pagination.page,
        limit: pagination.limit
      });
      setHistory(response.data.data);
      setPagination(prev => ({
        ...prev,
        ...response.data.pagination
      }));
    } catch (error) {
      console.error('Fetch history error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: '草稿',
      sent: '已发送',
      confirmed: '已确认',
      paid: '已付款'
    };
    const colorMap = {
      draft: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-100 text-blue-700',
      confirmed: 'bg-green-100 text-green-700',
      paid: 'bg-purple-100 text-purple-700'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorMap[status] || 'bg-gray-100 text-gray-700'}`}>
        {statusMap[status] || status}
      </span>
    );
  };

  const getAuditStatusBadge = (result) => {
    if (!result) return null;

    const status = result.status;
    if (status === 'pass') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          ✅ 通过
        </span>
      );
    } else if (status === 'warning') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          ⚠️ 警告
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          ❌ 异常
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">AI审计历史</h1>
      </div>

      {/* History List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-4">📋</div>
            <p>暂无审计记录</p>
            <Link to="/finance" className="text-indigo-600 hover:text-indigo-700 mt-2 inline-block">
              去财务协同创建对账单
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">对账单号</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">供应商</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-600">金额</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">状态</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">审计结果</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">审计时间</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{item.reconciliation_no}</td>
                    <td className="px-6 py-4">{item.supplier_name}</td>
                    <td className="px-6 py-4 text-right font-medium text-green-600">
                      ¥{Number(item.total_amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                    <td className="px-6 py-4">{getAuditStatusBadge(item.audit_result)}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {item.created_at ? dayjs(item.created_at).format('YYYY-MM-DD HH:mm') : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        to={`/finance/ai/${item.id}`}
                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        查看详情
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            共 {pagination.total} 条记录，第 {pagination.page} / {pagination.totalPages} 页
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              上一页
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditHistory;
