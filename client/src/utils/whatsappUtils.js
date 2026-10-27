/**
 * WhatsApp Helper Utilities for Kirti Store
 * Robust phone number normalization and cross-platform WhatsApp direct message launchers
 */

/**
 * Normalizes any Indian / International phone number into a valid WhatsApp recipient format.
 * Handles:
 * - 10 digits: "9876543210" -> "919876543210"
 * - Leading zero: "09876543210" -> "919876543210"
 * - Plus and country code: "+91 98765 43210" -> "919876543210"
 * - Country code with zero: "+91 09876543210" -> "919876543210"
 * - Extra spaces, hyphens, parentheses, etc.
 */
export const normalizeWhatsAppPhone = (phone) => {
  if (!phone) return '';
  
  // Strip all non-numeric characters
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';

  // Strip international double-zero prefixes (e.g. 0091...)
  if (digits.startsWith('0091')) {
    digits = digits.slice(2);
  }

  // Strip leading 0s while length > 10 (e.g. 098..., 0098...)
  while (digits.startsWith('0') && digits.length > 10) {
    digits = digits.slice(1);
  }

  // If 10 digits (standard Indian mobile starting with 6, 7, 8, 9)
  if (digits.length === 10) {
    return `91${digits}`;
  }

  // If 13 digits starting with 910 (e.g. +91 098...)
  if (digits.length === 13 && digits.startsWith('910')) {
    digits = '91' + digits.slice(3);
  }

  // If 12 digits starting with 91
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }

  return digits;
};

/**
 * Validates whether a phone number can be reached on WhatsApp.
 */
export const isValidWhatsAppNumber = (phone) => {
  const normalized = normalizeWhatsAppPhone(phone);
  // Valid Indian WhatsApp number has 12 digits starting with 91 and mobile starting with 6, 7, 8, or 9
  return /^91[6-9]\d{9}$/.test(normalized);
};

/**
 * Generates an official WhatsApp universal send link.
 * Uses `https://api.whatsapp.com/send` which works across:
 * - WhatsApp Mobile App (Android/iOS)
 * - WhatsApp Desktop Application
 * - WhatsApp Web in browsers (bypassing wa.me redirect bugs)
 */
export const getWhatsAppDirectLink = (phone, text = '') => {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return '#';
  
  const encodedText = encodeURIComponent(text);
  return `https://api.whatsapp.com/send?phone=${normalized}${encodedText ? `&text=${encodedText}` : ''}`;
};

/**
 * Direct launcher that safely opens WhatsApp in a new tab or app without getting blocked.
 */
export const openWhatsAppDirect = (phone, text = '') => {
  const link = getWhatsAppDirectLink(phone, text);
  if (!link || link === '#') return false;

  const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  try {
    if (isMobile) {
      window.location.href = link;
      return true;
    } else {
      const newWin = window.open(link, '_blank', 'noopener,noreferrer');
      if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
        const a = document.createElement('a');
        a.href = link;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      return true;
    }
  } catch (err) {
    console.warn('Error opening WhatsApp link:', err);
    return false;
  }
};

/**
 * Builds a formatted WhatsApp order confirmation message receipt for the customer.
 */
export const formatOrderWhatsAppMessage = (order) => {
  if (!order) return '';
  const customerName = order.customerName || 'Valued Customer';
  const orderId = order._id ? order._id.toString().substring(0, 8).toUpperCase() : 'NEW';
  const total = (order.totalAmount || 0).toLocaleString('en-IN');
  const appBaseUrl = window.location.origin;
  const itemCount = order.items ? order.items.length : 1;

  return (
`*KIRTI APPLIANCES - ORDER CONFIRMATION* 🍳
------------------------------------
Hello *${customerName}*,

Your order *#${orderId}* has been confirmed!

📦 *Order Details:*
• Items: ${itemCount} premium kitchen appliance(s)
• Total: ₹${total} (${order.paymentMethod || 'UPI'})
• Status: Confirmed & Preparing for Dispatch

📍 *Delivery Address:*
${order.shippingAddress?.street || ''}, ${order.shippingAddress?.city || ''} - ${order.shippingAddress?.postalCode || ''}

🚚 *Live Order Tracking:*
${appBaseUrl}/track-order?orderId=${order._id || ''}

🛡️ *Activate 2-Year Official Brand Warranty:*
${appBaseUrl}/warranty-registration?orderId=${order._id || ''}

Thank you for choosing Kirti Store! Need assistance? Reply to this message.`
  );
};

/**
 * Builds an official WhatsApp delivery address verification template
 * Used by admin/dispatch team before booking courier consignment to prevent Return to Origin (RTO).
 */
export const formatRtoVerificationMessage = (order) => {
  if (!order) return '';
  const customerName = order.customerName || 'Valued Customer';
  const orderId = order._id ? order._id.toString().substring(0, 8).toUpperCase() : 'ORDER';
  const street = order.shippingAddress?.street || '';
  const apartment = order.shippingAddress?.apartment ? `${order.shippingAddress.apartment}, ` : '';
  const city = order.shippingAddress?.city || '';
  const state = order.shippingAddress?.state || '';
  const postalCode = order.shippingAddress?.postalCode || '';
  const firstItem = order.items?.[0]?.name || 'Kitchen Appliance';

  return (
`*KIRTI APPLIANCES - ADDRESS VERIFICATION* 📦
------------------------------------
Namaste *${customerName}*,

Greetings from Kirti Appliances Dispatch Desk! We are preparing your order *#${orderId}* (${firstItem}) for express dispatch via *Blue Dart Express*.

📍 *Please confirm your complete doorstep address:*
${street}
${apartment}${city}, ${state} - ${postalCode}

👉 *Please reply with:*
• *'YES'* if this address & landmark are 100% correct.
• Or reply with your *House/Flat Number* and *Nearest Landmark* to avoid any delivery delay or courier return.

Thank you,
*Kirti Appliances Logistics Team*
Dhoraji Hub | Support: +91 94282 82008`
  );
};

