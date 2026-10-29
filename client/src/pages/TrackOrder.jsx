import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Package, 
  Search, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  FileText, 
  ChevronRight, 
  Phone, 
  AlertCircle,
  ExternalLink,
  Download,
  Loader2,
  Image as ImageIcon,
  X,
  Share2,
  Copy,
  Check,
  MessageSquare,
  Zap,
  Sparkles,
  Award
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import TaxInvoiceModal from '../components/common/TaxInvoiceModal';
import { downloadInvoicePDF } from '../utils/invoiceGenerator';
import { openWhatsAppDirect } from '../utils/whatsappUtils';

const statusSteps = [
  { key: 'Confirmed', label: 'Order Confirmed', desc: 'Verified and authorized' },
  { key: 'Processing', label: 'Packed & Quality Tested', desc: 'Appliance sealed at Dhoraji Headquarters' },
  { key: 'Shipped', label: 'In Transit with Courier', desc: 'Dispatched via express logistics' },
  { key: 'Delivered', label: 'Delivered to Doorstep', desc: 'Handed over to customer' }
];

const TrackOrder = () => {
  const [searchParams] = useSearchParams();
  const urlOrderId = searchParams.get('orderId') || '';
  const { success: showSuccess, error: showError } = useToast();
  const { user } = useAuth();

  const [orderId, setOrderId] = useState(urlOrderId);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isMismatchError, setIsMismatchError] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [screenshotModalOpen, setScreenshotModalOpen] = useState(false);
  const [copiedAwb, setCopiedAwb] = useState(false);
  const [copiedOrderNo, setCopiedOrderNo] = useState(false);

  const handleDownloadInvoice = () => {
    if (!order) return;
    setDownloadingInvoice(true);
    try {
      downloadInvoicePDF(order);
      showSuccess('Official GST Tax Invoice downloaded successfully!');
    } catch (err) {
      console.error('Invoice download failed:', err);
      showError('Unable to generate PDF directly. Opening invoice preview.');
      setInvoiceModalOpen(true);
    } finally {
      setTimeout(() => setDownloadingInvoice(false), 700);
    }
  };

  const fetchTrackData = async (targetId, targetPhone) => {
    if (!targetId && !targetPhone) return;
    try {
      setLoading(true);
      setErrorMessage('');
      setIsMismatchError(false);
      const params = {};
      if (targetId) params.orderId = targetId;
      if (targetPhone) params.phone = targetPhone;

      const res = await api.get('/orders/track', { params });
      if (res.data.success) {
        setOrder(res.data.order);
      }
    } catch (err) {
      setOrder(null);
      const isMismatch = Boolean(err.response?.data?.mismatch);
      setIsMismatchError(isMismatch);
      setErrorMessage(
        err.response?.data?.message || 'Unable to locate order. Please check the Order ID and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlOrderId) {
      setOrderId(urlOrderId);
      fetchTrackData(urlOrderId, '');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [urlOrderId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!orderId.trim() && !phone.trim()) {
      showError('Please enter an Order ID or phone number.');
      return;
    }
    fetchTrackData(orderId.trim(), phone.trim());
  };

  const handleCopyOrderNo = (num) => {
    if (!num) return;
    navigator.clipboard.writeText(num);
    setCopiedOrderNo(true);
    showSuccess('Unique Order ID copied to clipboard!');
    setTimeout(() => setCopiedOrderNo(false), 2000);
  };

  const handleCopyAwb = (awb) => {
    if (!awb) return;
    navigator.clipboard.writeText(awb);
    setCopiedAwb(true);
    showSuccess('Courier AWB code copied to clipboard!');
    setTimeout(() => setCopiedAwb(false), 2000);
  };

  const handleShareTrackingWhatsApp = () => {
    if (!order) return;
    const url = window.location.href;
    const trackingId = order.orderNumber || `#${order._id?.toString()?.substring(0, 8)?.toUpperCase()}`;
    const text = `🚚 *Track My Kirti Store Appliance Order*
Order ID: ${trackingId}
Courier: ${order.courier || 'Blue Dart Express'} (AWB: ${order.trackingAwb || 'KRT983412IN'})
Current Status: ${order.orderStatus}
Shipment Link: ${url}`;
    openWhatsAppDirect(order.customerPhone || '919876543210', text);
  };

  // Determine active step index
  const getStepIndex = (status) => {
    switch (status) {
      case 'Confirmed':
        return 0;
      case 'Processing':
        return 1;
      case 'Shipped':
        return 2;
      case 'Delivered':
        return 3;
      default:
        return 1;
    }
  };

  const currentStepIdx = order ? getStepIndex(order.orderStatus) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 font-sans">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-charcoal-light">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-primary font-bold">Track Your Order</span>
      </nav>

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-secondary text-xs font-black uppercase tracking-wider mb-2">
          <Truck className="w-3.5 h-3.5 text-secondary" />
          <span>Official Logistics & Courier Tracking</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-primary tracking-tight">
          Shipment & Delivery Tracker
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-light max-w-xl mx-auto">
          Check verified courier packaging, AWB status, dispatch transit milestones, and estimated delivery dates for your Kirti kitchen appliances.
        </p>
      </div>

      {/* Search Tracker Input Card */}
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-surface-border p-6 shadow-sm space-y-4">
        {user && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50/80 border border-blue-100 text-xs text-secondary font-medium">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>
              Signed in as <strong className="text-primary">{user.name}</strong> ({user.phone || user.email}). Your orders are validated automatically.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                Unique Order ID / AWB Code
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g. KRT-ORD-213781-2309 or AWB"
                className="w-full px-4 py-2.5 bg-surface-muted rounded-xl border border-surface-border text-sm text-primary placeholder-charcoal-light focus:outline-none focus:ring-2 focus:ring-secondary/20 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                Registered Mobile Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9812345678"
                className="w-full px-4 py-2.5 bg-surface-muted rounded-xl border border-surface-border text-sm text-primary placeholder-charcoal-light focus:outline-none focus:ring-2 focus:ring-secondary/20 font-medium"
              />
              <span className="text-[10px] text-charcoal-light block mt-1">
                Enter registered phone number to verify ownership
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-zinc-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>{loading ? 'Verifying & Tracking...' : 'Track Appliance'}</span>
            </button>
          </div>
        </form>

        {errorMessage && (
          <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 transition-all ${
            isMismatchError
              ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isMismatchError ? 'bg-amber-200 text-amber-900' : 'bg-rose-100 text-rose-700'
            }`}>
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="font-bold text-xs uppercase tracking-wide">
                {isMismatchError ? 'Security Verification Mismatch' : 'Shipment Not Found'}
              </p>
              <p className="text-xs leading-relaxed font-medium">
                {errorMessage}
              </p>
              {isMismatchError && (
                <p className="text-[11px] opacity-80 pt-0.5">
                  Verification Rule: Every Order ID is strictly tied to a unique user and phone number. To protect customer privacy, both must match.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Tracking Details View */}
      {order && (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
          
          {/* 1. STATUS & COURIER BANNER */}
          <div className="bg-white rounded-3xl border border-surface-border p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-surface-border">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-charcoal-light uppercase tracking-wider">
                    Unique Order ID
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-secondary border border-blue-200">
                    {order.orderStatus}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <h2 className="text-xl sm:text-2xl font-black text-primary font-mono">
                    {order.orderNumber || `#${order._id?.toString()?.substring(0, 8)?.toUpperCase()}`}
                  </h2>
                  <button
                    type="button"
                    onClick={() => handleCopyOrderNo(order.orderNumber || order._id)}
                    className="p-1 text-slate-400 hover:text-secondary rounded-lg transition-colors cursor-pointer"
                    title="Copy Unique Order ID"
                  >
                    {copiedOrderNo ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-charcoal-light mt-0.5">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })} • Payment: <b className="text-primary">{order.paymentMethod} ({order.paymentStatus})</b>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleShareTrackingWhatsApp}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                  title="Share shipment tracking details on WhatsApp"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Share on WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadInvoice}
                  disabled={downloadingInvoice}
                  className="px-3.5 py-2 bg-secondary hover:bg-secondary-600 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                  title="Download GST Tax Invoice PDF"
                >
                  {downloadingInvoice ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Tax Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInvoiceModalOpen(true)}
                  className="px-3 py-2 bg-surface-muted hover:bg-surface-border text-charcoal rounded-xl text-xs font-bold flex items-center gap-1 transition-colors border border-surface-border cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-secondary" />
                  <span className="hidden sm:inline">Preview</span>
                </button>
              </div>
            </div>

            {/* Visual Stepper */}
            <div className="py-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                {statusSteps.map((step, idx) => {
                  const isCompleted = idx <= currentStepIdx;
                  const isCurrent = idx === currentStepIdx;

                  return (
                    <div key={step.key} className="flex flex-col items-start space-y-2">
                      <div className="flex items-center gap-2 w-full">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                            isCompleted
                              ? 'bg-secondary text-white shadow-md shadow-blue-500/20'
                              : 'bg-surface-muted text-charcoal-light border border-surface-border'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                        </div>
                        {idx < statusSteps.length - 1 && (
                          <div
                            className={`flex-1 h-1 rounded-full hidden md:block ${
                              idx < currentStepIdx ? 'bg-secondary' : 'bg-surface-muted'
                            }`}
                          />
                        )}
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${isCurrent ? 'text-secondary' : isCompleted ? 'text-primary' : 'text-charcoal-light'}`}>
                          {step.label}
                        </p>
                        <p className="text-[11px] text-charcoal-light leading-snug">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Courier Dispatch Summary Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-surface-muted/60 border border-surface-border text-xs">
              <div>
                <p className="text-charcoal-light font-medium">Logistics Partner</p>
                <p className="font-bold text-primary text-sm mt-0.5">{order.courier || 'Blue Dart Express'}</p>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                  <Zap className="w-3 h-3" /> Priority Air Express
                </span>
              </div>

              <div>
                <p className="text-charcoal-light font-medium">AWB Tracking Code</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-bold text-primary text-sm">
                    {order.trackingAwb || 'KRT983412IN'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyAwb(order.trackingAwb || 'KRT983412IN')}
                    className="text-slate-400 hover:text-primary transition-colors p-0.5"
                    title="Copy AWB tracking code"
                  >
                    {copiedAwb ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="text-[10px] text-secondary font-semibold">Official Courier Consignment</span>
              </div>

              <div>
                <p className="text-charcoal-light font-medium">Estimated Delivery</p>
                <p className="font-bold text-emerald-700 text-sm mt-0.5">
                  {order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  }) : 'Within 2-3 Business Days'}
                </p>
                <span className="text-[10px] text-charcoal-light">Insured Doorstep Dropoff</span>
              </div>
            </div>
          </div>

          {/* 2. VERIFIED SHIPMENT CHECKPOINT TIMELINE */}
          <div className="bg-white rounded-3xl border border-surface-border p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div>
                <h3 className="font-bold text-base text-primary uppercase tracking-wider">
                  Shipment Milestones & Transit History
                </h3>
                <p className="text-xs text-charcoal-light mt-0.5">
                  Step-by-step verified courier scanning records from warehouse dispatch to destination.
                </p>
              </div>
              <span className="text-xs font-bold text-secondary bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                Verified Logistics
              </span>
            </div>

            <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-surface-border">
              {(order.checkpoints || []).map((cp, idx) => {
                const isDone = cp.status === 'completed';
                const isInTransit = cp.status === 'in-transit';

                return (
                  <div key={cp.id || idx} className="relative flex items-start gap-4">
                    {/* Timeline Node Dot */}
                    <div
                      className={`absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] transition-all ${
                        isDone
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                          : isInTransit
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse'
                          : 'bg-white border-2 border-slate-300 text-slate-400'
                      }`}
                    >
                      {isDone ? <Check className="w-3.5 h-3.5" /> : isInTransit ? <Truck className="w-3 h-3" /> : idx + 1}
                    </div>

                    <div className="flex-1 bg-surface-muted/40 p-4 rounded-2xl border border-surface-border/80">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                        <span className={`font-bold text-sm ${isDone ? 'text-primary' : isInTransit ? 'text-secondary' : 'text-charcoal-light'}`}>
                          {cp.title}
                        </span>
                        <span className="text-[11px] font-mono text-charcoal-light font-medium">
                          {cp.time}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-charcoal flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                        <span>{cp.location}</span>
                      </p>
                      {cp.details && (
                        <p className="text-[11px] text-charcoal-light mt-1.5 pt-1.5 border-t border-surface-border/60">
                          {cp.details}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. APPLIANCE PACKAGE CONTENTS & ADDRESS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Package Contents */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-surface-border p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-primary uppercase tracking-wider pb-2 border-b border-surface-border">
                Appliance Package Contents ({order.items?.length || 0})
              </h3>
              <div className="divide-y divide-surface-border">
                {(order.items || []).map((item, i) => (
                  <div key={i} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=150&q=80'}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover border border-surface-border flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-primary truncate">{item.name}</p>
                      <p className="text-[11px] text-charcoal-light">SKU: {item.SKU} | Qty: {item.quantity}</p>
                      <p className="text-xs font-bold text-secondary mt-1">
                        ₹{(item.lineTotal || item.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-surface-border space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-charcoal-light font-medium">Payment Mode</span>
                  <span className="font-bold text-primary">{order.paymentMethod} ({order.paymentStatus})</span>
                </div>
                {(order.upiTransactionId || order.paymentScreenshot) && (
                  <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <ShieldCheck className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                      <span className="text-[11px] font-mono font-bold text-primary truncate">
                        {order.upiTransactionId ? `UTR: ${order.upiTransactionId}` : 'UPI Verified'}
                      </span>
                    </div>
                    {order.paymentScreenshot && (
                      <button
                        type="button"
                        onClick={() => setScreenshotModalOpen(true)}
                        className="text-[11px] font-bold text-secondary hover:underline flex items-center gap-1 flex-shrink-0 cursor-pointer"
                      >
                        <ImageIcon className="w-3 h-3" /> View Screenshot
                      </button>
                    )}
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-charcoal-light font-medium">Total Paid</span>
                  <span className="font-black text-base text-primary">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Destination Address */}
            <div className="bg-white rounded-3xl border border-surface-border p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-primary uppercase tracking-wider pb-2 border-b border-surface-border">
                Delivery Destination
              </h3>
              <div className="text-xs space-y-1.5 text-charcoal">
                <p className="font-bold text-primary">{order.customerName}</p>
                <p className="text-charcoal-light">{order.shippingAddress?.street}</p>
                {order.shippingAddress?.apartment && (
                  <p className="text-charcoal-light">{order.shippingAddress.apartment}</p>
                )}
                <p className="text-charcoal-light">
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
                </p>
                <p className="text-charcoal-light pt-2">Phone: {order.customerPhone || '—'}</p>
              </div>

              <div className="pt-4 border-t border-surface-border text-xs text-charcoal-light space-y-2">
                <p className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>2-Year Official Brand Warranty Included</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-charcoal-light" />
                  <span>Support: +91 94282 82008 (10AM-1PM & 3PM-8PM)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Screenshot Modal */}
          {screenshotModalOpen && order.paymentScreenshot && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
              <div className="bg-white rounded-3xl p-5 max-w-lg w-full space-y-4 shadow-2xl border border-surface-border">
                <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-secondary" />
                    <h3 className="font-bold text-sm text-primary">Payment Receipt Screenshot</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScreenshotModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-charcoal hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="max-h-[65vh] overflow-auto rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 p-2">
                  <img
                    src={order.paymentScreenshot}
                    alt="Payment Receipt"
                    className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-sm"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-charcoal-light pt-1">
                  <span>Order #{order._id?.substring(0, 8)} • Verified UPI Proof</span>
                  <div className="flex gap-2">
                    <a
                      href={order.paymentScreenshot}
                      target="_blank"
                      rel="noreferrer"
                      download="payment-screenshot.png"
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-charcoal font-semibold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" /> Download
                    </a>
                    <button
                      type="button"
                      onClick={() => setScreenshotModalOpen(false)}
                      className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tax Invoice Modal */}
          <TaxInvoiceModal
            order={order}
            isOpen={invoiceModalOpen}
            onClose={() => setInvoiceModalOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

export default TrackOrder;
