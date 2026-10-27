import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { initPushNotifications } from '../../services/pushNotificationService';
import { useNotifications } from '../../context/NotificationContext';

/**
 * MobileAppController
 * Manages native lifecycle events, status bar styles, splash screen transitions,
 * push notification initialization, and Android hardware/gesture back button handling.
 */
const MobileAppController = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleForegroundPush } = useNotifications();

  useEffect(() => {
    // Only run Capacitor native APIs when running on Android or iOS
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // 1. Configure Native Status Bar
    const setupStatusBar = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        if (Capacitor.getPlatform() === 'android') {
          await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
          await StatusBar.setOverlaysWebView({ overlay: false });
        }
      } catch (err) {
        console.warn('StatusBar configuration not supported:', err);
      }
    };

    // 2. Hide Splash Screen after React has loaded
    const hideSplash = async () => {
      try {
        await SplashScreen.hide({ fadeOutDuration: 300 });
      } catch (err) {
        console.warn('SplashScreen hide skipped:', err);
      }
    };

    setupStatusBar();
    hideSplash();

    // 3. Initialize Push Notifications (FCM / APNS)
    initPushNotifications(navigate, handleForegroundPush);

    // 4. Android Hardware & Gesture Back Button Handling
    let backButtonSub;
    const registerBackButton = async () => {
      try {
        backButtonSub = await CapApp.addListener('backButton', ({ canGoBack }) => {
          const path = window.location.pathname;
          
          // Root or home pages: minimize the app rather than quitting or getting stuck
          if (path === '/' || path === '/admin/dashboard') {
            CapApp.minimizeApp();
          } else {
            // Navigate back in React Router history
            navigate(-1);
          }
        });
      } catch (err) {
        console.warn('Capacitor backButton listener failed:', err);
      }
    };

    registerBackButton();

    return () => {
      if (backButtonSub && typeof backButtonSub.remove === 'function') {
        backButtonSub.remove();
      }
    };
  }, [navigate, location.pathname]);

  return null;
};

export default MobileAppController;
