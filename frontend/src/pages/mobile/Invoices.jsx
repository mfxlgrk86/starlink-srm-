import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { invoicesAPI } from '../../services/api';
import dayjs from 'dayjs';

const MobileInvoices = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(searchParams.get('action') === 'upload');
  const [uploadData, setUploadData] = useState({
    invoice_no: '',
    invoice_date: dayjs().format('YYYY-MM-DD'),
    amount: '',
    tax_amount: '',
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await invoicesAPI.getAll ? invoicesAPI.getAll({}) : { data: { data: [] } };
      setInvoices(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadData.invoice_no || !uploadData.amount) {
      alert('请填写发票号码和金额');
      return;
    }

    setUploading(true);
    try {
      await invoicesAPI.create({
        invoice_no: uploadData.invoice_no,
        invoice_date: uploadData.invoice_date,
        amount: parseFloat(uploadData.amount),
        tax_amount: parseFloat(uploadData.tax_amount) || 0,
      });
      alert('发票上传成功');
      setShowUpload(false);
      setUploadData({
        invoice_no: '',
        invoice_date: dayjs().format('YYYY-MM-DD'),
        amount: '',
        tax_amount: '',
      });
      fetchInvoices();
    } catch (error) {
      alert('上传失败: ' + (error.response?.data?.error || '未知错误'));
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { bg: 'bg-yellow-100', text: '待审核' },
      verified: { bg: 'bg-green-100', text: '已通过' },
      rejected: { bg: 'bg-red-100', text: '已驳回' },
    };
    return statusMap[status] || { bg: 'bg-gray-100', text: status };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold text-gray-800">发票管理</h1>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              showUpload ? 'bg-gray-100 text-gray-600' : 'bg-blue-600 text-white'
            }`}
          >
            {showUpload ? '取消' : '+ 上传发票'}
          </button>
        </div>

        {/* Upload Form */}
        {showUpload && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-gray-700">上传发票</h3>

            <div>
              <label className="block text-sm text-gray-600 mb-1">发票号码</label>
              <input
                type="text"
                value={uploadData.invoice_no}
                onChange={(e) => setUploadData({ ...uploadData, invoice_no: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="请输入发票号码"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">开票日期</label>
              <input
                type="date"
                value={uploadData.invoice_date}
                onChange={(e) => setUploadData({ ...uploadData, invoice_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">金额</label>
                <input
                  type="number"
                  value={uploadData.amount}
                  onChange={(e) => setUploadData({ ...uploadData, amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">税额</label>
                <input
                  type="number"
                  value={uploadData.tax_amount}
                  onChange={(e) => setUploadData({ ...uploadData, tax_amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Image Upload Placeholder */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <div className="text-4xl mb-2">📷</div>
              <p className="text-sm text-gray-500">点击上传发票图片</p>
              <p className="text-xs text-gray-400 mt-1">支持 JPG, PNG 格式</p>
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? '上传中...' : '提交'}
            </button>
          </div>
        )}
      </div>

      {/* Invoice List */}
      {loading ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400">
          加载中...
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400">
          <div className="text-4xl mb-2">📄</div>
          <p>暂无发票</p>
          <p className="text-sm mt-1">点击上方按钮上传发票</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => {
            const status = getStatusBadge(invoice.status);
            return (
              <div key={invoice.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium text-gray-800">{invoice.invoice_no}</span>
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${status.bg}`}>
                      {status.text}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {dayjs(invoice.created_at).format('MM-DD')}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">金额</span>
                  <span className="font-medium">¥{invoice.amount}</span>
                </div>
                {invoice.tax_amount > 0 && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">税额</span>
                    <span className="text-gray-600">¥{invoice.tax_amount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">开票日期</span>
                  <span className="text-gray-800">
                    {dayjs(invoice.invoice_date).format('YYYY-MM-DD')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MobileInvoices;
