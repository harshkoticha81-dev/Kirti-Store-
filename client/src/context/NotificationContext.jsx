import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast() || {};
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications from server
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get('/notifications?limit=25');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // Gracefully handle silent fetch errors
      console.warn('Failed to load notifications:', err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Mark single notification as read
  const markAsRead = async (id) => {
    try {
      const res = await api.patch(`/notifications/${id}/read`);
      if (res.data.success) {
        setNotifications(prev =>
          prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(res.data.unreadCount ?? Math.max(0, unreadCount - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const res = await api.patch('/notifications/read-all');
      if (res.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  // Trigger test notification
  const sendTestNotification = async () => {
    try {
      const res = await api.post('/notifications/test');
      if (res.data.success) {
        if (showToast) {
          showToast('Test notification triggered! Check your notification bell and mobile drawer.', 'success');
        }
        await fetchNotifications();
      }
    } catch (err) {
      if (showToast) {
        showToast(err.response?.data?.message || 'Failed to trigger test notification.', 'error');
      }
    }
  };

  // Add notification locally when foreground push arrives
  const handleForegroundPush = (pushData) => {
    const title = pushData.title || pushData.notification?.title || 'Kirti Store Alert';
    const body = pushData.body || pushData.notification?.body || '';

    if (showToast) {
      showToast(`${title}: ${body}`, 'info');
    }

    // Refresh notification list
    fetchNotifications();
  };

  useEffect(() => {
    fetchNotifications();

    // Auto-refresh notifications every 45s while authenticated
    if (isAuthenticated) {
      const interval = setInterval(fetchNotifications, 45000);
      return () => clearInterval(interval);
    }
  }, [fetchNotifications, isAuthenticated]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        sendTestNotification,
        handleForegroundPush
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    return {
      notifications: [],
      unreadCount: 0,
      loading: false,
      fetchNotifications: () => {},
      markAsRead: () => {},
      markAllAsRead: () => {},
      sendTestNotification: () => {},
      handleForegroundPush: () => {}
    };
  }
  return context;
};

export default NotificationContext;
