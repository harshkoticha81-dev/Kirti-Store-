import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Award, 
  Download, 
  CheckCircle2, 
  Search, 
  HelpCircle, 
  FileText, 
  Smartphone, 
  Calendar, 
  QrCode, 
  MessageSquare, 
  Sparkles, 
  AlertCircle,
  Truck,
  RotateCcw,
  Check
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { jsPDF } from 'jspdf';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { getWhatsAppDirectLink } from '../utils/whatsappUtils';

const WarrantyRegistration = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();

  const [activeTab, setActiveTab] = useState('register'); // 'register' | 'verify'
  
  // Registration Form State
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    applianceModel: '',
    serialNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseChannel: 'Kirti Store Online',
    invoiceNumber: '',
    orderId: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [registeredWarranty, setRegisteredWarranty] = useState(null);

  // Verification State
  const [verifyQuery, setVerifyQuery] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifiedWarranty, setVerifiedWarranty] = useState(null);
  const [verifyError, setVerifyError] = useState('');

  // Populate initial values from user auth or URL query params
  useEffect(() => {
    const orderIdParam = searchParams.get('orderId') || '';
    const phoneParam = searchParams.get('phone') || '';
    const modelParam = searchParams.get('model') || '';

    setFormData(prev => ({
      ...prev,
      customerName: prev.customerName || user?.name || '',
      customerEmail: prev.customerEmail || user?.email || '',
      customerPhone: prev.customerPhone || phoneParam || user?.phone || '',
      applianceModel: prev.applianceModel || modelParam || '',
      orderId: prev.orderId || orderIdParam || ''
    }));

    if (searchParams.get('tab') === 'verify') {
      setActiveTab('verify');
    }
    if (searchParams.get('serial')) {
      setActiveTab('verify');
      setVerifyQuery(searchParams.get('serial'));
    }
  }, [user, searchParams]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'serialNumber' ? value.toUpperCase() : value
    }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName.trim() || !formData.customerEmail.trim() || !formData.customerPhone.trim()) {
      showError('Please provide your complete customer contact details.');
      return;
    }
    if (!formData.applianceModel.trim() || !formData.serialNumber.trim()) {
      showError('Appliance model and serial number are required.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('kirti_auth_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.post('/api/warranty/register', formData, { headers });
      if (res.data.success) {
        setRegisteredWarranty(res.data.warranty);
        showSuccess('Warranty activated successfully! Certificate generated.');
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to register warranty. Please check details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verifyQuery.trim()) {
      showError('Please enter a serial number or warranty certificate number.');
      return;
    }

    setVerifying(true);
    setVerifyError('');
    setVerifiedWarranty(null);

    try {
      const res = await axios.get(`/api/warranty/verify/${encodeURIComponent(verifyQuery.trim())}`);
      if (res.data.success) {
        setVerifiedWarranty(res.data.warranty);
      }
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'No warranty record found.');
    } finally {
      setVerifying(false);
    }
  };

  // Generate official PDF Certificate using jsPDF
  const downloadPdfCertificate = (certData) => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Background border and header colors
      doc.setFillColor(15, 23, 42); // Navy/Slate 900
      doc.rect(0, 0, 297, 210, 'F');

      // Certificate Inner Card
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(10, 10, 277, 190, 6, 6, 'F');

      // Gold Ornamental Border
      doc.setDrawColor(217, 119, 6); // Amber 600
      doc.setLineWidth(2);
      doc.rect(14, 14, 269, 182);

      doc.setDrawColor(245, 158, 11); // Amber 500
      doc.setLineWidth(0.6);
      doc.rect(16, 16, 265, 178);

      // Header Text
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.text('KIRTI APPLIANCES STORE', 148.5, 34, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(217, 119, 6);
      doc.text('OFFICIAL 2-YEAR DIGITAL WARRANTY CERTIFICATE', 148.5, 42, { align: 'center' });

      doc.setDrawColor(226, 232, 240);
      doc.line(30, 48, 267, 48);

      // Main Certificate Content
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('This is to certify that the kitchen appliance specified below is backed by the comprehensive brand warranty:', 148.5, 56, { align: 'center' });

      // Left Column - Details Box
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(25, 64, 165, 76, 3, 3, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('Appliance Model:', 32, 74);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(certData.applianceModel || 'Premium Appliance', 85, 74);

      doc.setFont('helvetica', 'bold');
      doc.text('Serial Number:', 32, 84);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(217, 119, 6);
      doc.text(certData.serialNumber || 'N/A', 85, 84);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Certificate No:', 32, 94);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(certData.certificateNumber || 'N/A', 85, 94);

      doc.setFont('helvetica', 'bold');
      doc.text('Registered Owner:', 32, 104);
      doc.setFont('helvetica', 'normal');
      doc.text(certData.customerName || certData.customerNameMasked || 'Registered Customer', 85, 104);

      doc.setFont('helvetica', 'bold');
      doc.text('Purchase Date:', 32, 114);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date(certData.purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), 85, 114);

      doc.setFont('helvetica', 'bold');
      doc.text('Warranty Valid Until:', 32, 124);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129); // Emerald 600
      doc.text(new Date(certData.warrantyValidUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' (Active)', 85, 124);

      // Right Column - Official Seal Box
      doc.setFillColor(254, 243, 199);
      doc.roundedRect(200, 64, 72, 76, 3, 3, 'F');
      doc.setDrawColor(245, 158, 11);
      doc.rect(202, 66, 68, 72);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(180, 83, 9);
      doc.text('2 YEARS', 236, 85, { align: 'center' });
      doc.setFontSize(9);
      doc.text('COMPREHENSIVE', 236, 92, { align: 'center' });
      doc.text('PEACE OF MIND', 236, 98, { align: 'center' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(146, 64, 14);
      doc.text('• 100% Genuine OEM Spares', 236, 112, { align: 'center' });
      doc.text('• Free 48-Hour Doorstep Visit', 236, 118, { align: 'center' });
      doc.text('• Zero Labor Charges', 236, 124, { align: 'center' });

      // Coverage Bullet Points Bottom Box
      doc.setFillColor(241, 245, 249);
      doc.rect(25, 148, 247, 24, 'F');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('WARRANTY TERMS & CONDITIONS:', 30, 154);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('1. Covers electrical/mechanical manufacturing defects in motor, heating elements, and internal circuitry.', 30, 160);
      doc.text('2. Doorstep technician service applicable across 19,000+ Indian pincodes. For service requests, WhatsApp +91 9876543210.', 30, 165);

      // Bottom Signatures & Auth
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Authorized Signatory: Kirti Store Appliance Assurance Dept.', 30, 184);
      doc.text(`Verify Online: http://localhost:5173/warranty?serial=${certData.serialNumber}`, 267, 184, { align: 'right' });

      // Save PDF
      doc.save(`Kirti-Store-Warranty-${certData.serialNumber || 'Certificate'}.pdf`);
      showSuccess('Warranty PDF Certificate downloaded!');
    } catch (err) {
      console.error('PDF generation error:', err);
      showError('Unable to download PDF. Please take a screenshot of your certificate.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Page Hero Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shadow-sm">
            <Award className="w-4 h-4 text-amber-600" />
            <span>Official Kirti Store Brand Warranty Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-primary tracking-tight">
            Warranty Registration & Digital Certificate
          </h1>
          <p className="text-sm text-charcoal-light max-w-2xl mx-auto">
            Protect your investment. Register your kitchen appliances in under 60 seconds to unlock 2 Years of comprehensive doorstep service, 100% genuine spares, and zero labor fees.
          </p>
        </div>

        {/* Tab Switching Navigation */}
        <div className="flex justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-surface-muted border border-surface-border shadow-sm">
            <button
              onClick={() => setActiveTab('register')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'register'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-charcoal hover:text-primary'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-secondary" />
              <span>Register New Appliance</span>
            </button>
            <button
              onClick={() => setActiveTab('verify')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'verify'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-charcoal hover:text-primary'
              }`}
            >
              <Search className="w-4 h-4 text-secondary" />
              <span>Verify Existing Warranty</span>
            </button>
          </div>
        </div>

        {/* ================= TAB 1: REGISTRATION ================= */}
        {activeTab === 'register' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Form Column */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-surface-border p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-surface-border pb-4">
                <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                  <FileText className="w-5 h-5 text-secondary" />
                  <span>Appliance Registration Form</span>
                </h2>
                <p className="text-xs text-charcoal-light mt-0.5">
                  Enter your appliance details as mentioned on the packaging or purchase invoice.
                </p>
              </div>

              {registeredWarranty ? (
                /* Success Certificate Box */
                <div className="space-y-6 text-center py-4">
                  <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                      Registration Complete
                    </span>
                    <h3 className="text-2xl font-black text-primary mt-1">
                      Warranty Active & Protected!
                    </h3>
                    <p className="text-xs text-charcoal-light mt-1">
                      Certificate No: <span className="font-mono font-bold text-primary">{registeredWarranty.certificateNumber}</span>
                    </p>
                  </div>

                  {/* Certificate Preview Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 border-2 border-amber-200 text-left space-y-3 relative overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Kirti Store Official Assurance</span>
                        <h4 className="font-black text-base text-primary">{registeredWarranty.applianceModel}</h4>
                      </div>
                      <QRCodeSVG 
                        value={`http://localhost:5173/warranty?serial=${registeredWarranty.serialNumber}`}
                        size={52}
                        level="M"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[11px] text-charcoal-light block">Serial Number:</span>
                        <span className="font-mono font-bold text-primary">{registeredWarranty.serialNumber}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-charcoal-light block">Registered Name:</span>
                        <span className="font-semibold text-primary">{registeredWarranty.customerName}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-charcoal-light block">Valid Through:</span>
                        <span className="font-bold text-emerald-600">
                          {new Date(registeredWarranty.warrantyValidUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-charcoal-light block">Coverage Status:</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Check className="w-3 h-3" /> 2-Year Active
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => downloadPdfCertificate(registeredWarranty)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-secondary hover:bg-secondary-700 text-white font-bold text-xs shadow-md transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download PDF Certificate</span>
                    </button>
                    <button
                      onClick={() => {
                        setRegisteredWarranty(null);
                        setFormData(prev => ({ ...prev, serialNumber: '', invoiceNumber: '' }));
                      }}
                      className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-surface-muted hover:bg-slate-200 text-charcoal font-bold text-xs transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Register Another</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  
                  {/* Customer Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-primary mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleInputChange}
                        placeholder="e.g. Aarav Patel"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-xs focus:outline-none focus:border-secondary bg-surface-muted"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-primary mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="customerEmail"
                        value={formData.customerEmail}
                        onChange={handleInputChange}
                        placeholder="aarav@example.com"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-xs focus:outline-none focus:border-secondary bg-surface-muted"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-primary mb-1">
                        WhatsApp / Mobile No <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="customerPhone"
                        value={formData.customerPhone}
                        onChange={handleInputChange}
                        placeholder="+91 9876543210"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-xs focus:outline-none focus:border-secondary bg-surface-muted"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-primary mb-1">
                        Purchase Channel
                      </label>
                      <select
                        name="purchaseChannel"
                        value={formData.purchaseChannel}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-xs focus:outline-none focus:border-secondary bg-surface-muted"
                      >
                        <option value="Kirti Store Online">Kirti Store Online</option>
                        <option value="Kirti Store Showroom">Kirti Store Showroom</option>
                      </select>
                    </div>
                  </div>

                  {/* Appliance Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-surface-border">
                    <div>
                      <label className="block text-xs font-bold text-primary mb-1">
                        Appliance Model <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="applianceModel"
                        value={formData.applianceModel}
                        onChange={handleInputChange}
                        placeholder="e.g. Smart Digital Air Fryer 5.5L"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-xs focus:outline-none focus:border-secondary bg-surface-muted"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-primary mb-1">
                        Serial Number (S/N) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="serialNumber"
                        value={formData.serialNumber}
                        onChange={handleInputChange}
                        placeholder="e.g. KS-AFR-2026-9182"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-xs font-mono uppercase focus:outline-none focus:border-secondary bg-surface-muted"
                      />
                      <p className="text-[10px] text-charcoal-light mt-1">
                        Found on the base barcode label or warranty slip.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-primary mb-1">
                        Date of Purchase
                      </label>
                      <input
                        type="date"
                        name="purchaseDate"
                        value={formData.purchaseDate}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-xs focus:outline-none focus:border-secondary bg-surface-muted"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-primary mb-1">
                        Invoice / Order ID (Optional)
                      </label>
                      <input
                        type="text"
                        name="invoiceNumber"
                        value={formData.invoiceNumber}
                        onChange={handleInputChange}
                        placeholder="e.g. INV-849102"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-xs focus:outline-none focus:border-secondary bg-surface-muted"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-secondary hover:bg-secondary-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{submitting ? 'Registering & Generating Certificate...' : 'Activate 2-Year Official Warranty'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Right Guide & Features Column */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Gold Assurance Banner */}
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-6 text-white shadow-md relative overflow-hidden space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                    <Award className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-200">
                      Zero Hassle Guarantee
                    </span>
                    <h3 className="text-xl font-black">2-Year Official Coverage</h3>
                  </div>
                </div>

                <ul className="text-xs space-y-2 text-amber-50">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
                    <span>Free Doorstep Technician Visit in 48 Hours</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
                    <span>100% Genuine OEM Motor & Spares Replacement</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
                    <span>Zero Labor, Inspection, or Transportation Fees</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
                    <span>Instant WhatsApp Claim Assistance</span>
                  </li>
                </ul>
              </div>

              {/* Where to find Serial Number info card */}
              <div className="bg-white rounded-3xl border border-surface-border p-6 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-secondary" />
                  <span>Where is my Serial Number?</span>
                </h4>
                <div className="space-y-3 text-xs text-charcoal-light">
                  <div className="p-3 bg-surface-muted rounded-xl border border-surface-border space-y-1">
                    <span className="font-bold text-primary block">1. Underside / Base Plate</span>
                    <p>Check the metallic silver sticker on the bottom of air fryers, induction cooktops, and blenders.</p>
                  </div>
                  <div className="p-3 bg-surface-muted rounded-xl border border-surface-border space-y-1">
                    <span className="font-bold text-primary block">2. Retail Carton Barcode</span>
                    <p>Look for the 10-14 digit alphanumeric code beneath the barcode labeled <b>S/N</b> or <b>Serial</b>.</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-surface-border">
                  <a
                    href={getWhatsAppDirectLink(
                      '919876543210',
                      'Hi Kirti Store, I need help finding the serial number for my appliance.'
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>Ask Concierge on WhatsApp</span>
                  </a>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ================= TAB 2: VERIFICATION ================= */}
        {activeTab === 'verify' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl border border-surface-border p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-surface-border pb-4">
                <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                  <Search className="w-5 h-5 text-secondary" />
                  <span>Verify Appliance Warranty Status</span>
                </h2>
                <p className="text-xs text-charcoal-light mt-0.5">
                  Enter your Appliance Serial Number or Certificate Number to inspect coverage validity.
                </p>
              </div>

              <form onSubmit={handleVerifySubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={verifyQuery}
                    onChange={(e) => setVerifyQuery(e.target.value.toUpperCase())}
                    placeholder="Enter Serial No (e.g. KSAFR2026-98124) or Certificate ID"
                    className="w-full px-4 py-3 rounded-xl border border-surface-border text-xs font-mono uppercase focus:outline-none focus:border-secondary bg-surface-muted"
                  />
                </div>
                <button
                  type="submit"
                  disabled={verifying}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-secondary hover:bg-secondary-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  <Search className="w-4 h-4" />
                  <span>{verifying ? 'Checking...' : 'Check Status'}</span>
                </button>
              </form>

              {/* Error Notice */}
              {verifyError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  <span>{verifyError}</span>
                </div>
              )}

              {/* Verified Result Card */}
              {verifiedWarranty && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-amber-50/40 border border-amber-200/80 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold mb-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>OFFICIAL BRAND WARRANTY ACTIVE</span>
                      </div>
                      <h3 className="text-xl font-black text-primary">{verifiedWarranty.applianceModel}</h3>
                      <p className="text-xs text-charcoal-light">
                        Certificate: <span className="font-mono font-bold text-primary">{verifiedWarranty.certificateNumber}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => downloadPdfCertificate(verifiedWarranty)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-primary border border-surface-border font-bold text-xs shadow-sm transition-all"
                    >
                      <Download className="w-4 h-4 text-secondary" />
                      <span>Download PDF</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-surface-border">
                      <span className="text-[11px] text-charcoal-light block">Serial Number</span>
                      <span className="font-mono font-bold text-primary">{verifiedWarranty.serialNumber}</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-surface-border">
                      <span className="text-[11px] text-charcoal-light block">Registered Owner</span>
                      <span className="font-semibold text-primary">{verifiedWarranty.customerNameMasked}</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-surface-border">
                      <span className="text-[11px] text-charcoal-light block">Purchase Date</span>
                      <span className="font-semibold text-primary">
                        {new Date(verifiedWarranty.purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-surface-border">
                      <span className="text-[11px] text-charcoal-light block">Valid Until</span>
                      <span className="font-bold text-emerald-600">
                        {new Date(verifiedWarranty.warrantyValidUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Covered Spares & Benefits */}
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-primary block">Included Coverage Benefits:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-charcoal">
                      {(verifiedWarranty.coverageDetails || []).map((benefit, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-white/80 rounded-lg border border-surface-border">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Doorstep Service Hotline */}
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold text-emerald-950 block">Need Service or Repair?</span>
                      <p className="text-emerald-800">Free doorstep technician visit scheduled within 48 hours for active warranty holders.</p>
                    </div>
                    <a
                      href={getWhatsAppDirectLink(
                        '919876543210',
                        `Hi Kirti Store, I would like to request doorstep service for my appliance with Certificate ${verifiedWarranty.certificateNumber}.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold whitespace-nowrap shadow-sm transition-colors"
                    >
                      Book Service on WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default WarrantyRegistration;
