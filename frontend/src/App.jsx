import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProductManagement from "./pages/admin/ProductManagement";
import AddProduct from "./pages/admin/AddProduct";
import InventoryManagement from "./pages/admin/InventoryManagement";
import BarcodeManagement from "./pages/admin/BarcodeManagement";
import OrdersManagement from "./pages/admin/OrdersManagement";
import CustomersManagement from "./pages/admin/CustomersManagement";
import ReportsManagement from "./pages/admin/ReportsManagement";
import SettingsManagement from "./pages/admin/SettingsManagement";
import CustomerLayout from "./layouts/CustomerLayout";
import CustomerDashboard from "./pages/customer/CustomerDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />

        {/* Super Admin Management Portal (GrocerEase Innovative SaaS UI) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="add-product" element={<AddProduct />} />
          <Route path="inventory" element={<InventoryManagement />} />
          <Route path="barcodes" element={<BarcodeManagement />} />
          <Route path="orders" element={<OrdersManagement />} />
          <Route path="customers" element={<CustomersManagement />} />
          <Route path="reports" element={<ReportsManagement />} />
          <Route path="analytics" element={<ReportsManagement />} />
          <Route path="settings" element={<SettingsManagement />} />
        </Route>

        {/* Customer Self-Checkout Web Mirror */}
        <Route path="/customer" element={<CustomerLayout />}>
          <Route index element={<CustomerDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
