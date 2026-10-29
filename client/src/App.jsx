import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

// Storefront Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Login from './pages/Login';
import Register from './pages/Register';
import Account from './pages/Account';
import Wishlist from './pages/Wishlist';
import Deals from './pages/Deals';
import About from './pages/About';
import Contact from './pages/Contact';
import Compare from './pages/Compare';
import TrackOrder from './pages/TrackOrder';
import BuyingGuide from './pages/BuyingGuide';
import WarrantyRegistration from './pages/WarrantyRegistration';
import StoreLocator from './pages/StoreLocator';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import DashboardOverview from './pages/admin/DashboardOverview';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminOrders from './pages/admin/AdminOrders';
import AdminInventory from './pages/admin/AdminInventory';
import AdminCustomers from './pages/admin/AdminCustomers';

// Mobile Native Integration
import MobileAppController from './components/mobile/MobileAppController';

const App = () => {
  return (
    <>
      <MobileAppController />
      <Routes>
        {/* 1. Public Storefront Layout Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success/:id" element={<OrderSuccess />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/account" element={<Account />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/track-order" element={<TrackOrder />} />
        <Route path="/buying-guide" element={<BuyingGuide />} />
        <Route path="/warranty" element={<WarrantyRegistration />} />
        <Route path="/warranty-registration" element={<WarrantyRegistration />} />
        <Route path="/stores" element={<StoreLocator />} />
        <Route path="/store-locator" element={<StoreLocator />} />
        <Route path="/spares" element={<Navigate to="/shop" replace />} />
        <Route path="/spare-parts" element={<Navigate to="/shop" replace />} />
        <Route path="/deals" element={<Deals />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      {/* 2. Admin Standalone Login */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* 3. Protected Admin Dashboard Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardOverview />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/new" element={<AdminProductForm />} />
        <Route path="products/edit/:id" element={<AdminProductForm />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="inventory" element={<AdminInventory />} />
        <Route path="customers" element={<AdminCustomers />} />
      </Route>

      {/* 4. 404 Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
};

export default App;
