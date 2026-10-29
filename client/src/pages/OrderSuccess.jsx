import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Package,
  Truck,
  ArrowRight,
  ShieldCheck,
  Home,
  Download,
  Loader2,
  Image as ImageIcon,
  Eye,
  Hash,
  Copy,
  Check,
  UploadCloud,
  X,
  Edit3,
  Award,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import TaxInvoiceModal from '../components/common/TaxInvoiceModal';
import { downloadInvoicePDF } from '../utils/invoiceGenerator';
import { useToast } from '../context/ToastContext';

const OrderSuccess = () => {
  const { id } = useParams();
  const { success: showSuccess, error: showError } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Payment proof states
  const [screenshotModalOpen, setScreenshotModalOpen] = useState(false);
  const [copiedTxn, setCopiedTxn] = useState(false);
  const [editProofOpen, setEditProofOpen] = useState(false);
  const [txnIdInput, setTxnIdInput] = useState('');
  const [newScreenshotUrl, setNewScreenshotUrl] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [savingProof, setSavingProof] = useState(false);

  const handleCopyTxn = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedTxn(true);
    showSuccess('Transaction ID copied to clipboard!');
    setTimeout(() => setCopiedTxn(false), 2000);
  };

  const handleUploadScreenshot = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/i)) {
      showError('Please upload a valid image file (JPG, PNG, or WebP).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      showError('Screenshot size exceeds 15MB limit.');
      return;
    }

    try {
      setUploadingProof(true);
      const formData = new FormData();
      formData.append('screenshot', file);
      const res = await api.post('/upload/receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success && res.data.url) {
        setNewScreenshotUrl(res.data.url);
        showSuccess('Payment screenshot uploaded!');
      } else {
        throw new Error(res.data?.message || 'Upload failed');
      }
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Error uploading file');
    } finally {
      setUploadingProof(false);
    }
  };

  const handleSavePaymentProof = async (e) => {
    e.preventDefault();
    if (!txnIdInput.trim() && !newScreenshotUrl) {
      showError('Please provide a Transaction ID or upload a screenshot.');
      return;
    }

    try {
      setSavingProof(true);
      const res = await api.patch(`/orders/${order._id}/payment-proof`, {
        upiTransactionId: txnIdInput.trim() || undefined,
        paymentScreenshot: newScreenshotUrl || undefined
      });

      if (res.data?.success) {
        setOrder(res.data.order);
        setEditProofOpen(false);
        showSuccess('Payment proof updated successfully!');
      }
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Failed to update payment proof.');
    } finally {
      setSavingProof(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!order) return;
    setDownloading(true);
    try {
      downloadInvoicePDF(order);
      showSuccess('Official GST Tax Invoice downloaded successfully!');
    } catch (err) {
      console.error(err);
      showError('Could not download PDF. Opening invoice preview.');
      setInvoiceOpen(true);
    } finally {
      setTimeout(() => setDownloading(false), 700);
    }
  };

  useEffect(() => {
    // Confetti blast!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/orders/${id}`);
        if (res.data.success) {
          setOrder(res.data.order);
          setTxnIdInput(res.data.order.upiTransactionId || '');
          setNewScreenshotUrl(res.data.order.paymentScreenshot || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 flex justify-center">
        <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-primary">Order Not Found</h2>
        <p className="text-xs text-charcoal-light">
          We couldn't retrieve the details for order #{id}. It may have expired or the order ID is invalid.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Link to="/track-order" className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary-600 text-white text-xs font-bold transition-colors">
            Track Shipment
          </Link>
          <Link to="/shop" className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-charcoal text-xs font-bold transition-colors">
            Return to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-8">
      
      {/* Celebration Header */}
      <div className="text-center space-y-3">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-primary">Thank You for Your Order!</h1>
        <p className="text-sm text-charcoal-light max-w-md mx-auto">
          Your order has been placed successfully and is now being prepared for express dispatch.
        </p>
        <p className="text-xs font-mono font-bold bg-white px-4 py-2 rounded-full inline-block border border-surface-border text-charcoal">
          Order ID: #{order?._id}
        </p>
      </div>

      {/* Order Card */}
      <div className="bg-white rounded-3xl border border-surface-border p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-border gap-2">
          <div>
            <h3 className="text-base font-bold text-primary">Order Status: {order?.orderStatus}</h3>
            <p className="text-xs text-charcoal-light">
              Payment Method: {order?.paymentMethod} ({order?.paymentStatus})
            </p>
          </div>
          <span className="text-xl font-black text-secondary">
            Total: ₹{order?.totalAmount?.toLocaleString('en-IN')}
          </span>
        </div>

        {/* UPI Payment Proof & Verification Details */}
        <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-primary text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-secondary" />
              <span>UPI Payment Proof & Verification</span>
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {order?.upiTransactionId || order?.paymentScreenshot ? 'Proof Recorded' : 'Verified UPI Checkout'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Transaction ID */}
            <div className="bg-white p-3 rounded-xl border border-sky-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-charcoal-light flex items-center gap-1">
                <Hash className="w-3 h-3 text-secondary" />
                <span>UPI Transaction ID / UTR</span>
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-sm text-primary">
                  {order?.upiTransactionId || order?.paymentId || 'N/A'}
                </span>
                {(order?.upiTransactionId || order?.paymentId) && (
                  <button
                    type="button"
                    onClick={() => handleCopyTxn(order?.upiTransactionId || order?.paymentId)}
                    className="p-1 text-slate-400 hover:text-secondary rounded transition-colors"
                    title="Copy Transaction ID"
                  >
                    {copiedTxn ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>

            {/* Payment Screenshot */}
            <div className="bg-white p-3 rounded-xl border border-sky-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-charcoal-light flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-secondary" />
                <span>Payment Screenshot Proof</span>
              </span>
              {order?.paymentScreenshot ? (
                <div className="flex items-center justify-between pt-0.5">
                  <div 
                    className="flex items-center gap-2 cursor-pointer group"
                    onClick={() => setScreenshotModalOpen(true)}
                  >
                    <img
                      src={order.paymentScreenshot}
                      alt="Proof"
                      className="w-8 h-8 rounded-lg object-cover border border-slate-200 group-hover:opacity-80 transition-opacity"
                    />
                    <span className="text-xs font-bold text-secondary group-hover:underline flex items-center gap-1">
                      <Eye className="w-3 h-3" /> View Screenshot
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Attached ✓
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-charcoal-light text-[11px] italic">No screenshot attached yet</span>
                  <button
                    type="button"
                    onClick={() => setEditProofOpen(true)}
                    className="text-xs font-bold text-secondary hover:underline flex items-center gap-1"
                  >
                    <UploadCloud className="w-3 h-3" /> + Upload
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick link to update or add proof */}
          {!editProofOpen && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setEditProofOpen(true)}
                className="text-[11px] font-bold text-secondary hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>{order?.upiTransactionId || order?.paymentScreenshot ? 'Update / Change Payment Proof' : 'Attach Screenshot & Txn ID'}</span>
              </button>
            </div>
          )}

          {/* Expandable proof editor */}
          {editProofOpen && (
            <form onSubmit={handleSavePaymentProof} className="pt-3 border-t border-sky-200/60 space-y-3 bg-white p-3.5 rounded-xl border">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-xs text-primary">Update Payment Proof</h5>
                <button
                  type="button"
                  onClick={() => setEditProofOpen(false)}
                  className="text-slate-400 hover:text-charcoal text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-charcoal block mb-1">
                    UPI Transaction ID / UTR
                  </label>
                  <input
                    type="text"
                    value={txnIdInput}
                    onChange={(e) => setTxnIdInput(e.target.value)}
                    placeholder="e.g. 410294829104"
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-surface-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-secondary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-charcoal block mb-1">
                    Upload New Screenshot
                  </label>
                  <label className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadScreenshot}
                      className="hidden"
                    />
                    <UploadCloud className="w-3.5 h-3.5 text-secondary" />
                    <span className="truncate text-[11px] font-medium text-charcoal">
                      {uploadingProof ? 'Uploading...' : newScreenshotUrl ? 'Screenshot Ready ✓' : 'Choose screenshot'}
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditProofOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-charcoal-light hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProof || uploadingProof}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-secondary hover:bg-secondary-600 text-white transition-colors disabled:opacity-50"
                >
                  {savingProof ? 'Saving...' : 'Save Proof'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Shipping Destination */}
        <div className="p-4 rounded-2xl bg-surface-bg border border-surface-border text-xs space-y-1">
          <h4 className="font-bold text-primary flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-secondary" />
            Shipping Address
          </h4>
          <p className="text-charcoal font-medium">
            {order?.shippingAddress?.street}, {order?.shippingAddress?.apartment && `${order?.shippingAddress?.apartment}, `}
            {order?.shippingAddress?.city}, {order?.shippingAddress?.state} - {order?.shippingAddress?.postalCode}
          </p>
          <p className="text-charcoal-light">Recipient: {order?.customerName} ({order?.customerPhone})</p>
        </div>

        {/* Purchased Items */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-light">
            Purchased Appliances
          </h4>
          <div className="divide-y divide-surface-border">
            {order?.items?.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover border border-surface-border"
                  />
                  <div>
                    <p className="font-bold text-primary">{item.name}</p>
                    <p className="text-charcoal-light">Qty: {item.quantity} × ₹{item.price}</p>
                  </div>
                </div>
                <span className="font-bold text-primary">
                  ₹{item.lineTotal?.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Digital Warranty Registration Callout */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-white to-amber-50/60 border border-amber-200/80 text-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-950 text-sm">2-Year Official Brand Warranty</span>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">Included Free</span>
              </div>
              <p className="text-charcoal-light mt-0.5">
                Register your kitchen appliance serial numbers to download your official Digital Warranty Certificate and unlock 48-hour doorstep service.
              </p>
            </div>
          </div>
          <Link
            to={`/warranty-registration?orderId=${order?._id}&phone=${encodeURIComponent(order?.customerPhone || '')}&model=${encodeURIComponent(order?.items?.[0]?.name || '')}`}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs whitespace-nowrap shadow-sm transition-all flex items-center gap-1.5 flex-shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Activate Digital Warranty</span>
          </Link>
        </div>

        {/* Action navigation */}
        <div className="pt-6 border-t border-surface-border flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={`/track-order?orderId=${order?._id}`}
            className="px-6 py-3 rounded-xl bg-secondary hover:bg-secondary-600 text-white font-bold text-sm text-center shadow transition-colors flex items-center justify-center gap-2"
          >
            <Truck className="w-4 h-4" />
            <span>Live Shipment Tracker</span>
          </Link>
          <button
            type="button"
            onClick={handleDownloadInvoice}
            disabled={downloading}
            className="px-6 py-3 rounded-xl bg-white border border-surface-border hover:bg-surface-muted text-primary font-bold text-sm text-center shadow-sm transition-colors flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin text-secondary" />
            ) : (
              <Download className="w-4 h-4 text-secondary" />
            )}
            <span>{downloading ? 'Downloading...' : 'Download Tax Invoice'}</span>
          </button>
          <button
            type="button"
            onClick={() => setInvoiceOpen(true)}
            className="px-4 py-3 rounded-xl bg-surface-muted hover:bg-surface-border text-charcoal font-bold text-xs text-center transition-colors flex items-center justify-center gap-1.5"
            title="Preview or print invoice"
          >
            <Package className="w-3.5 h-3.5 text-secondary" />
            <span>View / Print</span>
          </button>
          <Link
            to="/shop"
            className="px-6 py-3 rounded-xl bg-surface-muted hover:bg-slate-200 text-charcoal font-bold text-sm text-center transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>

      {/* Screenshot Lightbox Modal */}
      {screenshotModalOpen && order?.paymentScreenshot && (
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
                className="p-1 rounded-lg text-slate-400 hover:text-charcoal hover:bg-slate-100 transition-colors"
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
              <span>Order #{order._id?.substring(0, 8)} • UPI Proof</span>
              <div className="flex gap-2">
                <a
                  href={order.paymentScreenshot}
                  target="_blank"
                  rel="noreferrer"
                  download="payment-screenshot.png"
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-charcoal font-semibold rounded-xl text-xs transition-colors flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Download
                </a>
                <button
                  type="button"
                  onClick={() => setScreenshotModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
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
        isOpen={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
      />

    </div>
  );
};

export default OrderSuccess;
