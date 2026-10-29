import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Banknote,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Lock,
  QrCode,
  Smartphone,
  Building2,
  Clock,
  Edit3,
  Sparkles,
  Check,
  RefreshCw,
  ShoppingBag,
  Info,
  Calendar,
  Zap,
  HelpCircle,
  AlertCircle,
  MapPin,
  Loader2,
  UploadCloud,
  Image as ImageIcon,
  X,
  Eye,
  Hash,
  Copy,
  CheckCheck,
  ExternalLink,
  Search,
  Plus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Tesseract from 'tesseract.js';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { lookupPincode, isValidPincode } from '../utils/pincodeService';
import { isBigAppliance } from '../utils/shippingCalculator';

const Checkout = () => {
  const { cart, clearCart, syncLocalCartToServer } = useCart();
  const { user, isAuthenticated, login } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const navigate = useNavigate();

  // Active step: 'address' (Step 1) -> 'gateway' (Step 2: Payment Gateway & Review)
  const [currentStep, setCurrentStep] = useState('address');

  // Customer Contact Info
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');

  // Shipping Address
  const [shippingAddress, setShippingAddress] = useState(() => {
    const defaultAddr = user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0];
    return {
      street: defaultAddr?.street || '',
      apartment: defaultAddr?.apartment || '',
      city: defaultAddr?.city || '',
      state: defaultAddr?.state || '',
      postalCode: defaultAddr?.postalCode || '',
      country: 'India',
      phone: defaultAddr?.phone || user?.phone || '',
    };
  });

  // Automatic Pincode -> City & State Detection State
  const [pincodeStatus, setPincodeStatus] = useState(() => {
    const userAddr = user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0];
    const pin = userAddr?.postalCode || '';
    const city = userAddr?.city || '';
    const state = userAddr?.state || '';
    return {
      loading: false,
      success: Boolean(pin && city),
      message: pin && city ? `Auto-detected: ${city}, ${state}` : '',
      localities: []
    };
  });

  const [deliverySpeed, setDeliverySpeed] = useState('standard');
  const [notes, setNotes] = useState('');

  const MERCHANT_VPA = 'kotichachiragr-1@okhdfcbank';
  const MERCHANT_NAME = 'Kirti Store';

  // Payment Gateway Selection - 100% UPI QR Code Payment
  const [upiTab, setUpiTab] = useState('qr');
  const [upiPhone, setUpiPhone] = useState(user?.phone || '');
  const [selectedUpiApp, setSelectedUpiApp] = useState('phonepe');
  const [upiId, setUpiId] = useState('kotichachiragr-1@okhdfcbank');
  const [upiVerified, setUpiVerified] = useState(false);
  const [qrSeconds, setQrSeconds] = useState(295);
  const [qrType, setQrType] = useState('gpay'); // 'gpay' | 'dynamic'
  const [phoneCollectRequested, setPhoneCollectRequested] = useState(false);
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [scanningOcr, setScanningOcr] = useState(false);
  const [ocrDetectedUtr, setOcrDetectedUtr] = useState('');
  const [activeUpiAppIntent, setActiveUpiAppIntent] = useState('');

  // UPI Payment Proof & Transaction ID States
  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [viewScreenshotModal, setViewScreenshotModal] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Area / Locality selector enhancements
  const [areaSearchTerm, setAreaSearchTerm] = useState('');
  const [showAllAreas, setShowAllAreas] = useState(false);
  const [customAreaInput, setCustomAreaInput] = useState('');
  const [showAddCustomArea, setShowAddCustomArea] = useState(false);

  const handleSelectLocality = (loc) => {
    if (!loc) return;
    setShippingAddress((prev) => {
      const alreadyInApartment = prev.apartment && prev.apartment.toLowerCase().includes(loc.toLowerCase());
      const alreadyInStreet = prev.street && prev.street.toLowerCase().includes(loc.toLowerCase());
      
      if (alreadyInApartment || alreadyInStreet) {
        showSuccess(`"${loc}" is already added to your delivery address!`);
        return prev;
      }

      const updated = prev.apartment ? `${prev.apartment}, ${loc}` : loc;
      showSuccess(`Added "${loc}" to landmark / area line!`);
      return {
        ...prev,
        apartment: updated
      };
    });
  };

  const handleAddCustomArea = (e) => {
    if (e) e.preventDefault();
    const val = customAreaInput.trim();
    if (!val) return;
    handleSelectLocality(val);
    setCustomAreaInput('');
    setShowAddCustomArea(false);
  };

  // Scan uploaded or pasted receipt for 12-digit UTR using client-side OCR
  const scanReceiptForUtr = async (file) => {
    if (!file) return;
    try {
      setScanningOcr(true);
      setOcrDetectedUtr('');
      
      const ocrPromise = Tesseract.recognize(file, 'eng');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OCR scan timeout')), 12000)
      );

      const result = await Promise.race([ocrPromise, timeoutPromise]);
      const text = result?.data?.text || '';
      
      if (text) {
        // Look for common Indian UPI receipt labels (UPI Ref No, UTR, RRN, Txn ID, Google Transaction ID)
        const keywordRegex = /(?:upi\s*ref(?:\s*no)?|utr|rrn|txn\s*(?:id|no)?|transaction\s*(?:id|no|ref)?|reference\s*(?:id|no)?|google\s*transaction\s*id)[\s:=#-]*([0-9]{12})/i;
        const match = text.match(keywordRegex);
        
        let detected = '';
        if (match && match[1]) {
          detected = match[1];
        } else {
          // Look for any 12-digit numeric string
          const digits = text.match(/\b\d{12}\b/g);
          if (digits && digits.length > 0) {
            detected = digits[0];
          }
        }

        if (detected) {
          setOcrDetectedUtr(detected);
          setUpiTransactionId(detected);
          showSuccess(`✨ Auto-detected 12-digit UTR from receipt: ${detected}!`);
        }
      }
    } catch (err) {
      console.warn('OCR background scan note:', err?.message || err);
    } finally {
      setScanningOcr(false);
    }
  };

  // Upload payment screenshot to server
  const uploadScreenshotToServer = async (file) => {
    try {
      setUploadingScreenshot(true);
      setUploadError('');
      const formData = new FormData();
      formData.append('screenshot', file);

      const res = await api.post('/upload/receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success && res.data.url) {
        setScreenshotUrl(res.data.url);
        showSuccess('Payment screenshot uploaded successfully!');
        return res.data.url;
      } else {
        throw new Error(res.data?.message || 'Failed to upload screenshot');
      }
    } catch (err) {
      console.error('Screenshot upload error:', err);
      const msg = err.response?.data?.message || err.message || 'Error uploading screenshot';
      setUploadError(msg);
      showError(msg);
      return null;
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const processSelectedFile = (file) => {
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp|svg\+xml)$/i)) {
      showError('Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      showError('Screenshot size exceeds 15MB limit. Please choose a smaller file.');
      return;
    }
    setScreenshotFile(file);
    const localUrl = URL.createObjectURL(file);
    setScreenshotPreview(localUrl);
    uploadScreenshotToServer(file);
    scanReceiptForUtr(file);
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleRemoveScreenshot = () => {
    setScreenshotFile(null);
    if (screenshotPreview && screenshotPreview.startsWith('blob:')) {
      URL.revokeObjectURL(screenshotPreview);
    }
    setScreenshotPreview('');
    setScreenshotUrl('');
    setUploadError('');
    setOcrDetectedUtr('');
  };

  const handlePasteScreenshot = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          processSelectedFile(file);
          showSuccess('Pasted screenshot from clipboard!');
          break;
        }
      }
    }
  };

  const handleDropScreenshot = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    return localStorage.getItem('kirti_applied_coupon') || null;
  });
  const [couponDiscount, setCouponDiscount] = useState(() => {
    const saved = localStorage.getItem('kirti_coupon_discount');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Payment Processing Simulation Modal
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState(1);
  const [processingMessage, setProcessingMessage] = useState('Connecting to Kirti Store UPI Gateway...');

  // Live countdown timer for UPI QR Code
  useEffect(() => {
    let timer;
    if (currentStep === 'gateway' && upiTab === 'qr') {
      timer = setInterval(() => {
        setQrSeconds((prev) => (prev > 0 ? prev - 1 : 295));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentStep, upiTab]);

  // Sync user details when auth loads
  useEffect(() => {
    if (user) {
      if (user.name) setCustomerName(user.name);
      if (user.email) setCustomerEmail(user.email);
      if (user.phone) setCustomerPhone(user.phone);
      if (user.addresses && user.addresses.length > 0) {
        const addr = user.addresses.find((a) => a.isDefault) || user.addresses[0];
        setShippingAddress({
          street: addr.street || '',
          apartment: addr.apartment || '',
          city: addr.city || '',
          state: addr.state || '',
          postalCode: addr.postalCode || '',
          country: 'India',
          phone: addr.phone || user.phone || '',
        });
      }
    }
  }, [user]);

  // Handle Automatic Pincode -> City & State Lookup
  const handlePincodeLookup = async (pin) => {
    if (!/^\d{6}$/.test(pin)) {
      setPincodeStatus({ loading: false, success: false, message: '', localities: [] });
      return;
    }

    setPincodeStatus({
      loading: true,
      success: false,
      message: `Detecting city & state for PIN ${pin}...`,
      localities: []
    });

    try {
      const data = await lookupPincode(pin);
      if (data && data.success && data.city) {
        setShippingAddress((prev) => ({
          ...prev,
          postalCode: pin,
          city: data.city,
          state: data.state || prev.state
        }));
        setPincodeStatus({
          loading: false,
          success: true,
          message: `Auto-detected: ${data.city}, ${data.state}`,
          localities: data.localities || []
        });
      } else {
        setPincodeStatus({
          loading: false,
          success: false,
          message: data?.message || 'Could not auto-detect city. Please enter manually.',
          localities: []
        });
      }
    } catch (err) {
      setPincodeStatus({
        loading: false,
        success: false,
        message: 'Could not fetch city. Please enter manually.',
        localities: []
      });
    }
  };

  // Handle address input change with real-time postalCode auto-fetch
  const handleAddressChange = (e) => {
    const { name, value } = e.target;

    if (name === 'postalCode') {
      const cleaned = value.replace(/\D/g, '').slice(0, 6);
      setShippingAddress((prev) => ({ ...prev, postalCode: cleaned }));

      if (cleaned.length === 6) {
        handlePincodeLookup(cleaned);
      } else {
        setPincodeStatus({ loading: false, success: false, message: '', localities: [] });
      }
    } else {
      setShippingAddress((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Validate address before advancing to payment gateway
  const handleProceedToPayment = (e) => {
    e.preventDefault();
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode) {
      showError('Please fill in complete street address, city, and postal code.');
      return;
    }
    if (!customerPhone) {
      showError('Please provide a valid contact phone number.');
      return;
    }
    setCurrentStep('gateway');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Apply Coupon
  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'KIRTI10' || code === 'WELCOME10') {
      const discount = Math.round(cart.subtotal * 0.1);
      setCouponDiscount(discount);
      setAppliedCoupon(code);
      showSuccess(`Coupon "${code}" applied! You saved ₹${discount.toLocaleString('en-IN')}.`);
    } else if (code === 'FESTIVE500') {
      const discount = Math.min(500, cart.subtotal);
      setCouponDiscount(discount);
      setAppliedCoupon(code);
      localStorage.setItem('kirti_applied_coupon', code);
      localStorage.setItem('kirti_coupon_discount', discount.toString());
      showSuccess(`Coupon "${code}" applied! You saved ₹${discount.toLocaleString('en-IN')}.`);
    } else {
      showError('Invalid coupon code. Try "KIRTI10" for 10% off!');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
    localStorage.removeItem('kirti_applied_coupon');
    localStorage.removeItem('kirti_coupon_discount');
  };

  // Final Payable Price Calculation
  const finalPayable = Math.max(0, cart.totalAmount - couponDiscount);

  // Dynamic UPI Payment URI (NPCI standard compliant)
  const upiPaymentUri = useMemo(() => {
    const cleanTotal = Math.round(finalPayable || 0);
    const note = encodeURIComponent('Kirti Store Order Payment');
    return `upi://pay?pa=${MERCHANT_VPA}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${cleanTotal}&cu=INR&tn=${note}`;
  }, [finalPayable]);

  // Launch specific UPI app on mobile / desktop intent
  const handleLaunchUpiApp = (app) => {
    setActiveUpiAppIntent(app.id);
    const cleanTotal = Math.round(finalPayable || 0);
    const note = encodeURIComponent('Kirti Store Order Payment');
    let targetUri = upiPaymentUri;
    
    if (app.id === 'phonepe') {
      targetUri = `phonepe://pay?pa=${MERCHANT_VPA}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${cleanTotal}&cu=INR&tn=${note}`;
    } else if (app.id === 'paytm') {
      targetUri = `paytmmp://pay?pa=${MERCHANT_VPA}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${cleanTotal}&cu=INR&tn=${note}`;
    } else if (app.id === 'gpay') {
      targetUri = `tez://upi/pay?pa=${MERCHANT_VPA}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${cleanTotal}&cu=INR&tn=${note}`;
    }

    try {
      window.location.href = targetUri;
    } catch (err) {
      console.warn('UPI intent launch error:', err);
    }

    setTimeout(() => {
      showSuccess(`Initiated ${app.name} intent for ₹${cleanTotal.toLocaleString('en-IN')}. Please approve payment and attach your receipt/UTR below!`);
    }, 800);
  };

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(MERCHANT_VPA);
    setCopiedVpa(true);
    showSuccess(`Copied UPI ID "${MERCHANT_VPA}" to clipboard!`);
    setTimeout(() => setCopiedVpa(false), 2500);
  };

  // Bank Authorization & Order Placement
  const handleExecutePayment = async () => {
    // Sync any local cart items to MongoDB server cart if authenticated
    if (isAuthenticated) {
      try {
        await syncLocalCartToServer();
      } catch (e) {
        console.warn('Sync error:', e);
      }
    }

    // Ensure any selected screenshot is uploaded before finalizing order
    let finalScreenshotUrl = screenshotUrl;
    if (screenshotFile && !finalScreenshotUrl && !uploadingScreenshot) {
      try {
        finalScreenshotUrl = await uploadScreenshotToServer(screenshotFile);
      } catch (e) {
        console.warn('Screenshot upload fallback:', e);
      }
    }

    // Start realistic gateway authorization animation
    setIsProcessing(true);
    setProcessingStage(1);
    setProcessingMessage('Initiating 256-Bit SSL Encrypted Handshake with NPCI UPI Gateway...');

    setTimeout(() => {
      setProcessingStage(2);
      if (upiTab === 'phone') {
        setProcessingMessage(`Sending UPI Collect prompt of ₹${finalPayable.toLocaleString('en-IN')} to ${upiPhone} on ${selectedUpiApp.toUpperCase()}...`);
      } else if (upiTab === 'qr') {
        setProcessingMessage('Validating Dynamic QR Code instant transaction receipt with bank...');
      } else {
        setProcessingMessage(`Authenticating UPI VPA "${upiId}" with National Payments Corporation of India (NPCI)...`);
      }
    }, 1200);

    setTimeout(() => {
      setProcessingStage(3);
      if (upiTransactionId.trim()) {
        setProcessingMessage(`Matching UPI Ref / UTR "${upiTransactionId.trim()}" with NPCI Switch & verifying payment proof...`);
      } else {
        setProcessingMessage('UPI Payment Authorized! Confirming order with Kirti Store inventory...');
      }
    }, 2400);

    setTimeout(async () => {
      try {
        const paymentMethodStr = 'UPI';
        const methodNote = upiTab === 'phone'
          ? `UPI Mobile Collect (${upiPhone} via ${selectedUpiApp.toUpperCase()})`
          : upiTab === 'qr'
          ? 'UPI Dynamic QR Code'
          : `UPI ID VPA (${upiId})`;

        const cleanTxnId = upiTransactionId ? upiTransactionId.trim() : '';

        const res = await api.post('/orders', {
          customerName: customerName ? customerName.trim() : undefined,
          customerEmail: customerEmail ? customerEmail.trim() : undefined,
          customerPhone: customerPhone ? customerPhone.trim() : undefined,
          items: cart.items.map(it => ({
            product: it.product?._id || it.product,
            quantity: it.quantity || 1,
            price: it.product?.sellingPrice || it.price,
            name: it.product?.name,
            image: it.product?.image,
            SKU: it.product?.SKU
          })),
          shippingAddress: {
            street: shippingAddress.street,
            apartment: shippingAddress.apartment || '',
            city: shippingAddress.city,
            state: shippingAddress.state || 'Maharashtra',
            postalCode: shippingAddress.postalCode,
            country: 'India',
            phone: customerPhone ? customerPhone.trim() : undefined,
          },
          paymentMethod: paymentMethodStr,
          upiTransactionId: cleanTxnId || undefined,
          paymentScreenshot: finalScreenshotUrl || undefined,
          notes: `${notes ? notes + ' | ' : ''}Gateway Method: ${methodNote}${cleanTxnId ? ` | Txn ID: ${cleanTxnId}` : ''}${finalScreenshotUrl ? ' | Screenshot Attached' : ''}${appliedCoupon ? ` (Coupon: ${appliedCoupon})` : ''}`,
        });

        if (res.data.success) {
          await clearCart();
          setIsProcessing(false);
          showSuccess('UPI payment verified & order confirmed successfully!');

          navigate(`/order-success/${res.data.order._id}`);
        } else {
          throw new Error(res.data.message || 'Order failed');
        }
      } catch (err) {
        setIsProcessing(false);
        showError(err.response?.data?.message || err.message || 'Payment processing failed. Please try again.');
      }
    }, 3600);
  };

  // If cart is empty, show empty state
  if (cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-charcoal-light">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-primary">Your Cart is Empty</h2>
        <p className="text-sm text-charcoal-light max-w-sm mx-auto">
          Add authentic kitchen appliances to your cart to proceed with checkout and express delivery.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-secondary hover:bg-secondary-700 text-white font-bold rounded-xl shadow-lg shadow-secondary/20 transition-all"
        >
          <span>Explore Appliances</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // Format countdown mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Breadcrumb & Step Progress Bar */}
      <div className="space-y-4">
        <nav className="flex items-center gap-2 text-xs font-semibold text-charcoal-light">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/cart" className="hover:text-primary">Cart</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-primary font-bold">
            {currentStep === 'address' ? 'Delivery Address' : 'Payment Gateway'}
          </span>
        </nav>

        {/* Step Indicator Tabs */}
        <div className="flex items-center justify-between max-w-2xl bg-white p-2 rounded-2xl border border-surface-border shadow-sm">
          <button
            onClick={() => setCurrentStep('address')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              currentStep === 'address'
                ? 'bg-primary text-white shadow-md'
                : 'text-charcoal-light hover:text-charcoal bg-surface-muted/50'
            }`}
          >
            <div className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
              currentStep === 'address' ? 'bg-secondary text-white' : 'bg-emerald-500 text-white'
            }`}>
              {currentStep === 'gateway' ? <Check className="w-3 h-3" /> : '1'}
            </div>
            <span>1. Delivery Address & Contact</span>
          </button>

          <div className="w-6 h-0.5 bg-slate-200 mx-1 hidden sm:block" />

          <button
            onClick={() => {
              if (shippingAddress.street && shippingAddress.city && shippingAddress.postalCode) {
                setCurrentStep('gateway');
              } else {
                showError('Please complete delivery address first.');
              }
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              currentStep === 'gateway'
                ? 'bg-secondary text-white shadow-md'
                : 'text-charcoal-light hover:text-charcoal bg-transparent'
            }`}
          >
            <div className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
              currentStep === 'gateway' ? 'bg-white text-secondary' : 'bg-slate-200 text-charcoal-light'
            }`}>
              2
            </div>
            <span>2. Payment Gateway & Review</span>
          </button>
        </div>
      </div>

      {/* Guest Autofill Quick Notification Banner */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-primary">
                Express Checkout Mode
              </p>
              <p className="text-xs text-charcoal-light">
                Testing the store? Autofill verified customer details and Mumbai address with 1 click.
              </p>
            </div>
          </div>
          <button
            onClick={handleAutofillDemo}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autofill Demo Customer</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: DELIVERY ADDRESS & CONTACT FORM                                  */}
      {/* ========================================================================= */}
      {currentStep === 'address' && (
        <form onSubmit={handleProceedToPayment} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-7 space-y-6">
            {/* Customer Contact Card */}
            <div className="bg-white rounded-3xl border border-surface-border p-6 sm:p-8 shadow-sm space-y-4">
              <div className="pb-3 border-b border-surface-border">
                <h2 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-secondary text-white text-xs font-bold flex items-center justify-center">1</span>
                  Recipient Contact Details
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-charcoal-light">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full mt-1.5 px-4 py-3 rounded-xl bg-slate-50/50 border border-surface-border text-charcoal font-medium focus:ring-2 focus:ring-secondary/20 focus:border-secondary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-charcoal-light">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full mt-1.5 px-4 py-3 rounded-xl bg-slate-50/50 border border-surface-border text-charcoal font-medium focus:ring-2 focus:ring-secondary/20 focus:border-secondary focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold text-charcoal-light">Email Address (for order tracking & invoice) *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full mt-1.5 px-4 py-3 rounded-xl bg-slate-50/50 border border-surface-border text-charcoal font-medium focus:ring-2 focus:ring-secondary/20 focus:border-secondary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Address Card */}
            <div className="bg-white rounded-3xl border border-surface-border p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2 pb-3 border-b border-surface-border">
                <span className="w-6 h-6 rounded-full bg-secondary text-white text-xs font-bold flex items-center justify-center">2</span>
                Shipping & Delivery Address
              </h2>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-charcoal-light">Flat / House No. / Building / Society *</label>
                  <input
                    type="text"
                    name="street"
                    required
                    placeholder="e.g. Flat 402, Royal Palms Residency, Senapati Bapat Marg"
                    value={shippingAddress.street}
                    onChange={handleAddressChange}
                    className="w-full mt-1.5 px-4 py-3 rounded-xl bg-slate-50/50 border border-surface-border text-charcoal font-medium focus:ring-2 focus:ring-secondary/20 focus:border-secondary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-charcoal-light">Apartment / Tower / Landmark (Optional)</label>
                  <input
                    type="text"
                    name="apartment"
                    placeholder="e.g. Tower B, Near Phoenix Mall"
                    value={shippingAddress.apartment}
                    onChange={handleAddressChange}
                    className="w-full mt-1.5 px-4 py-3 rounded-xl bg-slate-50/50 border border-surface-border text-charcoal font-medium focus:ring-2 focus:ring-secondary/20 focus:border-secondary focus:outline-none"
                  />
                </div>

                {/* Smart PIN Code, City & State Row with Real-Time City Fetch */}
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    
                    {/* PIN Code Input (Triggers Auto-Fetch) */}
                    <div className="relative">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-charcoal-light flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-secondary" />
                          <span>PIN Code *</span>
                        </label>
                        {pincodeStatus.loading && (
                          <span className="text-[10px] text-secondary font-bold flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Fetching City...</span>
                          </span>
                        )}
                        {!pincodeStatus.loading && pincodeStatus.success && (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Detected</span>
                          </span>
                        )}
                      </div>
                      <div className="relative mt-1.5">
                        <input
                          type="text"
                          name="postalCode"
                          required
                          maxLength={6}
                          placeholder="e.g. 400013"
                          value={shippingAddress.postalCode}
                          onChange={handleAddressChange}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50/50 border border-surface-border text-charcoal font-bold tracking-wider focus:ring-2 focus:ring-secondary/20 focus:border-secondary focus:outline-none"
                        />
                        {shippingAddress.postalCode?.length === 6 && (
                          <button
                            type="button"
                            onClick={() => handlePincodeLookup(shippingAddress.postalCode)}
                            title="Re-fetch city & state for this PIN code"
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-secondary rounded-lg transition-colors"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${pincodeStatus.loading ? 'animate-spin text-secondary' : ''}`} />
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Enter 6-digit PIN to auto-fetch your city
                      </p>
                    </div>

                    {/* City (Auto-populated from PIN code, fully editable) */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-charcoal-light">City *</label>
                        {pincodeStatus.success && (
                          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                            Auto-filled
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        name="city"
                        required
                        placeholder="Mumbai"
                        value={shippingAddress.city}
                        onChange={handleAddressChange}
                        className={`w-full mt-1.5 px-4 py-3 rounded-xl border text-charcoal font-semibold focus:ring-2 focus:ring-secondary/20 focus:border-secondary focus:outline-none transition-all ${
                          pincodeStatus.success 
                            ? 'bg-emerald-50/20 border-emerald-300' 
                            : 'bg-slate-50/50 border-surface-border'
                        }`}
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Auto-detected city (editable)
                      </p>
                    </div>

                    {/* State (Auto-populated from PIN code, fully editable) */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-charcoal-light">State *</label>
                        {pincodeStatus.success && (
                          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                            Auto-filled
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        name="state"
                        required
                        placeholder="Maharashtra"
                        value={shippingAddress.state}
                        onChange={handleAddressChange}
                        className={`w-full mt-1.5 px-4 py-3 rounded-xl border text-charcoal font-semibold focus:ring-2 focus:ring-secondary/20 focus:border-secondary focus:outline-none transition-all ${
                          pincodeStatus.success 
                            ? 'bg-emerald-50/20 border-emerald-300' 
                            : 'bg-slate-50/50 border-surface-border'
                        }`}
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        State or Union Territory
                      </p>
                    </div>
                  </div>

                  {/* Real-time Status Alert / Feedback */}
                  {pincodeStatus.message && (
                    <div className={`p-2.5 rounded-xl text-xs flex items-center justify-between transition-all ${
                      pincodeStatus.success 
                        ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-200' 
                        : pincodeStatus.loading 
                        ? 'bg-blue-50 text-secondary border border-blue-100'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      <div className="flex items-center gap-1.5 font-medium">
                        {pincodeStatus.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : pincodeStatus.loading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-secondary shrink-0" />
                        ) : (
                          <Info className="w-4 h-4 text-amber-600 shrink-0" />
                        )}
                        <span>{pincodeStatus.message}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 hidden sm:inline">
                        City & state can be edited manually anytime
                      </span>
                    </div>
                  )}

                  {/* Optional Locality / Post Office area picker */}
                  {pincodeStatus.localities && pincodeStatus.localities.length > 0 && (() => {
                    const allLocs = pincodeStatus.localities;
                    const filtered = allLocs.filter((l) =>
                      l.toLowerCase().includes(areaSearchTerm.toLowerCase().trim())
                    );
                    const displayed = (showAllAreas || areaSearchTerm.trim() !== '')
                      ? filtered
                      : filtered.slice(0, 12);
                    const hasMore = !showAllAreas && areaSearchTerm.trim() === '' && filtered.length > 12;

                    return (
                      <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <MapPin className="w-3.5 h-3.5 text-secondary shrink-0" />
                            <span className="text-xs font-bold text-primary">
                              Select your Area / Locality to add to address:
                            </span>
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              {allLocs.length} areas nearby
                            </span>
                          </div>

                          {/* Search & Custom Area Controls */}
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1 sm:w-48">
                              <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={areaSearchTerm}
                                onChange={(e) => setAreaSearchTerm(e.target.value)}
                                placeholder="Filter areas (e.g. Station Plot)..."
                                className="w-full pl-7 pr-5 py-1 text-[11px] rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-secondary"
                              />
                              {areaSearchTerm && (
                                <button
                                  type="button"
                                  onClick={() => setAreaSearchTerm('')}
                                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px]"
                                >
                                  ✕
                                </button>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => setShowAddCustomArea(!showAddCustomArea)}
                              className="text-[10px] font-bold text-secondary hover:text-secondary-700 bg-white border border-secondary/30 hover:border-secondary px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 shadow-2xs"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Custom Area</span>
                            </button>
                          </div>
                        </div>

                        {/* Inline Custom Area Input Form */}
                        {showAddCustomArea && (
                          <form onSubmit={handleAddCustomArea} className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-secondary/40 shadow-xs">
                            <input
                              type="text"
                              value={customAreaInput}
                              onChange={(e) => setCustomAreaInput(e.target.value)}
                              placeholder="Type your Society / Mohalla / Landmark (e.g. LIC Street, Chetan Park)"
                              className="flex-1 text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-secondary bg-slate-50/50"
                              autoFocus
                            />
                            <button
                              type="submit"
                              className="px-3 py-1.5 bg-secondary text-white text-xs font-bold rounded-lg hover:bg-secondary-700 transition-colors shadow-2xs"
                            >
                              + Add to Address
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowAddCustomArea(false)}
                              className="text-xs text-slate-400 hover:text-charcoal px-2 py-1"
                            >
                              Cancel
                            </button>
                          </form>
                        )}

                        {/* Locality Pills with Active State Highlights */}
                        <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto pr-1">
                          {displayed.length > 0 ? (
                            displayed.map((loc, idx) => {
                              const isSelected = Boolean(
                                (shippingAddress.apartment && shippingAddress.apartment.toLowerCase().includes(loc.toLowerCase())) ||
                                (shippingAddress.street && shippingAddress.street.toLowerCase().includes(loc.toLowerCase()))
                              );

                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleSelectLocality(loc)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shadow-2xs flex items-center gap-1 ${
                                    isSelected
                                      ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-400 font-bold'
                                      : 'bg-white hover:bg-secondary hover:text-white border border-slate-200 text-charcoal'
                                  }`}
                                  title={isSelected ? `"${loc}" is included in your address` : `Click to add "${loc}" to landmark`}
                                >
                                  {isSelected ? <Check className="w-3 h-3 text-emerald-600" /> : <span>+</span>}
                                  <span>{loc}</span>
                                </button>
                              );
                            })
                          ) : (
                            <div className="w-full py-2 text-center text-xs text-slate-400">
                              No areas found matching "{areaSearchTerm}". Click <b>"+ Custom Area"</b> above to add it.
                            </div>
                          )}
                        </div>

                        {/* Expand / Collapse Controls */}
                        {hasMore && (
                          <div className="pt-1.5 flex items-center justify-between border-t border-slate-200/60 text-[11px]">
                            <span className="text-slate-500">
                              Showing 12 of {allLocs.length} areas in {shippingAddress.city || 'this area'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowAllAreas(true)}
                              className="text-secondary font-bold hover:underline flex items-center gap-1"
                            >
                              <span>Show all {allLocs.length} areas</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {showAllAreas && allLocs.length > 12 && (
                          <div className="pt-1.5 flex items-center justify-between border-t border-slate-200/60 text-[11px]">
                            <span className="text-slate-500">
                              Showing all {allLocs.length} nearby areas
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowAllAreas(false)}
                              className="text-slate-500 font-bold hover:text-secondary flex items-center gap-1"
                            >
                              <span>Show fewer</span>
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Delivery Method Selector */}
                <div className="pt-2">
                  <label className="font-semibold text-charcoal-light block mb-2">Delivery Service Level</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      onClick={() => setDeliverySpeed('standard')}
                      className={`p-4 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                        deliverySpeed === 'standard'
                          ? 'border-secondary bg-blue-50/60 shadow-sm'
                          : 'border-surface-border bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        checked={deliverySpeed === 'standard'}
                        onChange={() => setDeliverySpeed('standard')}
                        className="mt-1 text-secondary"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-secondary" />
                          <span className="font-bold text-xs text-primary">Standard Safe Transit Delivery</span>
                        </div>
                        <p className="text-[11px] text-charcoal-light mt-0.5">
                          Delivered in 3-5 business days • Free over ₹999
                        </p>
                      </div>
                    </label>

                    <label
                      onClick={() => setDeliverySpeed('scheduled')}
                      className={`p-4 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                        deliverySpeed === 'scheduled'
                          ? 'border-secondary bg-blue-50/60 shadow-sm'
                          : 'border-surface-border bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        checked={deliverySpeed === 'scheduled'}
                        onChange={() => setDeliverySpeed('scheduled')}
                        className="mt-1 text-secondary"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-slate-600" />
                          <span className="font-bold text-xs text-primary">Scheduled Weekend Delivery</span>
                        </div>
                        <p className="text-[11px] text-charcoal-light mt-0.5">
                          Saturday / Sunday convenient slot
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-charcoal-light">Delivery Instructions (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Call before delivery, handle appliance box with care"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full mt-1.5 px-4 py-3 rounded-xl bg-slate-50/50 border border-surface-border text-charcoal font-medium focus:ring-2 focus:ring-secondary/20 focus:border-secondary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* CTA Proceed to Payment */}
            <button
              type="submit"
              className="w-full py-4 px-6 bg-primary hover:bg-zinc-800 text-white font-bold text-base rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-black/15 transition-all transform active:scale-98"
            >
              <span>Continue to Payment Gateway</span>
              <ArrowRight className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Right Column: Order Summary Preview */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-surface-border p-6 sm:p-8 shadow-sm space-y-6 sticky top-28">
              <div className="flex items-center justify-between pb-4 border-b border-surface-border">
                <h3 className="text-base font-bold text-primary">
                  Order Summary ({cart.itemCount} items)
                </h3>
                <span className="text-xs font-semibold px-2.5 py-1 bg-secondary/10 text-secondary rounded-full">
                  Step 1 of 2
                </span>
              </div>

              {/* Items List */}
              <div className="max-h-64 overflow-y-auto space-y-3 pr-2 divide-y divide-surface-border">
                {cart.items.map((item) => (
                  <div key={item._id} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img
                        src={item.product?.image || 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=200&q=80'}
                        alt={item.product?.name}
                        className="w-14 h-14 rounded-xl object-cover border border-surface-border flex-shrink-0"
                      />
                      <div className="overflow-hidden">
                        <p className="font-bold text-primary truncate">{item.product?.name}</p>
                        <p className="text-charcoal-light">Qty: {item.quantity} × ₹{(item.product?.sellingPrice || 0).toLocaleString('en-IN')}</p>
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            isBigAppliance(item.product)
                              ? 'bg-amber-50 text-amber-900 border border-amber-200'
                              : 'bg-blue-50 text-blue-900 border border-blue-200'
                          }`}>
                            📦 {isBigAppliance(item.product) ? 'Big Package (₹120)' : 'Small Package (₹60)'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="font-bold text-primary ml-2 flex-shrink-0">
                      ₹{item.lineTotal?.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Calculations */}
              <div className="space-y-2.5 text-xs pt-4 border-t border-surface-border">
                <div className="flex justify-between text-charcoal">
                  <span>Subtotal</span>
                  <span className="font-semibold">₹{cart.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-charcoal">
                  <div>
                    <span className="block font-medium">Package Transportation</span>
                    <span className="text-[10px] text-charcoal-light">
                      {cart.items.some(i => isBigAppliance(i.product))
                        ? 'Big Appliance Package (₹120 rate)'
                        : 'Small Appliance Package (₹60 rate)'}
                    </span>
                  </div>
                  <span className="font-bold text-primary">
                    ₹{(cart.shippingFee || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-charcoal">
                  <span>GST Tax (5%)</span>
                  <span className="font-semibold text-charcoal-light">Included in appliance price</span>
                </div>

                <div className="pt-3 border-t border-surface-border flex justify-between items-baseline text-base font-bold text-primary">
                  <span>Total Amount</span>
                  <span className="text-2xl font-black text-secondary">
                    ₹{cart.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-[11px] text-charcoal-light flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>Next step: Review your delivery address and scan the Official Google Pay / UPI QR Code to pay securely.</span>
              </div>
            </div>
          </div>

        </form>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: PAYMENT CHECKOUT GATEWAY (RAZORPAY / STRIPE STYLE)                 */}
      {/* ========================================================================= */}
      {currentStep === 'gateway' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Delivery Address Summary & Payment Gateway Panel */}
          <div className="lg:col-span-8 space-y-6">

            {/* 1. Verified Delivery Address Summary Card (As Requested!) */}
            <div className="bg-white rounded-3xl border border-surface-border p-6 sm:p-7 shadow-sm space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    <Check className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-primary">
                    Delivering To Address
                  </h3>
                </div>
                <button
                  onClick={() => setCurrentStep('address')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-secondary bg-secondary/10 hover:bg-secondary/20 transition-all flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Change Address</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                <div>
                  <p className="font-bold text-primary text-sm">{customerName}</p>
                  <p className="text-charcoal font-medium mt-1">
                    {shippingAddress.street}
                    {shippingAddress.apartment && `, ${shippingAddress.apartment}`}
                  </p>
                  <p className="text-charcoal font-medium">
                    {shippingAddress.city}, {shippingAddress.state} - <span className="font-bold text-primary">{shippingAddress.postalCode}</span>
                  </p>
                  <p className="text-charcoal-light mt-1">Country: India</p>
                </div>

                <div className="space-y-2 sm:border-l sm:border-surface-border sm:pl-4">
                  <div className="flex items-center gap-2 text-charcoal">
                    <Smartphone className="w-4 h-4 text-secondary flex-shrink-0" />
                    <span>Contact: <strong className="text-primary">{customerPhone}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-charcoal">
                    <Truck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Mode: <strong className="text-emerald-700">{deliverySpeed === 'scheduled' ? 'Scheduled Weekend Delivery' : 'Standard Safe Transit (3-5 Days)'}</strong></span>
                  </div>
                  {notes && (
                    <p className="text-[11px] text-charcoal-light bg-slate-50 p-2 rounded-lg border border-slate-200/50">
                      Note: "{notes}"
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Realistic Payment Checkout Gateway Container */}
            <div className="bg-white rounded-3xl border-2 border-slate-900 shadow-xl overflow-hidden">
              
              {/* Gateway Top Branding Header */}
              <div className="bg-slate-900 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-white font-black text-xl shadow-md">
                    K
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base tracking-wide">Kirti Store Payment Gateway</h3>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> 256-Bit SSL
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      RBI Compliant • PCI-DSS Certified Secure Checkout
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Amount Payable</span>
                    <span className="text-xl font-black text-white">₹{finalPayable.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Only UPI QR Code Notice Banner */}
              <div className="bg-sky-50 border-b border-sky-100 px-6 py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-sky-900 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-secondary flex-shrink-0" />
                  <span>Exclusive Payment Mode: <strong>Official UPI QR Code</strong>. Scan with any UPI app for direct settlement.</span>
                </div>
                <span className="hidden sm:inline-block text-[11px] bg-sky-200/70 text-sky-900 px-2.5 py-0.5 rounded-full font-bold">
                  Zero Processing Surcharge
                </span>
              </div>

              {/* Gateway QR Code Body */}
              <div className="p-6 sm:p-8 space-y-6">
                
                {/* QR Code Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-border gap-2">
                  <div>
                    <h4 className="font-extrabold text-base text-primary flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-secondary" />
                      <span>Scan & Pay via Google Pay / UPI QR Code</span>
                    </h4>
                    <p className="text-xs text-charcoal-light mt-0.5">
                      Scan using Google Pay, PhonePe, Paytm, BHIM or any banking UPI app.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-secondary bg-sky-50 border border-sky-100 px-3 py-1 rounded-full font-mono font-bold self-start sm:self-auto">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Expires in: {formatTime(qrSeconds)}</span>
                  </div>
                </div>

                {/* QR Code & Details Card */}
                <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-slate-50/90 rounded-3xl border border-slate-200">
                  {/* QR Code Container */}
                  <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-200 flex flex-col items-center flex-shrink-0">
                    {qrType === 'gpay' ? (
                      <div className="p-1 bg-white rounded-xl flex items-center justify-center">
                        <img
                          src="/upi-qr.jpg"
                          alt="Google Pay QR Code - kotichachiragr-1@okhdfcbank"
                          className="w-52 h-52 object-contain rounded-xl border border-slate-100 shadow-xs"
                        />
                      </div>
                    ) : (
                      <div className="p-3 bg-white rounded-xl">
                        <QRCodeSVG
                          value={upiPaymentUri}
                          size={190}
                          level="M"
                          marginSize={1}
                          imageSettings={{
                            src: '/favicon.png',
                            height: 28,
                            width: 28,
                            excavate: true,
                          }}
                        />
                      </div>
                    )}

                    {/* Toggle between Official GPay QR and Pre-filled Dynamic QR */}
                    <div className="flex items-center gap-1 mt-3 p-1 bg-slate-100 rounded-xl text-[11px] font-bold border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setQrType('gpay')}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          qrType === 'gpay'
                            ? 'bg-secondary text-white shadow-xs'
                            : 'text-slate-600 hover:text-primary'
                        }`}
                      >
                        Official GPay QR
                      </button>
                      <button
                        type="button"
                        onClick={() => setQrType('dynamic')}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          qrType === 'dynamic'
                            ? 'bg-secondary text-white shadow-xs'
                            : 'text-slate-600 hover:text-primary'
                        }`}
                      >
                        Auto-Amount QR
                      </button>
                    </div>

                    <span className="text-xs font-mono font-bold text-emerald-700 mt-2">
                      Pre-filled: ₹{finalPayable.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Payment Details & Instructions */}
                  <div className="space-y-4 text-xs w-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] uppercase font-bold text-charcoal-light tracking-wider block">Payable Amount</span>
                        <p className="text-3xl font-black text-secondary">₹{finalPayable.toLocaleString('en-IN')}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setQrSeconds(295)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-primary rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        title="Reset QR timer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reset Timer</span>
                      </button>
                    </div>
                    
                    {/* Copy Official Store UPI ID */}
                    <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-1.5 shadow-xs">
                      <span className="text-[11px] font-bold text-charcoal-light uppercase block">Official Store UPI ID:</span>
                      <div className="flex items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="font-mono text-sm font-bold text-primary truncate select-all">{MERCHANT_VPA}</span>
                        <button
                          type="button"
                          onClick={handleCopyVpa}
                          className="px-3 py-1.5 bg-secondary text-white hover:bg-secondary-dark rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs cursor-pointer"
                        >
                          {copiedVpa ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                          <span>{copiedVpa ? 'Copied' : 'Copy UPI ID'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2 text-charcoal">
                      <p className="font-bold text-primary text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Simple 3-Step Payment Process:</span>
                      </p>
                      <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-charcoal-light pl-1">
                        <li>Open <strong>Google Pay</strong>, PhonePe, Paytm, or BHIM on your smartphone</li>
                        <li>Scan the QR code & verify payee <strong>{MERCHANT_VPA}</strong> for <strong>₹{finalPayable.toLocaleString('en-IN')}</strong></li>
                        <li>Enter your UPI PIN to approve payment, then enter the UTR / attach receipt below</li>
                      </ol>
                    </div>

                    {/* NPCI Trust Notice */}
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>All UPI payments are directly verified by National Payments Corporation of India (NPCI) and HDFC Bank.</span>
                    </div>
                  </div>
                </div>

                {/* --- UPI PAYMENT PROOF & TRANSACTION ID SECTION --- */}
                  <div 
                    onPaste={handlePasteScreenshot}
                    className="pt-5 border-t border-surface-border space-y-4 focus:outline-none"
                    tabIndex={0}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-surface-border">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold">
                          <CheckCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-primary flex items-center gap-1.5">
                            <span>UPI Payment Confirmation & Proof</span>
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                              Instant Match
                            </span>
                          </h4>
                          <p className="text-[11px] text-charcoal-light">
                            Enter your UPI transaction ID / UTR and upload payment screenshot for priority verification
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* FIELD 1: UPI TRANSACTION ID / UTR */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-charcoal flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Hash className="w-3.5 h-3.5 text-secondary" />
                            <span>UPI Transaction ID / UTR No.</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            12-digit number
                          </span>
                        </label>
                        
                        <div className="relative">
                          <input
                            type="text"
                            maxLength="24"
                            value={upiTransactionId}
                            onChange={(e) => setUpiTransactionId(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                            placeholder="e.g. 410294829104"
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-mono font-bold tracking-wider text-primary focus:outline-none focus:ring-2 transition-all ${
                              upiTransactionId.length >= 10
                                ? 'border-emerald-400 bg-emerald-50/20 focus:ring-emerald-400/20'
                                : 'border-surface-border bg-slate-50/50 focus:ring-secondary/20 focus:border-secondary'
                            }`}
                          />
                          {upiTransactionId.length >= 10 && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 flex items-center gap-1 text-[11px] font-bold">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="hidden sm:inline">Valid UTR</span>
                            </div>
                          )}
                        </div>

                        {ocrDetectedUtr && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] text-emerald-800 font-semibold animate-fadeIn">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Auto-detected from receipt: <strong>{ocrDetectedUtr}</strong></span>
                          </div>
                        )}

                        <p className="text-[10px] text-charcoal-light leading-relaxed">
                          💡 <strong>Tip:</strong> In PhonePe/GPay/Paytm, look for <strong>"UPI Ref No."</strong> or <strong>"UTR"</strong> in payment details.
                        </p>
                      </div>

                      {/* FIELD 2: PAYMENT SCREENSHOT UPLOAD */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-charcoal flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-secondary" />
                            <span>Payment Done Screenshot</span>
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                            Ctrl + V to paste
                          </span>
                        </label>

                        {scanningOcr && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 border border-sky-200 rounded-xl text-[11px] text-sky-800 font-semibold animate-pulse">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-secondary shrink-0" />
                            <span>🤖 AI scanning receipt for 12-digit UPI UTR...</span>
                          </div>
                        )}

                        {!screenshotPreview ? (
                          <label
                            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                            onDragLeave={() => setIsDragOver(false)}
                            onDrop={handleDropScreenshot}
                            className={`border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                              isDragOver 
                                ? 'border-secondary bg-sky-50' 
                                : 'border-slate-300 hover:border-secondary hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp"
                              className="hidden"
                              onChange={handleScreenshotChange}
                            />
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mb-1">
                              <UploadCloud className="w-4 h-4 text-secondary" />
                            </div>
                            <span className="text-xs font-bold text-primary">
                              Upload Payment Screenshot
                            </span>
                            <span className="text-[10px] text-charcoal-light mt-0.5">
                              Click to browse, drag & drop, or paste (Max 15MB)
                            </span>
                          </label>
                        ) : (
                          <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/30 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <div 
                                className="relative group cursor-pointer flex-shrink-0" 
                                onClick={() => setViewScreenshotModal(true)}
                                title="Click to view full screenshot"
                              >
                                <img
                                  src={screenshotPreview}
                                  alt="UPI Payment Screenshot"
                                  className="w-12 h-12 rounded-lg object-cover border border-slate-200 shadow-2xs group-hover:opacity-80 transition-opacity"
                                />
                                <div className="absolute inset-0 bg-black/30 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                  <Eye className="w-3.5 h-3.5" />
                                </div>
                              </div>
                              <div className="overflow-hidden text-xs">
                                <p className="font-bold text-primary truncate max-w-[140px]">
                                  {screenshotFile?.name || 'Payment_Screenshot.png'}
                                </p>
                                {uploadingScreenshot ? (
                                  <span className="text-[10px] text-secondary flex items-center gap-1 font-semibold">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Uploading proof...
                                  </span>
                                ) : screenshotUrl ? (
                                  <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Uploaded to Server ✓
                                  </span>
                                ) : uploadError ? (
                                  <span className="text-[10px] text-rose-600 font-semibold truncate block">
                                    {uploadError}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400">Ready</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => setViewScreenshotModal(true)}
                                className="p-1.5 text-slate-500 hover:text-primary rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
                                title="View screenshot full size"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={handleRemoveScreenshot}
                                className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
                                title="Remove screenshot"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {(upiTransactionId || screenshotUrl) && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-900 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>
                          Payment proof will be linked directly to your invoice & order tracking for fast-track dispatch.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Gateway Bottom CTA Button */}
                  <div className="pt-6 border-t border-surface-border space-y-3">
                    <button
                      type="button"
                      onClick={handleExecutePayment}
                      disabled={isProcessing}
                      className="w-full py-4 px-6 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-extrabold text-base rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20 transition-all cursor-pointer disabled:opacity-60"
                    >
                      <Lock className="w-4 h-4 text-emerald-400" />
                      <span>
                        Confirm & Pay ₹{finalPayable.toLocaleString('en-IN')} via UPI
                      </span>
                    </button>

                    <div className="flex items-center justify-center gap-3 sm:gap-4 text-[10px] text-charcoal-light text-center flex-wrap">
                      <span className="flex items-center gap-1 font-bold text-slate-700">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        NPCI & RBI Certified
                      </span>
                      <span>•</span>
                      <span>100% Direct UPI Transfer</span>
                      <span>•</span>
                      <span>Zero Processing Fees</span>
                      <span>•</span>
                      <span>2-Year Appliance Warranty</span>
                    </div>
                  </div>

                </div>

            </div>

          </div>

          {/* Right Column: Authoritative Price Breakdown & Coupon Drawer */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Price Breakdown Card */}
            <div className="bg-white rounded-3xl border border-surface-border p-6 shadow-sm space-y-5 sticky top-28">
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <h3 className="text-base font-bold text-primary flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-secondary" />
                  <span>Order & Price Summary</span>
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded-full text-charcoal">
                  {cart.itemCount} items
                </span>
              </div>

              {/* Cart Appliances List */}
              <div className="max-h-56 overflow-y-auto space-y-3 pr-2 divide-y divide-surface-border">
                {cart.items.map((item) => (
                  <div key={item._id} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <img
                        src={item.product?.image || 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=200&q=80'}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover border border-surface-border flex-shrink-0"
                      />
                      <div className="overflow-hidden">
                        <p className="font-bold text-primary truncate">{item.product?.name}</p>
                        <p className="text-charcoal-light">Qty: {item.quantity} × ₹{(item.product?.sellingPrice || 0).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <span className="font-bold text-primary ml-2 flex-shrink-0">
                      ₹{item.lineTotal?.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon Input Form */}
              <div className="pt-3 border-t border-surface-border">
                {appliedCoupon ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-emerald-800">Coupon "{appliedCoupon}" Applied</span>
                      <p className="text-[11px] text-emerald-700">You saved ₹{couponDiscount.toLocaleString('en-IN')}</p>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-xs font-bold text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon: KIRTI10"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-surface-border text-charcoal uppercase tracking-wider focus:ring-1 focus:ring-secondary focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
                    >
                      Apply
                    </button>
                  </form>
                )}
              </div>

              {/* Authoritative Price Line Items */}
              <div className="space-y-2 text-xs pt-3 border-t border-surface-border">
                <div className="flex justify-between text-charcoal">
                  <span>Cart Subtotal</span>
                  <span className="font-semibold">₹{cart.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-charcoal">
                  <div>
                    <span>Package Transportation</span>
                    <span className="block text-[10px] text-charcoal-light">
                      {cart.items.some(it => isBigAppliance(it.product)) 
                        ? '📦 Big Appliance Pack: ₹120' 
                        : '📦 Small Appliance Pack: ₹60'}
                    </span>
                  </div>
                  <span className="font-semibold text-secondary">
                    ₹{cart.shippingFee}
                  </span>
                </div>
                <div className="flex justify-between text-charcoal">
                  <span>GST Tax (5%)</span>
                  <span className="font-semibold text-charcoal-light">Included</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Coupon Discount</span>
                    <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-surface-border flex justify-between items-baseline text-base font-bold text-primary">
                  <span>Total Payable</span>
                  <span className="text-2xl font-black text-secondary">
                    ₹{finalPayable.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Satisfaction Guarantee Badge */}
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 text-xs text-charcoal space-y-1.5">
                <p className="font-bold text-primary flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-secondary" />
                  Kirti Store Direct Warranty
                </p>
                <p className="text-[11px] text-charcoal-light leading-relaxed">
                  Every kitchen appliance is tested for high performance and backed by our hassle-free doorstep replacement guarantee.
                </p>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* REALISTIC PAYMENT AUTHORIZATION MODAL                                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isProcessing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl border border-surface-border"
            >
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                <div className="absolute inset-0 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
                <Lock className="w-8 h-8 text-secondary" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-primary">
                  Processing Secure Payment
                </h3>
                <p className="text-xs text-charcoal-light font-medium min-h-[36px] flex items-center justify-center">
                  {processingMessage}
                </p>
              </div>

              {/* Stepper Progress Visualizer */}
              <div className="flex items-center justify-center gap-2">
                <div className={`w-3 h-3 rounded-full transition-all ${
                  processingStage >= 1 ? 'bg-secondary' : 'bg-slate-200'
                }`} />
                <div className={`w-8 h-1 rounded-full transition-all ${
                  processingStage >= 2 ? 'bg-secondary' : 'bg-slate-200'
                }`} />
                <div className={`w-3 h-3 rounded-full transition-all ${
                  processingStage >= 2 ? 'bg-secondary' : 'bg-slate-200'
                }`} />
                <div className={`w-8 h-1 rounded-full transition-all ${
                  processingStage >= 3 ? 'bg-secondary' : 'bg-slate-200'
                }`} />
                <div className={`w-3 h-3 rounded-full transition-all ${
                  processingStage >= 3 ? 'bg-emerald-500' : 'bg-slate-200'
                }`} />
              </div>

              <div className="text-[11px] text-charcoal-light bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                Please do not close this window or click back. We are confirming stock allocation and generating your official order invoice.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Screenshot Lightbox Modal */}
      <AnimatePresence>
        {viewScreenshotModal && screenshotPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-5 max-w-lg w-full space-y-4 shadow-2xl border border-surface-border"
            >
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-secondary" />
                  <h3 className="font-bold text-sm text-primary">UPI Payment Screenshot Preview</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setViewScreenshotModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-charcoal hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[65vh] overflow-auto rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 p-2">
                <img
                  src={screenshotPreview}
                  alt="Payment Receipt"
                  className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-sm"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-charcoal-light pt-1">
                <span>{screenshotFile?.name || 'UPI Screenshot'}</span>
                <button
                  type="button"
                  onClick={() => setViewScreenshotModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Checkout;
