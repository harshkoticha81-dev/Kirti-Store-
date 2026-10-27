import React from 'react';
import { Outlet } from 'react-router-dom';
import AnnouncementBar from '../components/common/AnnouncementBar';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import CartDrawer from '../components/common/CartDrawer';
import CompareDock from '../components/common/CompareDock';
import MobileBottomNav from '../components/mobile/MobileBottomNav';

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <CartDrawer />
      <CompareDock />
      <MobileBottomNav />
      <Footer />
    </div>
  );
};

export default MainLayout;
