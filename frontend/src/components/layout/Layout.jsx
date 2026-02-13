import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const menuItems = [
  { path: '/', label: '工作台', icon: '📊', roles: ['admin', 'purchaser', 'supplier', 'finance'] },
  { path: '/orders', label: '订单管理', icon: '📦', roles: ['admin', 'purchaser', 'supplier'] },
  { path: '/suppliers', label: '供应商', icon: '🏭', roles: ['admin', 'purchaser'] },
  { path: '/sourcing', label: '寻源中心', icon: '🔍', roles: ['admin', 'purchaser', 'supplier'] },
  { path: '/finance', label: '财务协同', icon: '💰', roles: ['admin', 'purchaser', 'supplier', 'finance'] }
];

const Layout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredMenuItems = menuItems.filter(
    item => user && item.roles.includes(user.role)
  );

  const roleLabels = {
    admin: '管理员',
    purchaser: '采购员',
    supplier: '供应商',
    finance: '财务'
  };

  return (
    <div className="min-h-screen bg-apple-gray">
      {/* Header */}
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-apple-dark">星穹 SRM</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">
                  {user?.username}
                </span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  {roleLabels[user?.role]}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-14">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-gray-200 fixed h-full overflow-y-auto hidden md:block">
          <nav className="p-4 space-y-1">
            {filteredMenuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-apple-blue'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Mobile Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
          <div className="flex justify-around py-2">
            {filteredMenuItems.slice(0, 4).map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center text-xs ${
                    isActive ? 'text-apple-blue' : 'text-gray-500'
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                <span className="mt-1">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 md:ml-56 p-6 pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
