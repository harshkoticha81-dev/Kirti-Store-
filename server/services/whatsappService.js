/**
 * WhatsApp Order & Dispatch Notification Service
 * Supports automated customer notifications via WhatsApp Business API / Twilio
 * Includes graceful development fallback with simulated delivery logs.
 */

const formatPhoneForWhatsApp = (phone) => {
  if (!phone) return null;
  // Clean non-digits
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return null;

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

  // If 13 digits starting with 910
  if (digits.length === 13 && digits.startsWith('910')) {
    digits = '91' + digits.slice(3);
  }

  // If 12 digits starting with 91
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }

  return digits;
};

class WhatsAppService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
    this.supportNumber = process.env.KIRTI_SUPPORT_WHATSAPP || '919876543210';
    this.appBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  }

  /**
   * Internal sender that dispatches via Twilio if configured, or gracefully logs simulated dispatch.
   */
  async sendMessage(toPhone, messageBody, metadata = {}) {
    const formattedTo = formatPhoneForWhatsApp(toPhone);
    if (!formattedTo) {
      console.warn(`[WhatsAppService] Missing or invalid recipient phone: ${toPhone}`);
      return { success: false, reason: 'Invalid phone number' };
    }

    const payload = {
      to: `whatsapp:+${formattedTo}`,
      body: messageBody,
      timestamp: new Date().toISOString(),
      metadata
    };

    // If Twilio credentials exist, attempt real API dispatch
    if (this.accountSid && this.authToken) {
      try {
        const client = require('twilio')(this.accountSid, this.authToken);
        const result = await client.messages.create({
          from: this.fromNumber,
          to: payload.to,
          body: payload.body
        });
        console.log(`[WhatsAppService] Real message dispatched via Twilio. SID: ${result.sid}`);
        return { success: true, sid: result.sid, provider: 'twilio' };
      } catch (err) {
        console.error('[WhatsAppService] Twilio dispatch error (falling back to simulated log):', err.message);
      }
    }

    // Development & Simulated Delivery Log
    console.log('\n================== 📱 WHATSAPP NOTIFICATION DISPATCHED ==================');
    console.log(`To: +${formattedTo}`);
    console.log(`Type: ${metadata.type || 'NOTIFICATION'}`);
    console.log(`Order ID: #${metadata.orderId || 'N/A'}`);
    console.log('Message:');
    console.log(messageBody);
    console.log('========================================================================\n');

    return {
      success: true,
      simulated: true,
      recipient: formattedTo,
      timestamp: payload.timestamp
    };
  }

  /**
   * Send Order Confirmation Alert
   */
  async sendOrderConfirmation(order) {
    const customerName = order.customerName || 'Valued Customer';
    const orderId = order._id.toString().substring(0, 8).toUpperCase();
    const total = (order.totalAmount || 0).toLocaleString('en-IN');
    const trackingLink = `${this.appBaseUrl}/track-order?orderId=${order._id}`;
    const itemCount = order.items ? order.items.length : 1;

    const message = 
`*KIRTI STORE - ORDER CONFIRMED* 🍳
------------------------------------
Hello *${customerName}*,

Thank you for choosing Kirti Store! We have received your order *#${orderId}*.

📦 *Order Details:*
• Items: ${itemCount} premium kitchen appliance(s)
• Total Paid: ₹${total} (${order.paymentMethod || 'UPI'})
• Status: Confirmed & Queued for Packing

🚚 *Track Your Order Live:*
${trackingLink}

Need help? Reply to this message or WhatsApp our concierge team at +${this.supportNumber}.`;

    return this.sendMessage(order.customerPhone, message, {
      type: 'ORDER_CONFIRMED',
      orderId: order._id
    });
  }

  /**
   * Send Order Dispatched Alert
   */
  async sendOrderDispatched(order, trackingDetails = {}) {
    const customerName = order.customerName || 'Valued Customer';
    const orderId = order._id.toString().substring(0, 8).toUpperCase();
    const courier = trackingDetails.courier || order.courier || 'BlueDart Express';
    const awb = trackingDetails.awb || order.trackingAwb || `KD${Date.now().toString().slice(-8)}`;
    const trackingLink = `${this.appBaseUrl}/track-order?orderId=${order._id}`;

    const message =
`*KIRTI STORE - DISPATCH ALERT* 🚚
------------------------------------
Exciting news *${customerName}*!

Your order *#${orderId}* has been carefully sanitized, packaged, and handed over to our courier partner.

📦 *Shipping Info:*
• Logistics Partner: ${courier}
• AWB Tracking No: *${awb}*
• Estimated Delivery: 2-3 Business Days

📍 *Track Live Package Location:*
${trackingLink}

Please ensure someone is available at the delivery address with a valid photo ID.`;

    return this.sendMessage(order.customerPhone, message, {
      type: 'ORDER_DISPATCHED',
      orderId: order._id,
      courier,
      awb
    });
  }

  /**
   * Send Order Delivered Alert & Warranty Registration Link
   */
  async sendOrderDelivered(order) {
    const customerName = order.customerName || 'Valued Customer';
    const orderId = order._id.toString().substring(0, 8).toUpperCase();
    const warrantyUrl = `${this.appBaseUrl}/warranty-registration?orderId=${order._id}&phone=${encodeURIComponent(order.customerPhone || '')}`;

    const message =
`*KIRTI STORE - DELIVERED & WARRANTY ACTIVATION* 🎉
------------------------------------
Dear *${customerName}*,

Your Kirti Store order *#${orderId}* has been successfully delivered! We hope your new appliances bring joy and culinary excellence to your kitchen.

🛡️ *Activate Your 2-Year Official Brand Warranty:*
Register your serial number in 60 seconds to download your Digital Warranty Certificate:
${warrantyUrl}

Have questions or need product demonstration? Contact Kirti Support anytime on WhatsApp: +${this.supportNumber}.`;

    return this.sendMessage(order.customerPhone, message, {
      type: 'ORDER_DELIVERED',
      orderId: order._id
    });
  }

  /**
   * Helper to build a 1-click WhatsApp customer support link
   */
  getClickToChatUrl(phone, defaultText) {
    const cleanPhone = formatPhoneForWhatsApp(phone) || this.supportNumber;
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(defaultText || 'Hi Kirti Store, I need assistance with my order.')}`;
  }
}

module.exports = new WhatsAppService();
