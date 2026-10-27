import React, { useState } from 'react';
import { X, Printer, Download, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { downloadInvoicePDF } from '../../utils/invoiceGenerator';

const TaxInvoiceModal = ({ order, isOpen, onClose }) => {
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || !order) return null;

  const orderId = order._id || order.id || 'ORD-2026-0001';
  const invoiceNo = `INV-2026-${orderId.toString().slice(-6).toUpperCase()}`;
  const invoiceDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    setDownloading(true);
    try {
      downloadInvoicePDF(order);
    } catch (e) {
      console.error('Invoice download error', e);
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  const subtotal = order.subtotal || 0;
  const shippingFee = order.shippingFee || 0;
  // Calculate 18% GST (9% CGST + 9% SGST)
  const taxableValue = Math.round(subtotal / 1.18);
  const totalGst = subtotal - taxableValue;
  const cgst = Math.round(totalGst / 2);
  const sgst = totalGst - cgst;
  const finalTotal = subtotal + shippingFee;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-10 shadow-2xl border border-surface-border text-primary relative print:shadow-none print:border-none print:p-0 print:max-w-none">
        
        {/* Modal Action Bar (Hidden when printing) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-surface-border gap-4 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-secondary" />
            <span className="font-bold text-sm text-primary">Official Tax Invoice (GST Compliant)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-4 py-2 bg-secondary hover:bg-secondary-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95"
              title="Download PDF to computer"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{downloading ? 'Downloading...' : 'Download PDF'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-charcoal rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
              title="Print directly"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-charcoal-light hover:text-primary hover:bg-surface-muted transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="pt-6 space-y-6 print:pt-0" id="printable-invoice">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-6 border-b border-zinc-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-primary tracking-tight">KIRTI STORE</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-secondary rounded">APPLIANCES</span>
              </div>
              <p className="text-xs text-charcoal-light mt-1">Smart Appliances. Smarter Living.</p>
              <div className="text-[11px] text-charcoal-light mt-2 space-y-0.5">
                <p>Kirti Store</p>
                <p>Main Bazar, Opp. Nandkurba Hospital, Dhoraji - 360410</p>
                <p><strong>Support:</strong> +91 94282 82008 (10AM-1PM & 3PM-8PM)</p>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="inline-block px-3 py-1 bg-zinc-900 text-white text-xs font-black uppercase tracking-wider rounded-lg">
                TAX INVOICE
              </span>
              <p className="text-xs font-bold text-primary pt-2">Invoice No: {invoiceNo}</p>
              <p className="text-xs text-charcoal-light">Invoice Date: {invoiceDate}</p>
              <p className="text-xs text-charcoal-light">Order ID: {orderId}</p>
              <p className="text-xs text-charcoal-light">
                Payment: <strong className="text-emerald-700">{order.paymentMethod || 'Online Payment'}</strong>
              </p>
            </div>
          </div>

          {/* Billed To / Shipped To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-zinc-200 text-xs">
            <div className="space-y-1">
              <p className="font-bold text-charcoal uppercase tracking-wider text-[11px]">Billed To & Shipped To</p>
              <p className="font-bold text-primary text-sm">{order.customerName || 'Customer'}</p>
              <p className="text-charcoal-light">{order.shippingAddress?.street}</p>
              {order.shippingAddress?.apartment && <p className="text-charcoal-light">{order.shippingAddress.apartment}</p>}
              <p className="text-charcoal-light">
                {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
              </p>
              <p className="text-charcoal-light">Phone: {order.customerPhone || order.shippingAddress?.phone || '—'}</p>
              <p className="text-charcoal-light">Email: {order.customerEmail || '—'}</p>
            </div>

            <div className="space-y-1 bg-surface-muted/30 p-4 rounded-xl border border-surface-border sm:text-right">
              <p className="font-bold text-charcoal uppercase tracking-wider text-[11px]">Dispatch & Logistics</p>
              <p className="text-charcoal">Fulfillment Partner: <strong>Blue Dart Express</strong></p>
              <p className="text-charcoal">AWB Tracking No: <strong>KRT{orderId.toString().slice(-8).toUpperCase()}IN</strong></p>
              <p className="text-charcoal">Place of Supply: <strong>{order.shippingAddress?.state || 'Maharashtra'} (State Code: 27)</strong></p>
              <p className="text-emerald-700 font-bold">Comprehensive 2-Year Manufacturer Warranty Active</p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-surface-muted border-b border-surface-border text-charcoal-light font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3">HSN Code</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Taxable</th>
                  <th className="py-2.5 px-3 text-right">Total (Incl GST)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {(order.items || []).map((item, idx) => {
                  const itemTotal = item.lineTotal || (item.price * item.quantity);
                  const itemTaxable = Math.round(itemTotal / 1.18);
                  return (
                    <tr key={idx}>
                      <td className="py-3 px-3 text-charcoal-light font-semibold">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-primary">{item.name}</p>
                        <p className="text-[10px] text-charcoal-light">SKU: {item.SKU || 'KRT-APPL'}</p>
                      </td>
                      <td className="py-3 px-3 text-charcoal-light">8509 (Electro-mechanical)</td>
                      <td className="py-3 px-3 text-center font-bold text-primary">{item.quantity}</td>
                      <td className="py-3 px-3 text-right text-charcoal">₹{item.price?.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-right text-charcoal">₹{itemTaxable.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-right font-bold text-primary">₹{itemTotal.toLocaleString('en-IN')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Calculations Summary */}
          <div className="flex justify-end pt-4 border-t border-zinc-200">
            <div className="w-72 space-y-2 text-xs">
              <div className="flex justify-between text-charcoal-light">
                <span>Taxable Amount</span>
                <span>₹{taxableValue.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-charcoal-light">
                <span>CGST (9%)</span>
                <span>₹{cgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-charcoal-light">
                <span>SGST (9%)</span>
                <span>₹{sgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-charcoal-light">
                <span>Package Transportation Charge</span>
                <span className="font-bold text-secondary">
                  {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                </span>
              </div>
              <div className="pt-2 border-t border-zinc-300 flex justify-between font-black text-sm text-primary">
                <span>Grand Total</span>
                <span className="text-base">₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Footer declaration */}
          <div className="pt-6 border-t border-zinc-200 text-[11px] text-charcoal-light flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>
              This is a computer-generated tax invoice. No signature required. Valid for manufacturer warranty and tax deduction.
            </p>
            <div className="text-right">
              <span className="text-[10px] font-bold text-secondary uppercase">Authorized Signatory</span>
              <p className="font-bold text-primary text-xs">KIRTI STORE APPLIANCES</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TaxInvoiceModal;
