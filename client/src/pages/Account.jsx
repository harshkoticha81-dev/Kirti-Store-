import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Package, 
  MapPin, 
  Key, 
  LogOut, 
  Clock, 
  CheckCircle2, 
  Truck, 
  ChevronRight, 
  ShieldCheck,
  AlertCircle,
  FileText,
  Download,
  Loader2,
  Image as ImageIcon,
  X,
  Bell,
  Smartphone,
  Sparkles,
  Flame,
  Send,
  CheckCheck
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNotifications } from '../context/NotificationContext';
import TaxInvoiceModal from '../components/common/TaxInvoiceModal';
import { downloadInvoicePDF } from '../utils/invoiceGenerator';
import { lookupPincode } from '../utils/pincodeService';

const Account = () => {
  const { user, isAuthenticated, logout, updateProfile } = useAuth();
  const { success, error: showError } = useToast();
  const { notifications, unreadCount, markAsRead, markAllAsRead, sendTestNotification } = useNotifications();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'profile', 'security', 'addresses', 'notifications'
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [selectedScreenshotUrl, setSelectedScreenshotUrl] = useState(null);

  // Profile Form state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Address Form state with Smart PIN Code City Fetch
  const initialAddr = user?.addresses?.[0] || {};
  const [street, setStreet] = useState(initialAddr.street || '');
  const [apartment, setApartment] = useState(initialAddr.apartment || '');
  const [postalCode, setPostalCode] = useState(initialAddr.postalCode || '400013');
  const [city, setCity] = useState(initialAddr.city || 'Mumbai');
  const [state, setState] = useState(initialAddr.state || 'Maharashtra');
  const [updatingAddress, setUpdatingAddress] = useState(false);
  const [addrPincodeStatus, setAddrPincodeStatus] = useState({
    loading: false,
    success: Boolean(initialAddr.city),
    message: initialAddr.city ? `Auto-detected: ${initialAddr.city}, ${initialAddr.state}` : '',
    localities: []
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/account');
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoadingOrders(true);
        const res = await api.get('/orders/my-orders');
        if (res.data.success) {
          setOrders(res.data.orders || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, navigate]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    await updateProfile({ name, phone });
    setUpdatingProfile(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      showError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      showError('Password must be at least 6 characters.');
      return;
    }

    try {
      setUpdatingPassword(true);
      const res = await api.put('/auth/password', { currentPassword, newPassword });
      if (res.data.success) {
        success('Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleAddressPincodeChange = async (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 6);
    setPostalCode(cleaned);

    if (cleaned.length === 6) {
      setAddrPincodeStatus({ loading: true, success: false, message: 'Detecting city...', localities: [] });
      try {
        const data = await lookupPincode(cleaned);
        if (data && data.success && data.city) {
          setCity(data.city);
          if (data.state) setState(data.state);
          setAddrPincodeStatus({
            loading: false,
            success: true,
            message: `Auto-detected: ${data.city}, ${data.state}`,
            localities: data.localities || []
          });
        } else {
          setAddrPincodeStatus({
            loading: false,
            success: false,
            message: data?.message || 'Could not auto-detect city.',
            localities: []
          });
        }
      } catch (e) {
        setAddrPincodeStatus({ loading: false, success: false, message: 'Lookup failed', localities: [] });
      }
    } else {
      setAddrPincodeStatus({ loading: false, success: false, message: '', localities: [] });
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (!street || !city || !postalCode) {
      showError('Please complete street address, city, and PIN code.');
      return;
    }

    try {
      setUpdatingAddress(true);
      const res = await updateProfile({
        addresses: [
          {
            street,
            apartment,
            city,
            state,
            postalCode,
            country: 'India',
            isDefault: true,
            phone: phone || user?.phone
          }
        ]
      });
      if (res?.success) {
        success('Delivery address saved successfully!');
      }
    } catch (err) {
      showError('Failed to save delivery address.');
    } finally {
      setUpdatingAddress(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-surface-border gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-black text-xl shadow-md">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-black text-primary">{user?.name}</h1>
            <p className="text-xs text-charcoal-light">{user?.email} • Customer Account</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar Tabs */}
        <aside className="lg:col-span-3 space-y-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-3 transition-colors ${
              activeTab === 'orders' ? 'bg-secondary text-white shadow-sm' : 'text-charcoal hover:bg-surface-muted'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>My Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-3 transition-colors ${
              activeTab === 'profile' ? 'bg-secondary text-white shadow-sm' : 'text-charcoal hover:bg-surface-muted'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile Details</span>
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-3 transition-colors ${
              activeTab === 'addresses' ? 'bg-secondary text-white shadow-sm' : 'text-charcoal hover:bg-surface-muted'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Delivery Address</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between transition-colors ${
              activeTab === 'notifications' ? 'bg-secondary text-white shadow-sm' : 'text-charcoal hover:bg-surface-muted'
            }`}
          >
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4" />
              <span>Notifications & Push</span>
            </div>
            {unreadCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'notifications' ? 'bg-white text-secondary' : 'bg-accent text-white'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-3 transition-colors ${
              activeTab === 'security' ? 'bg-secondary text-white shadow-sm' : 'text-charcoal hover:bg-surface-muted'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Change Password</span>
          </button>
        </aside>

        {/* Tab Content Panels */}
        <main className="lg:col-span-9">
          
          {/* TAB 1: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-primary">Your Order History</h2>

              {loadingOrders ? (
                <div className="py-12 flex justify-center">
                  <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white rounded-3xl border border-surface-border p-12 text-center space-y-3">
                  <Package className="w-12 h-12 text-charcoal-light mx-auto" />
                  <h3 className="font-bold text-base text-primary">No Orders Placed Yet</h3>
                  <p className="text-xs text-charcoal-light max-w-sm mx-auto">
                    When you order appliances, you can track live dispatch status and view invoices here.
                  </p>
                  <Link
                    to="/shop"
                    className="inline-block mt-2 px-6 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order._id}
                      className="bg-white rounded-3xl border border-surface-border p-6 shadow-sm space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-border gap-2 text-xs">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-mono font-bold text-primary">{order.orderNumber || `Order #${order._id}`}</p>
                            <span className="px-2 py-0.5 rounded-md bg-surface-muted border border-surface-border text-[11px] font-medium text-charcoal">
                              {order.paymentMethod || 'Online'}
                            </span>
                            {order.upiTransactionId && (
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-secondary text-[11px] font-mono font-bold flex items-center gap-1">
                                UTR: {order.upiTransactionId}
                              </span>
                            )}
                            {order.paymentScreenshot && (
                              <button
                                type="button"
                                onClick={() => setSelectedScreenshotUrl(order.paymentScreenshot)}
                                className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[11px] font-bold flex items-center gap-1 transition-colors"
                                title="Click to view uploaded UPI receipt"
                              >
                                <ImageIcon className="w-3 h-3" />
                                <span>Receipt Proof</span>
                              </button>
                            )}
                          </div>
                          <p className="text-charcoal-light mt-0.5">
                            Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              order.orderStatus === 'Delivered'
                                ? 'bg-emerald-50 text-emerald-700'
                                : order.orderStatus === 'Cancelled'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-blue-50 text-secondary'
                            }`}
                          >
                            {order.orderStatus}
                          </span>
                          <span className="font-black text-primary text-sm">
                            ₹{order.totalAmount?.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="divide-y divide-surface-border">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.image}
                                alt=""
                                className="w-10 h-10 object-cover rounded-lg border border-surface-border"
                              />
                              <div>
                                <p className="font-bold text-primary">{item.name}</p>
                                <p className="text-charcoal-light">Qty: {item.quantity} × ₹{item.price}</p>
                              </div>
                            </div>
                            <span className="font-semibold text-primary">
                              ₹{item.lineTotal?.toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Order Timeline Progress Track & Quick Actions */}
                      <div className="pt-3 border-t border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-charcoal-light mb-1.5">
                            Status Timeline
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {order.statusTimeline?.map((step, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 rounded-lg bg-surface-bg border border-surface-border text-charcoal flex items-center gap-1.5"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <strong>{step.status}</strong>
                                <span className="text-[10px] text-charcoal-light">
                                  ({new Date(step.timestamp).toLocaleDateString()})
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0 pt-2 sm:pt-0">
                          <Link
                            to={`/track-order?orderId=${order.orderNumber || order._id}`}
                            className="px-3 py-1.5 rounded-xl bg-surface-muted hover:bg-surface-border border border-surface-border text-xs font-bold text-primary flex items-center gap-1.5 transition-colors"
                          >
                            <Truck className="w-3.5 h-3.5 text-secondary" />
                            <span>Track Shipment</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                downloadInvoicePDF(order);
                                success('Tax Invoice downloaded successfully!');
                              } catch (e) {
                                setSelectedInvoiceOrder(order);
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm active:scale-95"
                            title="Download Tax Invoice PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Invoice</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceOrder(order)}
                            className="px-2.5 py-1.5 rounded-xl bg-surface-muted hover:bg-surface-border border border-surface-border text-xs font-bold text-charcoal flex items-center gap-1.5 transition-colors"
                            title="Preview or print tax invoice"
                          >
                            <FileText className="w-3.5 h-3.5 text-secondary" />
                            <span>View</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROFILE DETAILS */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl border border-surface-border p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-primary">Edit Profile</h2>

              <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md text-xs">
                <div>
                  <label className="font-semibold text-charcoal">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-surface-muted border border-surface-border text-charcoal focus:outline-none focus:ring-1 focus:ring-secondary"
                  />
                </div>

                <div>
                  <label className="font-semibold text-charcoal">Email Address (Immutable)</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-charcoal">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-surface-muted border border-surface-border text-charcoal focus:outline-none focus:ring-1 focus:ring-secondary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="px-6 py-2.5 rounded-xl bg-secondary hover:bg-secondary-700 text-white font-bold text-xs shadow-sm transition-all"
                >
                  {updatingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: CHANGE PASSWORD */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-3xl border border-surface-border p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-primary">Change Account Password</h2>

              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md text-xs">
                <div>
                  <label className="font-semibold text-charcoal">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-surface-muted border border-surface-border text-charcoal focus:outline-none focus:ring-1 focus:ring-secondary"
                  />
                </div>

                <div>
                  <label className="font-semibold text-charcoal">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-surface-muted border border-surface-border text-charcoal focus:outline-none focus:ring-1 focus:ring-secondary"
                  />
                </div>

                <div>
                  <label className="font-semibold text-charcoal">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-surface-muted border border-surface-border text-charcoal focus:outline-none focus:ring-1 focus:ring-secondary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-900 text-white font-bold text-xs shadow-sm transition-all"
                >
                  {updatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: DELIVERY ADDRESS */}
          {activeTab === 'addresses' && (
            <div className="bg-white rounded-3xl border border-surface-border p-6 sm:p-8 space-y-6">
              <div className="border-b border-surface-border pb-3">
                <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-secondary" />
                  <span>Default Delivery Address</span>
                </h2>
                <p className="text-xs text-charcoal-light mt-1">
                  Enter your 6-digit PIN code to automatically detect your City and State.
                </p>
              </div>

              <form onSubmit={handleAddressSubmit} className="space-y-4 max-w-xl text-xs">
                <div>
                  <label className="font-semibold text-charcoal">Flat / House No. / Building / Street *</label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="e.g. Flat 402, Royal Palms Residency, Senapati Bapat Marg"
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-surface-muted border border-surface-border text-charcoal focus:outline-none focus:ring-1 focus:ring-secondary"
                  />
                </div>

                <div>
                  <label className="font-semibold text-charcoal">Apartment / Tower / Landmark (Optional)</label>
                  <input
                    type="text"
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    placeholder="e.g. Tower B, Near Phoenix Mall"
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-surface-muted border border-surface-border text-charcoal focus:outline-none focus:ring-1 focus:ring-secondary"
                  />
                </div>

                {/* PIN Code, City, State Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-charcoal">PIN Code *</label>
                      {addrPincodeStatus.loading && (
                        <span className="text-[10px] text-secondary font-bold flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Detecting...</span>
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={postalCode}
                      onChange={(e) => handleAddressPincodeChange(e.target.value)}
                      placeholder="e.g. 400013"
                      className="w-full mt-1 px-4 py-2.5 rounded-xl bg-surface-muted border border-surface-border text-charcoal font-bold tracking-wider focus:outline-none focus:ring-1 focus:ring-secondary"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-charcoal">City *</label>
                      {addrPincodeStatus.success && (
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded">
                          Auto
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Mumbai"
                      className={`w-full mt-1 px-4 py-2.5 rounded-xl border font-semibold focus:outline-none focus:ring-1 focus:ring-secondary ${
                        addrPincodeStatus.success
                          ? 'bg-emerald-50/20 border-emerald-300'
                          : 'bg-surface-muted border-surface-border'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-charcoal">State *</label>
                      {addrPincodeStatus.success && (
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded">
                          Auto
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="Maharashtra"
                      className={`w-full mt-1 px-4 py-2.5 rounded-xl border font-semibold focus:outline-none focus:ring-1 focus:ring-secondary ${
                        addrPincodeStatus.success
                          ? 'bg-emerald-50/20 border-emerald-300'
                          : 'bg-surface-muted border-surface-border'
                      }`}
                    />
                  </div>
                </div>

                {/* Status Message */}
                {addrPincodeStatus.message && (
                  <div className={`p-2 rounded-xl text-xs flex items-center gap-1.5 ${
                    addrPincodeStatus.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    {addrPincodeStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <span>{addrPincodeStatus.message}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={updatingAddress}
                    className="px-6 py-2.5 rounded-xl bg-secondary hover:bg-blue-600 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    {updatingAddress ? 'Saving Address...' : 'Save Delivery Address'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: PUSH NOTIFICATIONS & ALERTS */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-surface-border shadow-sm space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-surface-border gap-4">
                <div>
                  <h3 className="text-lg font-black text-primary">Push Notifications & Activity Alerts</h3>
                  <p className="text-xs text-charcoal-light mt-0.5">
                    Real-time status updates for order fulfillment, wishlist restocks, and flash sales
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="px-3 py-1.5 rounded-xl border border-surface-border hover:bg-surface-muted text-xs font-bold text-charcoal flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-secondary" />
                      <span>Mark All Read</span>
                    </button>
                  )}
                  <button
                    onClick={sendTestNotification}
                    className="px-4 py-1.5 rounded-xl bg-secondary hover:bg-secondary-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Test Push</span>
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-white shadow-sm text-secondary flex-shrink-0 mt-0.5">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-primary">Firebase Cloud Messaging (FCM) Native Push Ready</p>
                  <p className="text-charcoal-light mt-0.5 leading-relaxed">
                    When you run Kirti Store on your Android or iOS device via Capacitor, you will receive native lock-screen and banner push alerts when your packages are dispatched, out for delivery, or when favorite appliances are restocked.
                  </p>
                </div>
              </div>

              {/* Notification List */}
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center mx-auto mb-3 text-charcoal-light">
                      <Bell className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-primary">No Notifications Yet</p>
                    <p className="text-xs text-charcoal-light mt-1 max-w-sm mx-auto">
                      Orders you place, dispatch milestones, and restock notifications will appear here.
                    </p>
                    <button
                      onClick={sendTestNotification}
                      className="mt-4 px-4 py-2 rounded-xl bg-secondary text-white text-xs font-bold shadow-sm inline-flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Trigger Test Push Now</span>
                    </button>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => {
                        if (!item.isRead) markAsRead(item._id);
                        if (item.data?.url) navigate(item.data.url);
                        else if (item.data?.orderId) navigate(`/track-order?orderId=${item.data.orderId}`);
                        else if (item.data?.productId) navigate(`/product/${item.data.productId}`);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                        !item.isRead
                          ? 'bg-blue-50/50 border-blue-200 hover:bg-blue-50/80 shadow-sm'
                          : 'bg-white border-surface-border hover:bg-surface-muted/50'
                      }`}
                    >
                      <div className="p-2.5 rounded-xl bg-white shadow-sm border border-surface-border flex-shrink-0 mt-0.5">
                        {item.type === 'order_dispatched' && <Truck className="w-5 h-5 text-blue-600" />}
                        {item.type === 'order_out_for_delivery' && <Truck className="w-5 h-5 text-amber-600 animate-bounce" />}
                        {item.type === 'order_delivered' && <Package className="w-5 h-5 text-emerald-600" />}
                        {item.type === 'restock_alert' && <Sparkles className="w-5 h-5 text-purple-600" />}
                        {item.type === 'flash_deal' && <Flame className="w-5 h-5 text-orange-600" />}
                        {(!item.type || item.type === 'system' || item.type === 'warranty') && <Bell className="w-5 h-5 text-slate-600" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className={`text-xs ${!item.isRead ? 'font-black text-primary' : 'font-bold text-charcoal'}`}>
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-charcoal-light flex items-center gap-1 flex-shrink-0">
                            <Clock className="w-3 h-3" />
                            {new Date(item.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-charcoal-light leading-relaxed">
                          {item.body}
                        </p>
                        {item.data?.url && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-secondary mt-2 hover:underline">
                            Open Details <ChevronRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

        </main>

      </div>

      {/* Tax Invoice Modal */}
      <TaxInvoiceModal
        order={selectedInvoiceOrder}
        isOpen={Boolean(selectedInvoiceOrder)}
        onClose={() => setSelectedInvoiceOrder(null)}
      />

      {/* UPI Payment Screenshot Lightbox Modal */}
      {selectedScreenshotUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedScreenshotUrl(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white rounded-3xl p-4 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-secondary" />
                <h4 className="font-bold text-sm text-primary">UPI Payment Screenshot</h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedScreenshotUrl(null)}
                className="w-8 h-8 rounded-full bg-surface-muted hover:bg-surface-border flex items-center justify-center text-charcoal transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-2 flex items-center justify-center bg-surface-bg rounded-2xl mt-3">
              <img
                src={selectedScreenshotUrl}
                alt="UPI Payment Screenshot"
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-sm"
              />
            </div>
            <div className="pt-3 flex items-center justify-between text-xs text-charcoal-light">
              <span>Receipt proof submitted for this order</span>
              <a
                href={selectedScreenshotUrl}
                target="_blank"
                rel="noreferrer"
                download="upi-payment-receipt.png"
                className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary-600 text-white font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Open / Download Full Image</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Account;
