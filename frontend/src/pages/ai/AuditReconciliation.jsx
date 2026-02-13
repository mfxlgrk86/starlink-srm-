import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { aiAPI, reconciliationsAPI } from '../../services/api';

const AuditReconciliation = () => {
  const { id } = useParams();
  const [reconciliation, setReconciliation] = useState(null);
  const [auditResult, setAuditResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchReconciliation();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchReconciliation = async () => {
    try {
      const response = await reconciliationsAPI.getById(id);
      setReconciliation(response.data);

      // If there's already an audit result, parse it
      if (response.data.ai_audit_result) {
        try {
          setAuditResult(JSON.parse(response.data.ai_audit_result));
        } catch (e) {
          console.error('Failed to parse audit result:', e);
        }
      }
    } catch (error) {
      console.error('Fetch reconciliation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAudit = async () => {
    setAuditing(true);
    try {
      const response = await aiAPI.auditReconciliation({ reconciliation_id: id });
      setAuditResult(response.data);

      // Save audit result to reconciliation
      await reconciliationsAPI.update(id, { ai_audit_result: JSON.stringify(response.data) });
    } catch (error) {
      console.error('Audit error:', error);
      alert(error.response?.data?.error || 'AI审计失败');
    } finally {
      setAuditing(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('确定要通过此对账单吗？')) return;
    setActionLoading(true);
    try {
      await aiAPI.approveReconciliation({ reconciliation_id: id });
      fetchReconciliation();
      alert('审批通过');
    } catch (error) {
      console.error('Approve error:', error);
      alert(error.response?.data?.error || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('请输入驳回原因:');
    if (!reason) return;
    setActionLoading(true);
    try {
      await aiAPI.rejectReconciliation({ reconciliation_id: id, reason });
      fetchReconciliation();
      alert('已驳回');
    } catch (error) {
      console.error('Reject error:', error);
      alert(error.response?.data?.error || '操作失败');
    } finally {
      setActionLoading(false);
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
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorMap[status] || 'bg-gray-100 text-gray-700'}`}>
        {statusMap[status] || status}
      </span>
    );
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/finance" className="hover:text-apple-blue">财务协同</Link>
        <span>/</span>
        {reconciliation ? (
          <span>{reconciliation.reconciliation_no}</span>
        ) : (
          <span>AI审计</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Reconciliation Info */}
          {reconciliation && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">对账单信息</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">对账单号</div>
                  <div className="font-medium">{reconciliation.reconciliation_no}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">状态</div>
                  <div>{getStatusBadge(reconciliation.status)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">供应商</div>
                  <div className="font-medium">{reconciliation.supplier_name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">期间</div>
                  <div className="font-medium">
                    {reconciliation.period_start} ~ {reconciliation.period_end}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-gray-500">总金额</div>
                  <div className="text-2xl font-bold text-green-600">
                    ¥{Number(reconciliation.total_amount).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Audit Result */}
          {auditResult ? (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">AI审计结果</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  auditResult.status === 'pass' ? 'bg-green-100 text-green-700' :
                  auditResult.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {auditResult.status === 'pass' ? '✅ 通过' :
                   auditResult.status === 'warning' ? '⚠️ 警告' : '❌ 异常'}
                </span>
              </div>

              {/* Audit Details */}
              {auditResult.audit_details && (
                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-500">订单数量</div>
                    <div className="text-xl font-semibold">{auditResult.audit_details.order_count}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">订单金额</div>
                    <div className="text-xl font-semibold text-green-600">
                      ¥{Number(auditResult.audit_details.total_order_amount).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">发票数量</div>
                    <div className="text-xl font-semibold">{auditResult.audit_details.invoice_count}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">发票金额</div>
                    <div className="text-xl font-semibold text-green-600">
                      ¥{Number(auditResult.audit_details.total_invoice_amount).toLocaleString()}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-gray-500">差异金额</div>
                    <div className={`text-xl font-semibold ${
                      auditResult.audit_details.difference === 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ¥{Number(auditResult.audit_details.difference).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">审计摘要</h4>
                <p className="text-gray-600">{auditResult.summary}</p>
              </div>

              {/* Issues */}
              {auditResult.issues && auditResult.issues.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">发现的问题</h4>
                  <ul className="space-y-2">
                    {auditResult.issues.map((issue, index) => (
                      <li key={index} className="flex items-start space-x-2 text-red-600">
                        <span>❌</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {auditResult.suggestions && auditResult.suggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">建议</h4>
                  <ul className="space-y-2">
                    {auditResult.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start space-x-2 text-gray-600">
                        <span>💡</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="card p-12 text-center">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold mb-2">AI智能审计</h3>
              <p className="text-gray-500 mb-6">
                点击下方按钮开始AI审计，智能分析对账单数据，检测异常和风险
              </p>
              <button
                onClick={handleAudit}
                disabled={auditing || !id}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {auditing ? '审计中...' : '开始AI审计'}
              </button>
            </div>
          )}

          {/* Related Orders */}
          {reconciliation?.orders && reconciliation.orders.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">关联订单</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">订单号</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">物料</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600">数量</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600">金额</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reconciliation.orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{order.order_no}</td>
                        <td className="px-4 py-3">{order.material_name}</td>
                        <td className="px-4 py-3 text-right">{order.quantity}</td>
                        <td className="px-4 py-3 text-right">¥{Number(order.total_amount).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`badge badge-${order.status}`}>
                            {order.status === 'completed' ? '已完成' :
                             order.status === 'received' ? '已收货' :
                             order.status === 'shipped' ? '已发货' :
                             order.status === 'confirmed' ? '已确认' : '待确认'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">操作</h3>
            <div className="space-y-3">
              {auditResult && (
                <>
                  <button
                    onClick={handleAudit}
                    disabled={auditing}
                    className="w-full bg-indigo-100 text-indigo-700 py-2.5 rounded-lg font-medium hover:bg-indigo-200 transition-colors disabled:opacity-50"
                  >
                    重新审计
                  </button>
                  {reconciliation.status === 'sent' && (
                    <>
                      <button
                        onClick={handleApprove}
                        disabled={actionLoading}
                        className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {actionLoading ? '处理中...' : '审批通过'}
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={actionLoading}
                        className="w-full bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {actionLoading ? '处理中...' : '驳回'}
                      </button>
                    </>
                  )}
                </>
              )}
              {!auditResult && id && (
                <button
                  onClick={handleAudit}
                  disabled={auditing}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2.5 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 transition-all disabled:opacity-50"
                >
                  {auditing ? '审计中...' : '开始AI审计'}
                </button>
              )}
            </div>
          </div>

          {/* Risk Indicators */}
          {auditResult && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">风险指标</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">数据一致性</span>
                  <span className={`font-medium ${
                    auditResult.audit_details?.difference === 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {auditResult.audit_details?.difference === 0 ? '✅ 一致' : '⚠️ 不一致'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">发票完整性</span>
                  <span className="font-medium text-green-600">✅ 完整</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">金额匹配</span>
                  <span className={`font-medium ${
                    auditResult.audit_details?.difference === 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {auditResult.audit_details?.difference === 0 ? '✅ 匹配' : '⚠️ 不匹配'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditReconciliation;
