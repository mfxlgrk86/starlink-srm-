import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Orders from './pages/orders/Orders';
import OrderDetail from './pages/orders/OrderDetail';
import Suppliers from './pages/suppliers/Suppliers';
import SupplierDetail from './pages/suppliers/SupplierDetail';
import Sourcing from './pages/sourcing/Sourcing';
import Finance from './pages/finance/Finance';
import MobileLayout from './pages/mobile/MobileLayout';
import MobileLogin from './pages/mobile/Login';
import MobileDashboard from './pages/mobile/Dashboard';
import MobileOrders from './pages/mobile/Orders';
import MobileOrderDetail from './pages/mobile/OrderDetail';
import MobileInvoices from './pages/mobile/Invoices';
import MobileReconciliations from './pages/mobile/Reconciliations';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Mobile Protected Route
const MobileProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/mobile/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PC端路由 */}
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="suppliers/:id" element={<SupplierDetail />} />
          <Route path="sourcing" element={<Sourcing />} />
          <Route path="finance" element={<Finance />} />
        </Route>

        {/* 移动端路由 */}
        <Route path="/mobile/login" element={<MobileLogin />} />
        <Route
          path="/mobile"
          element={
            <MobileProtectedRoute>
              <MobileLayout />
            </MobileProtectedRoute>
          }
        >
          <Route index element={<MobileDashboard />} />
          <Route path="orders" element={<MobileOrders />} />
          <Route path="orders/:id" element={<MobileOrderDetail />} />
          <Route path="invoices" element={<MobileInvoices />} />
          <Route path="reconciliations" element={<MobileReconciliations />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
