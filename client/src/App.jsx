import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

// Core Landing Page - statically imported for instant First Contentful Paint (FCP)
import Home from './pages/Home';

// Lazy-loaded Public Storefront Pages (loaded on-demand as user browses)
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Account = lazy(() => import('./pages/Account'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Deals = lazy(() => import('./pages/Deals'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Compare = lazy(() => import('./pages/Compare'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const BuyingGuide = lazy(() => import('./pages/BuyingGuide'));
const WarrantyRegistration = lazy(() => import('./pages/WarrantyRegistration'));
const StoreLocator = lazy(() => import('./pages/StoreLocator'));

// Lazy-loaded Admin Dashboard Pages (zero overhead for regular customers)
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const DashboardOverview = lazy(() => import('./pages/admin/DashboardOverview'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminProductForm = lazy(() => import('./pages/admin/AdminProductForm'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminInventory = lazy(() => import('./pages/admin/AdminInventory'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));

// Mobile Native Integration
import MobileAppController from './components/mobile/MobileAppController';

// Lightweight, sleek page loading spinner
const PageLoadingFallback = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 py-16">
    <div className="w-9 h-9 border-3 border-zinc-200 border-t-zinc-950 rounded-full animate-spin" />
    <span className="text-xs font-semibold text-charcoal-light tracking-wide">Loading page...</span>
  </div>
);

const App = () => {
  return (
    <>
      <MobileAppController />
      <Suspense fallback={<PageLoadingFallback />}>
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
      </Suspense>
    </>
  );
};

export default App;
