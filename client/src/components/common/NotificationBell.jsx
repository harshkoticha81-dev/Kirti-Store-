import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Truck, 
  Package, 
  Sparkles, 
  Flame, 
  CheckCheck, 
  ExternalLink, 
  Clock, 
  Send,
  ShieldCheck,
  X
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    sendTestNotification 
  } = useNotifications();
  const { isAuthenticated } = useAuth();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order_dispatched':
        return <div className="p-2 rounded-xl bg-blue-50 text-blue-600"><Truck className="w-4 h-4" /></div>;
      case 'order_out_for_delivery':
        return <div className="p-2 rounded-xl bg-amber-50 text-amber-600"><Truck className="w-4 h-4 animate-bounce" /></div>;
      case 'order_delivered':
        return <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><Package className="w-4 h-4" /></div>;
      case 'restock_alert':
        return <div className="p-2 rounded-xl bg-purple-50 text-purple-600"><Sparkles className="w-4 h-4" /></div>;
      case 'flash_deal':
        return <div className="p-2 rounded-xl bg-orange-50 text-orange-600"><Flame className="w-4 h-4" /></div>;
      case 'warranty':
        return <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600"><ShieldCheck className="w-4 h-4" /></div>;
      default:
        return <div className="p-2 rounded-xl bg-slate-100 text-slate-600"><Bell className="w-4 h-4" /></div>;
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    setIsOpen(false);

    const targetUrl = notification.data?.url;
    if (targetUrl) {
      navigate(targetUrl);
    } else if (notification.data?.orderId) {
      navigate(`/track-order?orderId=${notification.data.orderId}`);
    } else if (notification.data?.productId) {
      navigate(`/product/${notification.data.productId}`);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-full text-charcoal hover:text-secondary hover:bg-surface-muted transition-colors"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[20px] h-5 px-1 rounded-full bg-accent text-white text-[10px] font-extrabold flex items-center justify-center shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Flyout Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-surface-border z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-primary to-primary-light text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-bold tracking-wide">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-accent text-white">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] font-semibold text-white/80 hover:text-white flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Action Bar (Test Push button) */}
          <div className="px-4 py-2 bg-slate-50 border-b border-surface-border flex items-center justify-between text-xs">
            <span className="text-[11px] text-charcoal-light font-medium">Order, Restock & Deals</span>
            <button
              onClick={sendTestNotification}
              className="text-[11px] font-bold text-secondary hover:text-secondary-700 flex items-center gap-1 hover:underline"
              title="Test push notification trigger"
            >
              <Send className="w-3 h-3" />
              <span>Send Test Alert</span>
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-surface-border">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-charcoal-light">
                <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Checking alerts...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-charcoal">No notifications yet</p>
                <p className="text-[11px] text-charcoal-light mt-1 max-w-[240px] mx-auto">
                  You will receive real-time push alerts when your orders ship, wishlist items restock, or flash sales drop!
                </p>
                <button
                  onClick={sendTestNotification}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 hover:bg-secondary/20 text-secondary text-xs font-bold rounded-lg transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  Try a Test Push
                </button>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-50/80 cursor-pointer transition-colors relative ${
                    !item.isRead ? 'bg-blue-50/40' : ''
                  }`}
                >
                  {/* Unread indicator dot */}
                  {!item.isRead && (
                    <span className="absolute left-1.5 top-5 w-2 h-2 rounded-full bg-secondary" />
                  )}

                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(item.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4 className={`text-xs truncate ${!item.isRead ? 'font-bold text-primary' : 'font-medium text-charcoal'}`}>
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-charcoal-light flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-charcoal-light line-clamp-2 leading-relaxed">
                      {item.body}
                    </p>

                    {item.data?.url && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-secondary mt-1 hover:underline">
                        View details <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-surface-border text-center">
            <span className="text-[10px] text-charcoal-light font-medium">
              📲 Push Notifications active on Android, iOS & Web
            </span>
          </div>

        </div>
      )}
    </div>
  );
};

export default NotificationBell;
