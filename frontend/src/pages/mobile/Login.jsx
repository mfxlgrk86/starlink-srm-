import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const MobileLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/mobile');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      navigate('/mobile');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const testAccounts = [
    { username: 'huawei', password: 'huawei123', role: '供应商' },
    { username: 'lixun', password: 'lixun123', role: '供应商' },
  ];

  const fillCredentials = (account) => {
    setUsername(account.username);
    setPassword(account.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-1">星穹 SRM</h1>
          <p className="text-gray-500 text-sm">供应商移动端</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-medium text-center mb-6 text-gray-800">欢迎回来</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                用户名
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
                  placeholder="请输入用户名"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
                  placeholder="请输入密码"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2.5 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 transition-all shadow-sm disabled:opacity-50 mt-6"
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
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 text-sm transition-colors border border-gray-100"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-medium text-sm">
                      {account.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-gray-700 font-medium">{account.username}</span>
                </div>
                <span className="text-gray-400 text-xs bg-gray-100 px-2 py-1 rounded-full">
                  {account.role}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* PC Access */}
        <p className="text-center text-gray-400 text-sm mt-6">
          PC端访问: <span className="text-indigo-600">localhost:5173</span>
        </p>
      </div>
    </div>
  );
};

export default MobileLogin;
