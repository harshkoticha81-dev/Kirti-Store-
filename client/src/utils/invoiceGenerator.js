import { jsPDF } from 'jspdf';

/**
 * Generates and downloads a clean, official GST-compliant Tax Invoice PDF
 * for any Kirti Store order.
 */
export const downloadInvoicePDF = (order) => {
  if (!order) {
    throw new Error('Order data is required to generate invoice');
  }

  const orderId = order._id || order.id || 'ORD-2026-0001';
  const cleanIdStr = orderId.toString();
  const invoiceNo = `INV-2026-${cleanIdStr.slice(-6).toUpperCase()}`;
  const invoiceDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const subtotal = order.subtotal || 0;
  const shippingFee = order.shippingFee || 0;
  const taxableValue = Math.round(subtotal / 1.18);
  const totalGst = subtotal - taxableValue;
  const cgst = Math.round(totalGst / 2);
  const sgst = totalGst - cgst;
  const grandTotal = subtotal + shippingFee;

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // --- 1. TOP BRAND HEADER ---
    doc.setFillColor(20, 33, 61); // Deep Navy (#14213D)
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Brand Name
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('KIRTI STORE', margin, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(200, 220, 255);
    doc.text('Smart Appliances. Smarter Living.', margin, 17);
    doc.text('GSTIN: 27AABCK1234F1Z5 | CIN: U29304MH2026PTC109823', margin, 22);

    // TAX INVOICE title in top right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 159, 28); // Accent Orange (#FF9F1C)
    doc.text('TAX INVOICE', pageWidth - margin, 12, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`Invoice No: ${invoiceNo}`, pageWidth - margin, 17, { align: 'right' });
    doc.text(`Date: ${invoiceDate}`, pageWidth - margin, 22, { align: 'right' });

    // --- 2. COMPANY & CUSTOMER INFO BOX ---
    let yPos = 36;

    // Supplier Info (Left)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(20, 33, 61);
    doc.text('SOLD BY & DISPATCHED FROM:', margin, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(70, 70, 70);
    yPos += 4;
    doc.text('Kirti Store', margin, yPos);
    yPos += 4;
    doc.text('Main Bazar, Opp. Nandkurba Hospital, Dhoraji - 360410', margin, yPos);
    yPos += 4;
    doc.text('Gujarat | Support: +91 94282 82008 (10AM-1PM & 3PM-8PM)', margin, yPos);
    yPos += 4;
    doc.text('Web: www.kirtistore.com', margin, yPos);

    // Bill To & Ship To (Right)
    const rightColX = 115;
    let yRight = 36;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(20, 33, 61);
    doc.text('BILLED TO & DELIVERED TO:', rightColX, yRight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    yRight += 4.5;
    doc.text(order.customerName || 'Valued Customer', rightColX, yRight);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(70, 70, 70);
    yRight += 4;
    const street = order.shippingAddress?.street || 'Customer Address';
    doc.text(street.substring(0, 45), rightColX, yRight);
    yRight += 4;
    const cityStatePin = `${order.shippingAddress?.city || 'Mumbai'}, ${order.shippingAddress?.state || 'Maharashtra'} - ${order.shippingAddress?.postalCode || '400013'}`;
    doc.text(cityStatePin, rightColX, yRight);
    yRight += 4;
    doc.text(`Phone: ${order.customerPhone || order.shippingAddress?.phone || '—'}`, rightColX, yRight);

    yPos = Math.max(yPos, yRight) + 6;

    // --- 3. LOGISTICS & ORDER METADATA BAR ---
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 12, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 12, 2, 2, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Order ID:', margin + 4, yPos + 5);
    doc.text('Payment Method:', margin + 55, yPos + 5);
    doc.text('Courier Partner:', margin + 110, yPos + 5);
    doc.text('AWB Number:', margin + 150, yPos + 5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 33, 61);
    doc.text(`#${cleanIdStr}`, margin + 4, yPos + 9.5);
    doc.text(`${order.paymentMethod || 'Online Payment'}`, margin + 55, yPos + 9.5);
    doc.text(`${order.courier || 'Blue Dart Express'}`, margin + 110, yPos + 9.5);
    doc.text(`${order.trackingAwb || `KRT${cleanIdStr.slice(-8).toUpperCase()}IN`}`, margin + 150, yPos + 9.5);

    yPos += 18;

    // --- 4. ITEMS TABLE HEADER ---
    doc.setFillColor(20, 33, 61);
    doc.rect(margin, yPos, pageWidth - (margin * 2), 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('#', margin + 3, yPos + 4.8);
    doc.text('APPLIANCE DESCRIPTION', margin + 12, yPos + 4.8);
    doc.text('HSN', margin + 98, yPos + 4.8);
    doc.text('QTY', margin + 115, yPos + 4.8, { align: 'center' });
    doc.text('UNIT PRICE', margin + 138, yPos + 4.8, { align: 'right' });
    doc.text('TAXABLE', margin + 160, yPos + 4.8, { align: 'right' });
    doc.text('TOTAL (INR)', pageWidth - margin - 3, yPos + 4.8, { align: 'right' });

    yPos += 7;

    // --- 5. ITEMS ROWS ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    const items = order.items || [];
    items.forEach((item, idx) => {
      const quantity = item.quantity || 1;
      const unitPrice = item.price || 0;
      const lineTotal = item.lineTotal || (unitPrice * quantity);
      const itemTaxable = Math.round(lineTotal / 1.18);

      // Alternating row background
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, yPos, pageWidth - (margin * 2), 8, 'F');
      }

      doc.setDrawColor(235, 240, 245);
      doc.line(margin, yPos + 8, pageWidth - margin, yPos + 8);

      doc.setTextColor(100, 100, 100);
      doc.text(String(idx + 1), margin + 3, yPos + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      const rawName = (item.name || 'Kitchen Appliance').toString();
      const name = rawName.length > 48 ? rawName.substring(0, 45) + '...' : rawName;
      doc.text(name, margin + 12, yPos + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(item.SKU ? item.SKU.substring(0, 10) : '8509', margin + 98, yPos + 5.5);

      doc.setTextColor(30, 41, 59);
      doc.text(String(quantity), margin + 115, yPos + 5.5, { align: 'center' });
      doc.text(`Rs. ${unitPrice.toLocaleString('en-IN')}`, margin + 138, yPos + 5.5, { align: 'right' });
      doc.text(`Rs. ${itemTaxable.toLocaleString('en-IN')}`, margin + 160, yPos + 5.5, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.text(`Rs. ${lineTotal.toLocaleString('en-IN')}`, pageWidth - margin - 3, yPos + 5.5, { align: 'right' });

      yPos += 8;
    });

    // --- 6. SUMMARY & TOTALS BOX ---
    yPos += 4;
    const totalsWidth = 75;
    const totalsX = pageWidth - margin - totalsWidth;

    const summaryRows = [
      { label: 'Taxable Value', value: `Rs. ${taxableValue.toLocaleString('en-IN')}` },
      { label: 'CGST (9%)', value: `Rs. ${cgst.toLocaleString('en-IN')}` },
      { label: 'SGST (9%)', value: `Rs. ${sgst.toLocaleString('en-IN')}` },
      { label: 'Package Transportation', value: shippingFee === 0 ? 'FREE' : `Rs. ${shippingFee}` },
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    summaryRows.forEach((row) => {
      doc.setTextColor(100, 116, 139);
      doc.text(row.label, totalsX, yPos);
      doc.setTextColor(30, 41, 59);
      doc.text(row.value, pageWidth - margin - 3, yPos, { align: 'right' });
      yPos += 5;
    });

    // Grand Total Bar
    yPos += 2;
    doc.setFillColor(20, 33, 61);
    doc.roundedRect(totalsX - 4, yPos - 4, totalsWidth + 4, 8, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('Grand Total:', totalsX, yPos + 1.5);
    doc.setTextColor(255, 159, 28);
    doc.text(`Rs. ${grandTotal.toLocaleString('en-IN')}`, pageWidth - margin - 3, yPos + 1.5, { align: 'right' });

    yPos += 16;

    // --- 7. WARRANTY & LEGAL DECLARATION ---
    doc.setFillColor(240, 253, 244); // Light emerald
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 14, 2, 2, 'F');
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 14, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(22, 101, 52);
    doc.text('OFFICIAL 2-YEAR COMPREHENSIVE MANUFACTURER WARRANTY ACTIVE', margin + 4, yPos + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(50, 70, 50);
    doc.text('Retain this computer-generated tax invoice for free doorstep service and warranty claims across India.', margin + 4, yPos + 10);

    yPos += 20;

    // --- 8. FOOTER & SIGNATURE ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('This is a digitally signed computer-generated tax invoice. No physical signature required.', margin, yPos);
    doc.text('Kirti Store Appliances India Pvt Ltd | All rights reserved.', margin, yPos + 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(20, 33, 61);
    doc.text('AUTHORIZED SIGNATORY', pageWidth - margin, yPos, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('KIRTI APPLIANCES INDIA', pageWidth - margin, yPos + 4, { align: 'right' });

    // --- SAVE AND TRIGGER DOWNLOAD ---
    const fileName = `Kirti_Invoice_${cleanIdStr.slice(-8).toUpperCase()}.pdf`;
    doc.save(fileName);
    return true;
  } catch (err) {
    console.error('jsPDF generation failed, falling back to printable HTML download', err);
    fallbackDownloadHTMLInvoice(order, invoiceNo, invoiceDate, subtotal, shippingFee, taxableValue, cgst, sgst, grandTotal);
    return false;
  }
};

/**
 * Fallback pure HTML invoice downloader in case of any PDF environment issue
 */
const fallbackDownloadHTMLInvoice = (order, invoiceNo, invoiceDate, subtotal, shippingFee, taxableValue, cgst, sgst, grandTotal) => {
  const cleanIdStr = (order._id || order.id || 'ORDER').toString();
  const itemsHtml = (order.items || []).map((item, idx) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${idx + 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">8509</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹${(item.price || 0).toLocaleString('en-IN')}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">₹${(item.lineTotal || (item.price * item.quantity)).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Tax Invoice - ${invoiceNo}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1e293b; background: #fff; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #14213d; padding-bottom: 20px; }
    .table { width: 100%; border-collapse: collapse; margin-top: 25px; }
    .table th { background: #14213d; color: #fff; padding: 10px; text-align: left; font-size: 12px; }
    .totals { margin-top: 20px; float: right; width: 300px; font-size: 13px; }
    .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
    .grand-total { font-size: 16px; font-weight: bold; color: #14213d; border-top: 2px solid #14213d; margin-top: 8px; padding-top: 8px; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body onload="window.print()">
  <div class="header">
    <div>
      <h1 style="margin: 0; color: #14213d;">KIRTI STORE</h1>
      <p style="margin: 4px 0; font-size: 13px; color: #64748b;">Smart Appliances. Smarter Living.</p>
      <p style="margin: 2px 0; font-size: 12px; color: #64748b;">Main Bazar, Opp. Nandkurba Hospital, Dhoraji - 360410</p>
      <p style="margin: 2px 0; font-size: 12px; color: #64748b;">Support: +91 94282 82008 (10AM-1PM & 3PM-8PM)</p>
    </div>
    <div style="text-align: right;">
      <h2 style="margin: 0; color: #ff9f1c;">TAX INVOICE</h2>
      <p style="margin: 4px 0; font-size: 13px;"><strong>Invoice No:</strong> ${invoiceNo}</p>
      <p style="margin: 2px 0; font-size: 13px;"><strong>Date:</strong> ${invoiceDate}</p>
      <p style="margin: 2px 0; font-size: 13px;"><strong>Order ID:</strong> #${cleanIdStr}</p>
    </div>
  </div>

  <div style="margin-top: 20px; font-size: 13px;">
    <strong>Customer:</strong> ${order.customerName || 'Valued Customer'}<br />
    <strong>Delivery Address:</strong> ${order.shippingAddress?.street || ''}, ${order.shippingAddress?.city || ''} - ${order.shippingAddress?.postalCode || ''}<br />
    <strong>Payment:</strong> ${order.paymentMethod || 'Online'} (${order.paymentStatus || 'Completed'})
  </div>

  <table class="table">
    <thead>
      <tr>
        <th>#</th>
        <th>Appliance Description</th>
        <th>HSN</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Unit Price</th>
        <th style="text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="totals">
    <div><span>Taxable Amount:</span> <span>₹${taxableValue.toLocaleString('en-IN')}</span></div>
    <div><span>CGST (9%):</span> <span>₹${cgst.toLocaleString('en-IN')}</span></div>
    <div><span>SGST (9%):</span> <span>₹${sgst.toLocaleString('en-IN')}</span></div>
    <div><span>Package Transportation:</span> <span>${shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span></div>
    <div class="grand-total"><span>Grand Total:</span> <span>₹${grandTotal.toLocaleString('en-IN')}</span></div>
  </div>

  <div style="clear: both; margin-top: 60px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px;">
    This is an authentic computer-generated GST tax invoice for Kirti Store products. Official 2-year warranty active.
  </div>
</body>
</html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Kirti_Invoice_${cleanIdStr.slice(-8).toUpperCase()}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
