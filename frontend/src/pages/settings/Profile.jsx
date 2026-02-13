import React from 'react';
import { useAuthStore } from '../../stores/authStore';

const roleLabels = {
  admin: '管理员',
  purchaser: '采购员',
  supplier: '供应商',
  finance: '财务'
};

const Profile = () => {
  const { user } = useAuthStore();

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-700',
      purchaser: 'bg-blue-100 text-blue-700',
      supplier: 'bg-emerald-100 text-emerald-700',
      finance: 'bg-amber-100 text-amber-700'
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="max-w-lg">
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
          <span className="text-white text-2xl font-semibold">
            {user?.username?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{user?.username}</h2>
          <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user?.role)}`}>
            {roleLabels[user?.role]}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between py-3 border-b border-gray-100">
          <span className="text-gray-500">用户名</span>
          <span className="text-gray-800 font-medium">{user?.username}</span>
        </div>

        <div className="flex justify-between py-3 border-b border-gray-100">
          <span className="text-gray-500">角色</span>
          <span className="text-gray-800 font-medium">{roleLabels[user?.role]}</span>
        </div>

        {user?.supplierName && (
          <div className="flex justify-between py-3 border-b border-gray-100">
            <span className="text-gray-500">所属供应商</span>
            <span className="text-gray-800 font-medium">{user.supplierName}</span>
          </div>
        )}

        <div className="flex justify-between py-3">
          <span className="text-gray-500">账户状态</span>
          <span className="text-green-600 font-medium">正常</span>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-500">
          如需修改个人信息，请联系系统管理员。
        </p>
      </div>
    </div>
  );
};

export default Profile;
