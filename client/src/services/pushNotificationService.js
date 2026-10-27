import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Haptics, NotificationType } from '@capacitor/haptics';
import api from './api';

let isInitialized = false;

/**
 * Initialize Push Notifications on mobile native devices (Android & iOS)
 * @param {Function} navigate - React Router navigate function
 * @param {Function} onForegroundNotification - Optional callback when notification arrives in foreground
 */
export const initPushNotifications = async (navigate, onForegroundNotification) => {
  // Only native platforms (Android & iOS) support native Capacitor PushNotifications
  if (!Capacitor.isNativePlatform()) {
    console.log('[Push] Web browser detected. Native push listeners skipped.');
    return;
  }

  if (isInitialized) {
    return;
  }
  isInitialized = true;

  try {
    // 1. Check & Request Permissions
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('[Push] User denied push notification permissions.');
      return;
    }

    // 2. Register with Apple (APNS) or Google (FCM)
    await PushNotifications.register();

    // 3. Listen for Device Registration Token
    await PushNotifications.addListener('registration', async (token) => {
      console.log('✅ [Push] Device registered with FCM token:', token.value);
      try {
        const platform = Capacitor.getPlatform(); // 'android' or 'ios'
        await api.post('/notifications/device-token', {
          token: token.value,
          platform,
          deviceName: navigator.userAgent || 'Mobile Device'
        });
        localStorage.setItem('kirti_fcm_token', token.value);
      } catch (err) {
        console.warn('[Push] Failed to sync FCM token to server:', err.message);
      }
    });

    // 4. Handle Registration Errors
    await PushNotifications.addListener('registrationError', (error) => {
      console.error('[Push] FCM Registration Error:', error);
    });

    // 5. Handle Notification Received in Foreground (App is open)
    await PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      console.log('🔔 [Push] Foreground notification received:', notification);
      
      // Tactile haptic feedback
      try {
        await Haptics.notification({ type: NotificationType.Success });
      } catch (_) {}

      if (typeof onForegroundNotification === 'function') {
        onForegroundNotification(notification);
      }
    });

    // 6. Handle Notification Click / Tap Action (User opened app from notification)
    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('👆 [Push] Notification action performed:', action);
      const data = action.notification?.data || {};
      const targetUrl = data.url;

      if (targetUrl && typeof navigate === 'function') {
        navigate(targetUrl);
      } else if (data.orderId && typeof navigate === 'function') {
        navigate(`/track-order?orderId=${data.orderId}`);
      } else if (data.productId && typeof navigate === 'function') {
        navigate(`/product/${data.productId}`);
      }
    });

    console.log('✅ [Push] Capacitor Push Notifications initialized successfully.');
  } catch (err) {
    console.warn('[Push] Error initializing push notifications:', err);
  }
};

/**
 * Remove device token from backend upon user logout
 */
export const unregisterPushToken = async () => {
  const token = localStorage.getItem('kirti_fcm_token');
  if (token) {
    try {
      await api.delete('/notifications/device-token', { data: { token } });
    } catch (_) {}
    localStorage.removeItem('kirti_fcm_token');
  }
};
