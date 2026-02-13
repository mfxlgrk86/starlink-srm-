import React, { useState, useEffect } from 'react';
import { inquiriesAPI, quotationsAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const Sourcing = () => {
  const { user } = useAuthStore();
  const [inquiries, setInquiries] = useState([]);
  const [activeTab, setActiveTab] = useState('inquiries');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await inquiriesAPI.getAll({});
      setInquiries(response.data.data);
    } catch (error) {
      console.error('Fetch inquiries error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInquiry = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      deadline: formData.get('deadline') || undefined
    };

    try {
      await inquiriesAPI.create(data);
      setShowCreateModal(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || '创建失败');
    }
  };

  const handlePublish = async (id) => {
    try {
      await inquiriesAPI.publish(id);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || '发布失败');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: '草稿',
      published: '已发布',
      closed: '已关闭'
    };
    return <span className={`badge ${status === 'published' ? 'badge-confirmed' : status === 'closed' ? 'badge-cancelled' : 'badge-pending'}`}>{statusMap[status] || status}</span>;
  };

  const isPurchaser = user?.role === 'purchaser' || user?.role === 'admin';

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-xl font-semibold">寻源中心</h2>
        {isPurchaser && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            + 发布询价
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('inquiries')}
          className={`px-4 py-2 font-medium ${activeTab === 'inquiries' ? 'border-b-2 border-apple-blue text-apple-blue' : 'text-gray-500'}`}
        >
          询价管理
        </button>
        <button
          onClick={() => setActiveTab('quotations')}
          className={`px-4 py-2 font-medium ${activeTab === 'quotations' ? 'border-b-2 border-apple-blue text-apple-blue' : 'text-gray-500'}`}
        >
          报价管理
        </button>
      </div>

      {/* Inquiries */}
      {activeTab === 'inquiries' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500">加载中...</div>
          ) : inquiries.length > 0 ? (
            inquiries.map((inquiry) => (
              <div key={inquiry.id} className="card">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium">{inquiry.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{inquiry.description}</p>
                  </div>
                  {getStatusBadge(inquiry.status)}
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">
                    截止日期: {inquiry.deadline || '未设置'}
                  </span>
                  {isPurchaser && inquiry.status === 'draft' && (
                    <button
                      onClick={() => handlePublish(inquiry.id)}
                      className="btn-primary text-sm"
                    >
                      发布
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="card text-center py-12 text-gray-500">
              暂无询价数据
            </div>
          )}
        </div>
      )}

      {/* Quotations */}
      {activeTab === 'quotations' && (
        <div className="card text-center py-12 text-gray-500">
          报价管理功能开发中...
        </div>
      )}

      {/* Create Inquiry Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">发布询价</h3>
            </div>
            <form onSubmit={handleCreateInquiry} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  询价标题 *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  className="input-field"
                  placeholder="请输入询价标题"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  详细描述
                </label>
                <textarea
                  name="description"
                  rows={4}
                  className="input-field"
                  placeholder="请输入详细的采购需求"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  截止日期
                </label>
                <input
                  type="date"
                  name="deadline"
                  className="input-field"
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

export default Sourcing;
