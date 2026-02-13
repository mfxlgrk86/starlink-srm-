import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const testAccounts = [
    { username: 'admin', password: 'admin123', role: '管理员' },
    { username: 'purchaser', password: 'purchase123', role: '采购员' },
    { username: 'huawei', password: 'huawei123', role: '供应商' },
    { username: 'finance', password: 'finance123', role: '财务' }
  ];

  const fillCredentials = (account) => {
    setUsername(account.username);
    setPassword(account.password);
  };

  return (
    <div className="min-h-screen bg-apple-gray flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-apple-dark mb-2">星穹 SRM</h1>
          <p className="text-gray-500">供应链协同平台</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-apple-lg p-8">
          <h2 className="text-xl font-medium text-center mb-6">登录</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="请输入用户名"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="请输入密码"
                required
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
        </div>

        {/* Test Accounts */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-3">测试账号</h3>
          <div className="space-y-2">
            {testAccounts.map((account) => (
              <button
                key={account.username}
                onClick={() => fillCredentials(account)}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 text-sm"
              >
                <span className="text-gray-700">{account.username}</span>
                <span className="text-gray-400 text-xs">{account.role}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Access */}
        <p className="text-center text-gray-400 text-sm mt-6">
          移动端访问: /mobile
        </p>
      </div>
    </div>
  );
};

export default Login;
