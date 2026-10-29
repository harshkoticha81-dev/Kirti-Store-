import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  ShoppingCart, 
  Search, 
  Eye, 
  X, 
  CheckCircle2, 
  Truck, 
  AlertCircle, 
  AlertTriangle,
  ArrowRight,
  Clock,
  RotateCcw,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Printer,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  FileText,
  IndianRupee,
  Package,
  Calendar,
  ShieldCheck,
  UserCheck,
  Image as ImageIcon,
  Hash,
  Smartphone
} from 'lucide-react';
import api from '../../services/api';
import { getSafeProductImageUrl, getApplianceFallbackImage } from '../../utils/imageUtils';
import { useToast } from '../../context/ToastContext';
import { downloadInvoicePDF } from '../../utils/invoiceGenerator';
import { 
  getWhatsAppDirectLink, 
  openWhatsAppDirect, 
  formatRtoVerificationMessage 
} from '../../utils/whatsappUtils';

const AdminOrders = () => {
  const { success, error: showError } = useToast();
  const [searchParams] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    highRtoRiskOrders: 0,
    mediumRtoRiskOrders: 0,
    verifiedAddressOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [rtoFilter, setRtoFilter] = useState(searchParams.get('rtoRisk') || 'all');
  const [search, setSearch] = useState('');

  // Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [statusModalOrder, setStatusModalOrder] = useState(null);
  const [rtoModalOrder, setRtoModalOrder] = useState(null);
  const [verifyingAddress, setVerifyingAddress] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [viewingProofUrl, setViewingProofUrl] = useState(null);

  // Copy helper
  const [copiedId, setCopiedId] = useState('');

  const handleCopyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const handleVerifyAddress = async (orderId, addressVerified = true, notes) => {
    try {
      setVerifyingAddress(true);
      const res = await api.patch(`/admin/orders/${orderId}/verify-address`, {
        addressVerified,
        verificationNotes: notes || (addressVerified ? 'Address & landmark verified with customer on WhatsApp' : 'Address verification reset')
      });
      if (res.data.success) {
        success(res.data.message);
        setOrders(prev => prev.map(o => o._id === orderId ? res.data.order : o));
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(res.data.order);
        }
        if (rtoModalOrder && rtoModalOrder._id === orderId) {
          setRtoModalOrder(res.data.order);
        }
        fetchOrders(true);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update address verification.');
    } finally {
      setVerifyingAddress(false);
    }
  };

  const handleSendRtoWhatsApp = (order) => {
    const rawPhone = order.customerPhone || order.shippingAddress?.phone || '';
    if (!rawPhone) {
      showError('No customer phone number available on this order.');
      return;
    }
    const message = formatRtoVerificationMessage(order);
    const opened = openWhatsAppDirect(rawPhone, message);
    if (opened) {
      success('Opening WhatsApp with official address verification template...');
    } else {
      showError('Unable to open WhatsApp. Please check popup permissions.');
    }
  };

  const fetchOrders = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const params = new URLSearchParams({
        page,
        limit: 15,
      });

      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (paymentFilter !== 'all') params.set('paymentStatus', paymentFilter);
      if (rtoFilter !== 'all') params.set('rtoRisk', rtoFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await api.get(`/admin/orders?${params.toString()}`);
      if (res.data.success) {
        setOrders(res.data.orders || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
      }
    } catch (err) {
      console.error('[Admin Orders Fetch Error]:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, paymentFilter, rtoFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
    fetchOrders();
  };

  const openStatusModal = (order) => {
    setStatusModalOrder(order);
    setNewStatus(order.orderStatus);
    setStatusNote('');
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!newStatus) return;

    try {
      setUpdatingStatus(true);
      const res = await api.patch(`/admin/orders/${statusModalOrder._id}/status`, {
        status: newStatus,
        note: statusNote.trim() || undefined,
      });

      if (res.data.success) {
        success(res.data.message);
        setStatusModalOrder(null);
        // If order details modal is open for this order, update it too
        if (selectedOrder && selectedOrder._id === statusModalOrder._id) {
          setSelectedOrder(res.data.order);
        }
        fetchOrders();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update order status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Helper for WhatsApp deep link
  const getWhatsAppLink = (order) => {
    const rawPhone = order.customerPhone || order.shippingAddress?.phone || '';
    const text = `Hello ${order.customerName || 'Customer'}, this is Kirti Store support regarding your Order #${order._id ? order._id.substring(0, 8) : ''}. Total Amount: ₹${order.totalAmount?.toLocaleString('en-IN')}. Current Status: ${order.orderStatus}. Thank you for shopping with us!`;
    return getWhatsAppDirectLink(rawPhone, text);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. TOP HEADER & METRICS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-6 h-6 text-secondary" />
            Order Fulfillment & Customer Inquiries
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time customer dispatch records, delivery addresses, and payment confirmations
          </p>
        </div>

        <button
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
          className="self-start md:self-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 border border-slate-700 shadow-sm"
          title="Refresh orders now"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-secondary' : 'text-slate-400'}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Orders'}</span>
        </button>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Orders</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black text-white">{metrics.totalOrders || total || 0}</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-secondary flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Order Revenue</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black text-emerald-400">₹{(metrics.totalRevenue || 0).toLocaleString('en-IN')}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending / Processing</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black text-amber-400">{metrics.pendingOrders || 0}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Delivered Orders</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black text-emerald-300">{metrics.deliveredOrders || 0}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* RTO RISK ALERT BANNER */}
      {(metrics.highRtoRiskOrders || 0) > 0 && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-lg shadow-rose-600/30">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-sm text-white flex items-center gap-2">
                <span>{metrics.highRtoRiskOrders} Order(s) Flagged for High RTO (Return to Origin) Risk</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">Action Required</span>
              </p>
              <p className="text-xs text-rose-300/90 mt-0.5">
                Incomplete street addresses, missing house numbers, or remote transit PIN codes detected. Prompt customer on WhatsApp before booking courier.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setRtoFilter(rtoFilter === 'HIGH' ? 'all' : 'HIGH');
              setPage(1);
            }}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs whitespace-nowrap transition-all shadow-md cursor-pointer"
          >
            {rtoFilter === 'HIGH' ? 'Show All Orders' : 'Filter High Risk Orders'}
          </button>
        </div>
      )}

      {/* 2. SEARCH & ADVANCED FILTER BAR */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search customer name, email, phone, city, order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-secondary"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 cursor-pointer font-medium"
          >
            <option value="all">All Order Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 cursor-pointer font-medium"
          >
            <option value="all">All Payment Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
          </select>

          <select
            value={rtoFilter}
            onChange={(e) => {
              setRtoFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 cursor-pointer font-medium"
          >
            <option value="all">All RTO Risk Statuses</option>
            <option value="UNVERIFIED">⚠️ Needs Verification (High/Med)</option>
            <option value="HIGH">🔴 High RTO Risk</option>
            <option value="MEDIUM">🟡 Medium Risk</option>
            <option value="LOW">🟢 Low Risk</option>
            <option value="VERIFIED">🛡️ Address Verified</option>
          </select>
        </div>
      </div>

      {/* 3. ORDERS TABLE WITH COMPLETE CUSTOMER & PRODUCT DETAILS */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/70 border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Order ID & Date</th>
                <th className="py-4 px-4">Customer Details</th>
                <th className="py-4 px-4">Products Ordered</th>
                <th className="py-4 px-4">Total Amount</th>
                <th className="py-4 px-4">Payment</th>
                <th className="py-4 px-4">Order Status</th>
                <th className="py-4 px-4">RTO Risk</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center text-slate-500">
                    <div className="w-8 h-8 border-3 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading customer orders from database...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center text-slate-500">
                    <ShoppingCart className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-400">No matching customer orders found.</p>
                    <p className="text-[11px] text-slate-500 mt-1">When any customer places an order on the store, it will automatically display here.</p>
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord._id} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* Order ID & Date */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-white text-xs" title={ord.orderNumber || ord._id}>
                          {ord.orderNumber || `#${ord._id.substring(0, 8)}...`}
                        </span>
                        <button
                          onClick={() => handleCopyText(ord.orderNumber || ord._id, ord._id)}
                          title="Copy Full Order ID"
                          className="text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          {copiedId === ord._id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{new Date(ord.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        <span>•</span>
                        <span>{new Date(ord.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>

                    {/* Full Customer Details */}
                    <td className="py-4 px-4 min-w-[200px]">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs flex-shrink-0 mt-0.5">
                          {ord.customerName?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-white truncate">{ord.customerName}</p>
                          <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-500 flex-shrink-0" />
                            {ord.customerEmail}
                          </p>
                          {ord.customerPhone ? (
                            <p className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                              <a href={`tel:${ord.customerPhone}`} className="hover:underline">{ord.customerPhone}</a>
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-500 italic mt-0.5">No phone provided</p>
                          )}
                          <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-3 h-3 text-secondary flex-shrink-0" />
                            {ord.shippingAddress?.city}, {ord.shippingAddress?.state || 'MH'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Products Ordered Preview */}
                    <td className="py-4 px-4 min-w-[220px]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          {ord.items?.slice(0, 3).map((item, idx) => (
                            <img
                              key={idx}
                              src={getSafeProductImageUrl(item.image, item.name)}
                              alt={item.name}
                              title={`${item.name} (Qty: ${item.quantity})`}
                              className="w-8 h-8 rounded-lg object-cover bg-slate-800 border border-slate-700 flex-shrink-0"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = getApplianceFallbackImage(item.name);
                              }}
                            />
                          ))}
                          {(ord.items?.length || 0) > 3 && (
                            <span className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-bold flex items-center justify-center">
                              +{ord.items.length - 3}
                            </span>
                          )}
                        </div>
                        <p className="text-white font-medium text-[11px] truncate max-w-[210px]">
                          {ord.items?.[0]?.name}
                          {(ord.items?.length || 0) > 1 && (
                            <span className="text-slate-400 font-normal"> + {ord.items.length - 1} more</span>
                          )}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          Total {ord.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || 0} unit(s)
                        </span>
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="py-4 px-4 font-bold text-white">
                      <div className="text-sm font-black text-white">
                        ₹{ord.totalAmount?.toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {ord.shippingFee === 0 ? 'Free Shipping' : `+₹${ord.shippingFee} Delivery`}
                      </span>
                    </td>

                    {/* Payment Info */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            ord.paymentStatus === 'Completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            ord.paymentStatus === 'Pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {ord.paymentStatus}
                          </span>
                          {ord.paymentScreenshot && (
                            <button
                              type="button"
                              onClick={() => setViewingProofUrl(ord.paymentScreenshot)}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary/20 hover:bg-secondary/30 text-secondary border border-secondary/40 flex items-center gap-1 transition-colors cursor-pointer"
                              title="Click to view payment screenshot proof"
                            >
                              <ImageIcon className="w-2.5 h-2.5" />
                              <span>Proof</span>
                            </button>
                          )}
                        </div>

                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-slate-500" />
                          <span>{ord.paymentMethod}</span>
                        </p>

                        {ord.upiTransactionId && (
                          <p className="text-[10px] font-mono text-emerald-400 font-semibold truncate max-w-[150px]" title={`UPI UTR: ${ord.upiTransactionId}`}>
                            UTR: {ord.upiTransactionId}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Order Status */}
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        ord.orderStatus === 'Delivered' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        ord.orderStatus === 'Out for Delivery' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        ord.orderStatus === 'Shipped' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                        ord.orderStatus === 'Processing' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        ord.orderStatus === 'Confirmed' ? 'bg-blue-500/20 text-secondary border border-blue-500/30' :
                        ord.orderStatus === 'Cancelled' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {ord.orderStatus}
                      </span>
                    </td>

                    {/* RTO Risk & Address Verification */}
                    <td className="py-4 px-4">
                      {(() => {
                        const rto = ord.rtoRisk || {};
                        const isVerified = rto.addressVerified;
                        const level = rto.riskLevel || 'LOW';
                        const score = rto.riskScore || 15;

                        if (isVerified) {
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                setRtoModalOrder(ord);
                                setVerificationNotes(rto.verificationNotes || '');
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all cursor-pointer"
                              title="Address confirmed with customer via WhatsApp"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Verified ({score})</span>
                            </button>
                          );
                        }

                        if (level === 'HIGH') {
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                setRtoModalOrder(ord);
                                setVerificationNotes('');
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse hover:bg-rose-500/30 transition-all cursor-pointer"
                              title="High RTO risk! Incomplete address or remote PIN code. Click to verify on WhatsApp"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                              <span>High Risk ({score})</span>
                            </button>
                          );
                        }

                        if (level === 'MEDIUM') {
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                setRtoModalOrder(ord);
                                setVerificationNotes('');
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all cursor-pointer"
                              title="Medium RTO risk. Missing house number or landmark. Click to verify"
                            >
                              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                              <span>Medium ({score})</span>
                            </button>
                          );
                        }

                        return (
                          <button
                            type="button"
                            onClick={() => {
                              setRtoModalOrder(ord);
                              setVerificationNotes('');
                            }}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all cursor-pointer"
                            title="Low RTO Risk. Safe to dispatch"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Low ({score})</span>
                          </button>
                        );
                      })()}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
                        title="View Full Customer & Order Details"
                      >
                        <Eye className="w-3.5 h-3.5 inline mr-1" />
                        Details
                      </button>
                      <button
                        onClick={() => openStatusModal(ord)}
                        className="px-2.5 py-1.5 rounded-xl bg-secondary/20 hover:bg-secondary text-secondary hover:text-white font-bold transition-colors"
                        title="Update Fulfillment Status"
                      >
                        <Truck className="w-3.5 h-3.5 inline mr-1" />
                        Status
                      </button>
                      <button
                        onClick={() => setInvoiceOrder(ord)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors inline-flex items-center"
                        title="Print / Save Tax Invoice"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Showing Page {page} of {totalPages} (Total {total} customer orders)</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. MODAL: COMPREHENSIVE CUSTOMER & ORDER DETAILS */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl text-xs text-slate-300">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-white text-lg">
                    {selectedOrder.orderNumber || `Order #${selectedOrder._id}`}
                  </h3>
                  <button
                    onClick={() => handleCopyText(selectedOrder.orderNumber || selectedOrder._id, 'modal-id')}
                    className="text-slate-400 hover:text-white"
                    title="Copy Order ID"
                  >
                    {copiedId === 'modal-id' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInvoiceOrder(selectedOrder)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Invoice</span>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Status Bar */}
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400">Order Status:</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  selectedOrder.orderStatus === 'Delivered' ? 'bg-emerald-500/20 text-emerald-400' :
                  selectedOrder.orderStatus === 'Cancelled' ? 'bg-rose-500/20 text-rose-400' :
                  'bg-blue-500/20 text-secondary'
                }`}>
                  {selectedOrder.orderStatus}
                </span>

                <span className="text-[11px] text-slate-400 ml-2">Payment:</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  selectedOrder.paymentStatus === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {selectedOrder.paymentStatus} ({selectedOrder.paymentMethod})
                </span>
              </div>

              <button
                onClick={() => openStatusModal(selectedOrder)}
                className="px-3 py-1 bg-secondary text-white font-bold rounded-lg text-xs"
              >
                Change Status
              </button>
            </div>

            {/* SECTION 1: CUSTOMER PROFILE & CONTACT ACTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Customer Contact Box */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-secondary" />
                    Customer Contact Details
                  </h4>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">
                    Registered Buyer
                  </span>
                </div>

                <div className="space-y-1.5">
                  <p className="text-white font-bold text-sm">{selectedOrder.customerName}</p>
                  <p className="text-slate-300 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <a href={`mailto:${selectedOrder.customerEmail}`} className="hover:underline text-secondary">
                      {selectedOrder.customerEmail}
                    </a>
                  </p>
                  <p className="text-slate-300 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    {selectedOrder.customerPhone ? (
                      <span className="font-mono text-white">{selectedOrder.customerPhone}</span>
                    ) : (
                      <span className="text-slate-500 italic">No phone specified</span>
                    )}
                  </p>
                </div>

                {/* Instant Communication Action Buttons */}
                <div className="pt-2 border-t border-slate-700/60 flex flex-wrap gap-2">
                  {selectedOrder.customerPhone && (
                    <>
                      <a
                        href={getWhatsAppLink(selectedOrder)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Chat on WhatsApp</span>
                      </a>
                      <a
                        href={`tel:${selectedOrder.customerPhone}`}
                        className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Call</span>
                      </a>
                    </>
                  )}
                  <a
                    href={`mailto:${selectedOrder.customerEmail}?subject=Regarding Kirti Store Order %23${selectedOrder._id}`}
                    className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-secondary" />
                    <span>Email</span>
                  </a>
                </div>
              </div>

              {/* Delivery Shipping Address Box */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-accent" />
                  Delivery & Shipping Address
                </h4>

                <div className="space-y-1 text-slate-200 leading-relaxed">
                  <p className="font-bold text-white">
                    {selectedOrder.shippingAddress?.street}
                  </p>
                  {selectedOrder.shippingAddress?.apartment && (
                    <p>{selectedOrder.shippingAddress?.apartment}</p>
                  )}
                  <p>
                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - <strong className="text-white font-mono">{selectedOrder.shippingAddress?.postalCode}</strong>
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Country: {selectedOrder.shippingAddress?.country || 'India'}
                  </p>
                  {selectedOrder.shippingAddress?.phone && (
                    <p className="text-slate-400 text-[11px]">
                      Contact: {selectedOrder.shippingAddress?.phone}
                    </p>
                  )}
                </div>

                {selectedOrder.notes && (
                  <div className="pt-2 border-t border-slate-700/60 text-[11px] text-amber-300">
                    <strong>Delivery Note:</strong> {selectedOrder.notes}
                  </div>
                )}
              </div>

            </div>

            {/* RTO RISK ASSESSMENT & WHATSAPP ADDRESS VERIFICATION CARD */}
            <div className={`p-4 rounded-2xl border ${
              selectedOrder.rtoRisk?.addressVerified ? 'bg-emerald-950/30 border-emerald-500/30' :
              selectedOrder.rtoRisk?.riskLevel === 'HIGH' ? 'bg-rose-950/40 border-rose-500/40' :
              selectedOrder.rtoRisk?.riskLevel === 'MEDIUM' ? 'bg-amber-950/30 border-amber-500/30' :
              'bg-slate-800/60 border-slate-700/60'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${
                    selectedOrder.rtoRisk?.addressVerified ? 'bg-emerald-600' :
                    selectedOrder.rtoRisk?.riskLevel === 'HIGH' ? 'bg-rose-600' :
                    selectedOrder.rtoRisk?.riskLevel === 'MEDIUM' ? 'bg-amber-600' : 'bg-slate-700'
                  }`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">
                        RTO Risk Assessment:
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedOrder.rtoRisk?.addressVerified ? 'bg-emerald-500/20 text-emerald-400' :
                        selectedOrder.rtoRisk?.riskLevel === 'HIGH' ? 'bg-rose-500/20 text-rose-300 animate-pulse' :
                        selectedOrder.rtoRisk?.riskLevel === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {selectedOrder.rtoRisk?.addressVerified ? 'Verified Address (Low Risk)' : `${selectedOrder.rtoRisk?.riskLevel || 'LOW'} (Score: ${selectedOrder.rtoRisk?.riskScore || 15}/100)`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {selectedOrder.rtoRisk?.addressVerified
                        ? `Address confirmed with recipient by ${selectedOrder.rtoRisk.verifiedBy || 'Dispatch Admin'}`
                        : selectedOrder.rtoRisk?.riskLevel === 'HIGH'
                        ? 'Flagged for incomplete address details or remote PIN code. Please confirm on WhatsApp.'
                        : 'Standard delivery profile. Proceed with courier booking.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendRtoWhatsApp(selectedOrder)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Address Check</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRtoModalOrder(selectedOrder);
                      setVerificationNotes(selectedOrder.rtoRisk?.verificationNotes || '');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] border border-slate-700 transition-colors cursor-pointer"
                  >
                    View Risk Flags
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 2: ORDERED LINE ITEMS SNAPSHOT */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-purple-400" />
                  Ordered Appliance Line Items ({selectedOrder.items?.length})
                </h4>
                <span className="text-[11px] text-slate-400">
                  Total Qty: {selectedOrder.items?.reduce((acc, it) => acc + (it.quantity || 1), 0)} units
                </span>
              </div>

              <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img 
                        src={getSafeProductImageUrl(item.image, item.name)} 
                        alt={item.name} 
                        className="w-12 h-12 rounded-xl object-cover bg-slate-900 border border-slate-800 flex-shrink-0" 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = getApplianceFallbackImage(item.name);
                        }}
                      />
                      <div className="overflow-hidden">
                        <p className="font-bold text-white truncate text-xs">{item.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          SKU: <span className="font-mono text-slate-300">{item.SKU}</span> • Rate: ₹{item.price?.toLocaleString('en-IN')} × <strong className="text-white">{item.quantity}</strong>
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-black text-white text-sm">₹{item.lineTotal?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 3: FINANCIAL TOTALS & PAYMENT INFO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Payment Details */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2.5">
                <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  Payment Information
                </h4>
                <div className="space-y-2 text-[11px]">
                  <p><span className="text-slate-400">Payment Gateway:</span> <strong className="text-white">{selectedOrder.paymentMethod}</strong></p>
                  <p><span className="text-slate-400">Payment Status:</span> <strong className="text-emerald-400">{selectedOrder.paymentStatus}</strong></p>
                  
                  {selectedOrder.upiTransactionId ? (
                    <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/80">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">UPI Transaction ID / UTR</span>
                        <span className="font-mono font-bold text-emerald-400 text-xs">{selectedOrder.upiTransactionId}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyText(selectedOrder.upiTransactionId, 'modal-utr')}
                        className="p-1 text-slate-400 hover:text-white"
                        title="Copy UTR Number"
                      >
                        {copiedId === 'modal-utr' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ) : selectedOrder.paymentId ? (
                    <p><span className="text-slate-400">Transaction ID:</span> <span className="font-mono text-slate-200">{selectedOrder.paymentId}</span></p>
                  ) : null}

                  {selectedOrder.paymentScreenshot ? (
                    <div className="pt-2 border-t border-slate-700/60 space-y-1.5">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Screenshot Proof</span>
                      <div className="flex items-center gap-3 bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/80">
                        <img
                          src={selectedOrder.paymentScreenshot}
                          alt="Screenshot Proof"
                          onClick={() => setViewingProofUrl(selectedOrder.paymentScreenshot)}
                          className="w-12 h-12 rounded-lg object-cover cursor-pointer hover:opacity-80 border border-slate-700 transition-opacity flex-shrink-0"
                          title="Click to zoom screenshot"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] text-emerald-400 font-bold block">Screenshot Attached ✓</span>
                          <button
                            type="button"
                            onClick={() => setViewingProofUrl(selectedOrder.paymentScreenshot)}
                            className="text-xs font-bold text-secondary hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Full Screenshot
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic text-[10px] pt-1">No payment screenshot attached</p>
                  )}

                  {selectedOrder.notes && (
                    <p className="text-slate-400 pt-1">
                      <span>Gateway Note:</span> <span className="text-slate-300">{selectedOrder.notes}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Items Subtotal:</span>
                  <span className="font-medium text-white">₹{selectedOrder.subtotal?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Shipping Delivery:</span>
                  <span className="text-emerald-400 font-medium">
                    {selectedOrder.shippingFee === 0 ? 'FREE' : `₹${selectedOrder.shippingFee}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Taxes (5% GST):</span>
                  <span className="font-medium text-white">₹{(selectedOrder.tax || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-white text-sm pt-2 border-t border-slate-700">
                  <span>Grand Total Payable:</span>
                  <span className="text-secondary text-base font-black">₹{selectedOrder.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
              </div>

            </div>

            {/* SECTION 4: AUDIT STATUS TIMELINE */}
            <div className="space-y-2">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-400" />
                Audit Status Progression Log
              </h4>
              <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
                {selectedOrder.statusTimeline?.map((t, i) => (
                  <div key={i} className="flex items-center justify-between py-2 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-secondary" />
                      <span className="font-bold text-white">{t.status}:</span>
                      <span className="text-slate-300">{t.note}</span>
                    </div>
                    <span className="text-slate-500 font-mono text-[10px]">
                      {new Date(t.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 5. MODAL: FAST STATUS UPDATE */}
      {statusModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Update Order Status</h3>
              <button onClick={() => setStatusModalOrder(null)}>
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>

            <p className="text-slate-300">
              Customer: <strong className="text-white">{statusModalOrder.customerName}</strong> • Order ID: <span className="font-mono text-secondary">#{statusModalOrder._id.substring(0, 10)}</span>
            </p>

            <form onSubmit={handleSaveStatus} className="space-y-4">
              <div>
                <label className="font-semibold text-slate-300">Fulfillment Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold cursor-pointer focus:outline-none focus:ring-1 focus:ring-secondary"
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped (Dispatches FCM Push + WhatsApp)</option>
                  <option value="Out for Delivery">Out for Delivery (Dispatches FCM Push)</option>
                  <option value="Delivered">Delivered (Dispatches FCM Push + Warranty Invite)</option>
                  <option value="Cancelled">Cancelled (Auto-Restocks Inventory)</option>
                </select>
              </div>

              {(newStatus === 'Shipped' || newStatus === 'Out for Delivery' || newStatus === 'Delivered') && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 text-[11px] flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>📲 <strong>Automated Push Alert:</strong> Updating to <strong>{newStatus}</strong> dispatches real-time push notification to customer's mobile app.</span>
                </div>
              )}

              {newStatus === 'Cancelled' && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-[11px] space-y-1">
                  <p className="font-bold">⚠️ Automatic Stock Restocking:</p>
                  <p>Selecting <strong>Cancelled</strong> will automatically restore the purchased items back to current stock in the product database.</p>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-300">Status Tracking Note</label>
                <input
                  type="text"
                  placeholder="e.g. Dispatched via BlueDart AWB# 781921"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-secondary"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatusModalOrder(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="flex-1 py-2.5 bg-secondary hover:bg-secondary-700 text-white font-bold rounded-xl shadow transition-colors flex items-center justify-center gap-1.5"
                >
                  {updatingStatus && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{updatingStatus ? 'Updating...' : 'Save New Status'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: PRINTABLE TAX INVOICE */}
      {invoiceOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-2xl w-full bg-white text-slate-900 rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl text-xs print:p-0 print:shadow-none">
            
            {/* Action Bar (hidden when printing) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
              <span className="font-bold text-slate-500 uppercase text-[10px]">Printable Customer Invoice</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      downloadInvoicePDF(invoiceOrder);
                      success('Invoice PDF downloaded!');
                    } catch (e) {
                      showError('Failed to generate PDF');
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setInvoiceOrder(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Invoice Printable Body */}
            <div className="space-y-6">
              
              {/* Invoice Brand Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">KIRTI STORE</h2>
                  <p className="text-[11px] text-slate-500 font-medium">Authentic Kitchen Appliances</p>
                  <p className="text-[10px] text-slate-500 mt-1">Main Bazar, Opp. Nandkurba Hospital, Dhoraji - 360410</p>
                  <p className="text-[10px] text-slate-500">Support: +91 94282 82008</p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                    Tax Invoice
                  </span>
                  <p className="font-mono font-bold text-slate-900 text-sm mt-1">
                    INV-{new Date(invoiceOrder.createdAt).getFullYear()}-{invoiceOrder._id.substring(0, 6).toUpperCase()}
                  </p>
                  <p className="text-[10px] text-slate-500">Date: {new Date(invoiceOrder.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Bill To & Ship To */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Customer / Bill To:</span>
                  <p className="font-bold text-slate-900 mt-1">{invoiceOrder.customerName}</p>
                  <p className="text-slate-600">{invoiceOrder.customerEmail}</p>
                  <p className="text-slate-600">{invoiceOrder.customerPhone || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Delivery Destination:</span>
                  <p className="font-bold text-slate-900 mt-1">{invoiceOrder.shippingAddress?.street}</p>
                  <p className="text-slate-600">
                    {invoiceOrder.shippingAddress?.city}, {invoiceOrder.shippingAddress?.state} - {invoiceOrder.shippingAddress?.postalCode}
                  </p>
                  <p className="text-slate-600">{invoiceOrder.shippingAddress?.country || 'India'}</p>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-2">SKU</th>
                    <th className="py-2.5 px-2 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  {invoiceOrder.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{item.name}</td>
                      <td className="py-2.5 px-2 font-mono text-[11px] text-slate-600">{item.SKU}</td>
                      <td className="py-2.5 px-2 text-center font-bold">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right">₹{item.price?.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right font-bold">₹{item.lineTotal?.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Financial Calculation */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>₹{invoiceOrder.subtotal?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Fee:</span>
                    <span>{invoiceOrder.shippingFee === 0 ? 'FREE' : `₹${invoiceOrder.shippingFee}`}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (5% Inclusive):</span>
                    <span>₹{(invoiceOrder.tax || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-black text-slate-900 text-sm pt-2 border-t border-slate-300">
                    <span>Total Amount Paid:</span>
                    <span className="text-blue-700">₹{invoiceOrder.totalAmount?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-200 flex justify-between items-end text-[10px] text-slate-400">
                <div>
                  <p className="font-bold text-slate-600">Payment: {invoiceOrder.paymentMethod} ({invoiceOrder.paymentStatus})</p>
                  <p>Thank you for choosing Kirti Store appliances. All products carry standard manufacturer warranty.</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">Authorized Signatory</p>
                  <p className="mt-4 border-t border-slate-300 pt-1">Kirti Store Logistics Hub</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 7. MODAL: RTO RISK ASSESSMENT & WHATSAPP ADDRESS VERIFICATION */}
      {rtoModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg ${
                  rtoModalOrder.rtoRisk?.addressVerified ? 'bg-emerald-600 shadow-emerald-500/20' :
                  rtoModalOrder.rtoRisk?.riskLevel === 'HIGH' ? 'bg-rose-600 shadow-rose-500/20 animate-pulse' :
                  rtoModalOrder.rtoRisk?.riskLevel === 'MEDIUM' ? 'bg-amber-600 shadow-amber-500/20' : 
                  'bg-blue-600 shadow-blue-500/20'
                }`}>
                  {rtoModalOrder.rtoRisk?.addressVerified ? (
                    <ShieldCheck className="w-5 h-5 text-white" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-white text-base">RTO Risk Assessment & Verification</h3>
                    <span className="text-xs font-mono text-slate-400">
                      #{rtoModalOrder._id.slice(-8).toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Pre-dispatch delivery confidence score & WhatsApp address confirmation workflow
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRtoModalOrder(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score & Risk Level Banner */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              rtoModalOrder.rtoRisk?.addressVerified ? 'bg-emerald-500/10 border-emerald-500/30' :
              rtoModalOrder.rtoRisk?.riskLevel === 'HIGH' ? 'bg-rose-500/15 border-rose-500/40' :
              rtoModalOrder.rtoRisk?.riskLevel === 'MEDIUM' ? 'bg-amber-500/15 border-amber-500/30' :
              'bg-blue-500/10 border-blue-500/20'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide ${
                    rtoModalOrder.rtoRisk?.addressVerified ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40' :
                    rtoModalOrder.rtoRisk?.riskLevel === 'HIGH' ? 'bg-rose-500/30 text-rose-200 border border-rose-500/50 animate-pulse' :
                    rtoModalOrder.rtoRisk?.riskLevel === 'MEDIUM' ? 'bg-amber-500/25 text-amber-200 border border-amber-500/40' :
                    'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {rtoModalOrder.rtoRisk?.addressVerified 
                      ? 'VERIFIED ADDRESS (DISPATCH READY)' 
                      : `${rtoModalOrder.rtoRisk?.riskLevel || 'LOW'} RTO RISK`}
                  </span>
                  <span className="text-xs text-slate-400">
                    Payment: <strong className="text-white">{rtoModalOrder.paymentMethod}</strong> ({rtoModalOrder.paymentStatus})
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  {rtoModalOrder.rtoRisk?.addressVerified 
                    ? `Confirmed by ${rtoModalOrder.rtoRisk.verifiedBy || 'Admin'} on ${new Date(rtoModalOrder.rtoRisk.verifiedAt || Date.now()).toLocaleDateString('en-IN')}`
                    : rtoModalOrder.rtoRisk?.riskLevel === 'HIGH'
                    ? 'High probability of courier return due to incomplete street details or remote logistics hub.'
                    : rtoModalOrder.rtoRisk?.riskLevel === 'MEDIUM'
                    ? 'Moderate risk. Address may lack house/flat number or landmark.'
                    : 'Standard logistics risk profile. Address appears complete.'}
                </p>
              </div>

              {/* Numerical Score Gauge */}
              <div className="flex items-center gap-3 bg-slate-950/60 px-4 py-2 rounded-2xl border border-slate-800/80">
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">RTO Score</span>
                  <span className={`text-xl font-black ${
                    rtoModalOrder.rtoRisk?.addressVerified ? 'text-emerald-400' :
                    rtoModalOrder.rtoRisk?.riskLevel === 'HIGH' ? 'text-rose-400' :
                    rtoModalOrder.rtoRisk?.riskLevel === 'MEDIUM' ? 'text-amber-400' :
                    'text-blue-400'
                  }`}>
                    {rtoModalOrder.rtoRisk?.riskScore || 15}
                    <span className="text-xs font-normal text-slate-500">/100</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Address Inspection Card */}
            <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-secondary" />
                  Delivery Destination on File
                </h4>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${rtoModalOrder.customerPhone || rtoModalOrder.shippingAddress?.phone || ''}`}
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call Customer</span>
                  </a>
                </div>
              </div>

              <div className="text-xs space-y-1.5 text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <p className="font-bold text-white">
                  {rtoModalOrder.shippingAddress?.name || rtoModalOrder.customerName || 'Customer'} 
                  <span className="font-mono text-slate-400 font-normal ml-2">
                    ({rtoModalOrder.customerPhone || rtoModalOrder.shippingAddress?.phone || 'No phone'})
                  </span>
                </p>
                <p className="text-slate-200">
                  <strong className="text-slate-400">Street / Locality:</strong> {rtoModalOrder.shippingAddress?.street || 'Not specified'}
                </p>
                {rtoModalOrder.shippingAddress?.landmark && (
                  <p className="text-slate-200">
                    <strong className="text-slate-400">Landmark:</strong> {rtoModalOrder.shippingAddress.landmark}
                  </p>
                )}
                <p className="text-slate-400">
                  {rtoModalOrder.shippingAddress?.city}, {rtoModalOrder.shippingAddress?.state} — <strong className="text-white font-mono">{rtoModalOrder.shippingAddress?.pincode}</strong>
                </p>
              </div>

              {/* Address Quality Checklist */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                <div className={`p-2 rounded-xl border ${
                  /\b(flat|house|h\.no|door|plot|villa|apt|room|floor|#|\d+)\b/i.test(rtoModalOrder.shippingAddress?.street || '')
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                }`}>
                  <span className="block font-bold">House / Flat #</span>
                  <span>{/\b(flat|house|h\.no|door|plot|villa|apt|room|floor|#|\d+)\b/i.test(rtoModalOrder.shippingAddress?.street || '') ? '✓ Present' : '✗ Missing'}</span>
                </div>

                <div className={`p-2 rounded-xl border ${
                  Boolean(rtoModalOrder.shippingAddress?.landmark)
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                }`}>
                  <span className="block font-bold">Landmark</span>
                  <span>{rtoModalOrder.shippingAddress?.landmark ? '✓ Added' : '✗ No Landmark'}</span>
                </div>

                <div className={`p-2 rounded-xl border ${
                  (rtoModalOrder.shippingAddress?.street || '').length >= 25
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                }`}>
                  <span className="block font-bold">Address Detail</span>
                  <span>{(rtoModalOrder.shippingAddress?.street || '').length >= 25 ? '✓ Sufficient' : '✗ Too Short'}</span>
                </div>

                <div className={`p-2 rounded-xl border ${
                  ['Prepaid', 'Completed'].includes(rtoModalOrder.paymentStatus) || rtoModalOrder.paymentMethod === 'UPI'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                }`}>
                  <span className="block font-bold">Payment Intent</span>
                  <span>{rtoModalOrder.paymentMethod === 'COD' ? 'COD (Risky)' : 'Prepaid / UPI'}</span>
                </div>
              </div>
            </div>

            {/* Risk Flags Breakdown */}
            <div className="space-y-2">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center justify-between">
                <span>Detected Risk Indicators ({rtoModalOrder.rtoRisk?.flags?.length || 0})</span>
                <span className="text-[10px] text-slate-400 font-normal">Evaluated by automated logistics engine</span>
              </h4>

              {(!rtoModalOrder.rtoRisk?.flags || rtoModalOrder.rtoRisk.flags.length === 0) ? (
                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-slate-400 text-xs text-center">
                  No risk flags triggered. This order has a complete address and safe transit profile.
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {rtoModalOrder.rtoRisk.flags.map((flag, idx) => (
                    <div 
                      key={idx} 
                      className={`p-2.5 rounded-xl border flex items-start justify-between gap-3 text-xs ${
                        flag.severity === 'CRITICAL' ? 'bg-rose-500/10 border-rose-500/30' :
                        flag.severity === 'MEDIUM' ? 'bg-amber-500/10 border-amber-500/30' :
                        'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                            flag.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' :
                            flag.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {flag.severity}
                          </span>
                          <span className="font-bold text-white text-xs">{flag.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-300">{flag.description}</p>
                      </div>

                      <span className={`font-mono font-bold text-xs flex-shrink-0 ${
                        flag.penalty > 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {flag.penalty > 0 ? `+${flag.penalty}` : flag.penalty} pts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Section: WhatsApp Trigger & Admin Verification */}
            <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  WhatsApp Direct Address Confirmation
                </h4>
                <button
                  type="button"
                  onClick={() => handleSendRtoWhatsApp(rtoModalOrder)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Send WhatsApp Verification Message</span>
                </button>
              </div>

              <div className="space-y-2 pt-1">
                <label className="text-[11px] font-semibold text-slate-300 block">
                  Verification Notes / Customer Feedback:
                </label>
                <input
                  type="text"
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="e.g. Customer confirmed House #12, Near Hanuman Temple via WhatsApp chat"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-secondary"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                {rtoModalOrder.rtoRisk?.addressVerified ? (
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" />
                      Address verified by {rtoModalOrder.rtoRisk.verifiedBy || 'Admin'}
                    </span>
                    <button
                      type="button"
                      disabled={verifyingAddress}
                      onClick={() => handleVerifyAddress(rtoModalOrder._id, false, 'Address verification reset')}
                      className="text-[11px] text-slate-400 hover:text-rose-400 underline transition-colors cursor-pointer"
                    >
                      Reset verification
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Once customer confirms house & landmark on WhatsApp, click below to approve dispatch.
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRtoModalOrder(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  {!rtoModalOrder.rtoRisk?.addressVerified && (
                    <button
                      type="button"
                      disabled={verifyingAddress}
                      onClick={() => handleVerifyAddress(rtoModalOrder._id, true, verificationNotes)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{verifyingAddress ? 'Saving...' : 'Mark Address as Verified ✓'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 8. MODAL: PAYMENT SCREENSHOT FULL RESOLUTION VIEWER */}
      {viewingProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-secondary" />
                <h3 className="font-bold text-sm text-white">Customer Payment Screenshot Proof</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingProofUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto rounded-2xl bg-slate-950 flex items-center justify-center border border-slate-800 p-2">
              <img
                src={viewingProofUrl}
                alt="Payment Screenshot Proof"
                className="max-h-[65vh] max-w-full rounded-xl object-contain shadow-md"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Verified Customer Payment Proof</span>
              <div className="flex gap-2">
                <a
                  href={viewingProofUrl}
                  target="_blank"
                  rel="noreferrer"
                  download="customer-payment-screenshot.png"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Image</span>
                </a>
                <button
                  type="button"
                  onClick={() => setViewingProofUrl(null)}
                  className="px-4 py-1.5 bg-secondary hover:bg-secondary-600 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminOrders;
