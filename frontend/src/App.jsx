import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProductManagement from "./pages/admin/ProductManagement";
import AddProduct from "./pages/admin/AddProduct";
import BarcodeManagement from "./pages/admin/BarcodeManagement";
import OrdersManagement from "./pages/admin/OrdersManagement";
import CustomerLayout from "./layouts/CustomerLayout";
import CustomerDashboard from "./pages/customer/CustomerDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />

        {/* Super Admin Management Portal (GrocerEase UI) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="add-product" element={<AddProduct />} />
          <Route path="inventory" element={<ProductManagement />} />
          <Route path="barcodes" element={<BarcodeManagement />} />
          <Route path="orders" element={<OrdersManagement />} />
          <Route path="customers" element={<OrdersManagement />} />
          <Route path="analytics" element={<AdminDashboard />} />
          <Route path="settings" element={<AdminDashboard />} />
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
