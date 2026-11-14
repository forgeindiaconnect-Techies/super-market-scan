import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Auth Portal
import LoginPage from "./pages/auth/LoginPage";

// Super Admin Multi-Tenant SaaS Portal
import SuperAdminLayout from "./layouts/SuperAdminLayout";
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import AddSupermarket from "./pages/superadmin/AddSupermarket";
import SupermarketsManagement from "./pages/superadmin/SupermarketsManagement";
import RegisteredSupermarkets from "./pages/superadmin/RegisteredSupermarkets";
import ProductWiseSalesReport from "./pages/superadmin/ProductWiseSalesReport";
import GlobalCatalog from "./pages/superadmin/GlobalCatalog";
import ConsolidatedOrders from "./pages/superadmin/ConsolidatedOrders";
import CustomersDirectory from "./pages/superadmin/CustomersDirectory";
import TurnstileManagement from "./pages/superadmin/TurnstileManagement";
import PlatformReports from "./pages/superadmin/PlatformReports";
import SaaSPlans from "./pages/superadmin/SaaSPlans";
import SuperAdminSettings from "./pages/superadmin/SuperAdminSettings";

// Store Admin Tenant Portal
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProductManagement from "./pages/admin/ProductManagement";
import AddProduct from "./pages/admin/AddProduct";
import ScanAndEnter from "./pages/admin/ScanAndEnter";
import InventoryManagement from "./pages/admin/InventoryManagement";
import BarcodeManagement from "./pages/admin/BarcodeManagement";
import OrdersManagement from "./pages/admin/OrdersManagement";
import CustomersManagement from "./pages/admin/CustomersManagement";
import ReportsManagement from "./pages/admin/ReportsManagement";
import SettingsManagement from "./pages/admin/SettingsManagement";
import NotificationsManagement from "./pages/admin/NotificationsManagement";

// Customer Self-Checkout Web Mirror
import CustomerLayout from "./layouts/CustomerLayout";
import CustomerDashboard from "./pages/customer/CustomerDashboard";

// Role-based Router Guard / Entrypoint
function RootRedirect() {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === "SUPER_ADMIN") {
    return <Navigate to="/super-admin" replace />;
  }
  return <Navigate to="/admin" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Default entry root */}
          <Route path="/" element={<RootRedirect />} />

          {/* Unified SaaS Login Portal */}
          <Route path="/login" element={<LoginPage />} />

          {/* Super Admin Centralized Multi-Tenant Command Center (10 Enterprise Modules) */}
          <Route path="/super-admin" element={<SuperAdminLayout />}>
            <Route index element={<SuperAdminDashboard />} />
            <Route path="add-supermarket" element={<AddSupermarket />} />
            <Route path="add" element={<AddSupermarket />} />
            <Route path="supermarkets" element={<SupermarketsManagement />} />
            <Route path="manage-supermarkets" element={<SupermarketsManagement />} />
            <Route path="registered-supermarkets" element={<RegisteredSupermarkets />} />
            <Route path="plans" element={<SaaSPlans defaultTab="manage" />} />
            <Route path="create-plan" element={<SaaSPlans defaultTab="create" />} />
            <Route path="manage-plans" element={<SaaSPlans defaultTab="manage" />} />
            <Route path="analytics" element={<PlatformReports />} />
            <Route path="product-sales" element={<ProductWiseSalesReport />} />
            <Route path="catalog" element={<GlobalCatalog />} />
            <Route path="orders" element={<ConsolidatedOrders />} />
            <Route path="customers" element={<CustomersDirectory />} />
            <Route path="turnstiles" element={<TurnstileManagement />} />
            <Route path="reports" element={<PlatformReports />} />
            <Route path="settings" element={<SuperAdminSettings />} />
          </Route>

          {/* Store Admin Tenant Management Portal (Isolated Data Scoping) */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<ProductManagement />} />
            <Route path="add-product" element={<AddProduct />} />
            <Route path="scan-enter" element={<ScanAndEnter />} />
            <Route path="inventory" element={<InventoryManagement />} />
            <Route path="barcodes" element={<BarcodeManagement />} />
            <Route path="orders" element={<OrdersManagement />} />
            <Route path="customers" element={<CustomersManagement />} />
            <Route path="reports" element={<ReportsManagement />} />
            <Route path="analytics" element={<ReportsManagement />} />
            <Route path="notifications" element={<NotificationsManagement />} />
            <Route path="settings" element={<SettingsManagement />} />
          </Route>

          {/* Customer Self-Checkout Web Mirror */}
          <Route path="/customer" element={<CustomerLayout />}>
            <Route index element={<CustomerDashboard />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
