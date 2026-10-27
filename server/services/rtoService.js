/**
 * RTO (Return to Origin) Risk Detection Service
 * Analyzes order addresses, pincodes, phone numbers, and payment status to detect high-risk orders
 * and prompt warehouse / dispatch admins to verify addresses on WhatsApp prior to booking courier.
 */

const REMOTE_PINCODE_PREFIXES = [
  '79',  // North East remote hill tracts (Nagaland, Mizoram, Arunachal, Manipur, Tripura)
  '19',  // Remote Jammu & Kashmir / Ladakh border outposts
  '744', // Andaman & Nicobar Islands
  '682'  // Lakshadweep Islands
];

const METRO_PINCODE_PREFIXES = [
  '11', // Delhi NCR
  '40', // Mumbai, Thane, Navi Mumbai
  '56', // Bengaluru
  '50', // Hyderabad
  '60', // Chennai
  '70', // Kolkata
  '38', // Ahmedabad
  '41', // Pune
  '36'  // Rajkot / Saurashtra
];

const DUMMY_PHONE_PATTERNS = [
  '0000000000',
  '1111111111',
  '2222222222',
  '3333333333',
  '4444444444',
  '5555555555',
  '6666666666',
  '7777777777',
  '8888888888',
  '9999999999',
  '1234567890',
  '0123456789'
];

/**
 * Calculates RTO Risk for an order
 * @param {Object} orderData - Order payload or document
 * @param {Object} options - Optional parameters (e.g. repeat customer stats)
 * @returns {Object} { riskLevel: 'LOW'|'MEDIUM'|'HIGH', riskScore: number, flags: Array }
 */
function calculateRtoRisk(orderData, options = {}) {
  // If already manually verified by admin, return low risk
  if (orderData.rtoRisk?.addressVerified) {
    return {
      riskLevel: 'LOW',
      riskScore: 5,
      flags: [
        {
          code: 'ADDRESS_VERIFIED',
          severity: 'info',
          message: `Address confirmed with customer via WhatsApp (Verified by ${orderData.rtoRisk.verifiedBy || 'Dispatch Admin'})`
        }
      ],
      addressVerified: true,
      verifiedBy: orderData.rtoRisk.verifiedBy || '',
      verifiedAt: orderData.rtoRisk.verifiedAt || null,
      verificationNotes: orderData.rtoRisk.verificationNotes || ''
    };
  }

  const shipping = orderData.shippingAddress || {};
  const street = (shipping.street || '').trim();
  const apartment = (shipping.apartment || shipping.landmark || '').trim();
  const city = (shipping.city || '').trim();
  const pincode = (shipping.postalCode || shipping.pincode || '').trim();
  const phone = (orderData.customerPhone || shipping.phone || '').trim().replace(/[\s\-\+]/g, '');
  const paymentMethod = (orderData.paymentMethod || '').toLowerCase();
  const hasUpiTxnId = Boolean(orderData.upiTransactionId && orderData.upiTransactionId.trim());
  const hasPaymentScreenshot = Boolean(orderData.paymentScreenshot && orderData.paymentScreenshot.trim());

  let score = 20; // baseline risk score
  const flags = [];

  // ==========================================
  // 1. Street Address Length & Completeness
  // ==========================================
  if (!street || street.length < 12) {
    score += 35;
    flags.push({
      code: 'STREET_CRITICALLY_SHORT',
      severity: 'danger',
      label: 'Street Address Critically Short',
      penalty: 35,
      message: `Street address is critically short (${street.length || 0} chars). Missing house/building details.`
    });
  } else if (street.length < 22) {
    score += 15;
    flags.push({
      code: 'STREET_BRIEF',
      severity: 'warning',
      label: 'Brief Street Address',
      penalty: 15,
      message: 'Street address is brief. Recommend checking house number and street name.'
    });
  } else {
    score -= 5;
    flags.push({
      code: 'DETAILED_STREET',
      severity: 'info',
      label: 'Detailed Street Provided',
      penalty: -5,
      message: 'Detailed street address provided.'
    });
  }

  // Check for House / Flat / Door Number
  const fullAddress = `${street} ${apartment}`.toLowerCase();
  const hasDigits = /\d+/.test(fullAddress);
  const houseKeywords = ['flat', 'plot', 'h.no', 'house', 'door', 'room', 'bldg', 'building', 'floor', 'block', 'sector', 'gali', 'society', 'residency', 'tower', 'chawl', 'bungalow', 'villa', 'apt', 'apartment', 'unit', 'suite'];
  const hasHouseKeyword = houseKeywords.some(kw => fullAddress.includes(kw));

  if (!hasDigits && !hasHouseKeyword) {
    score += 20;
    flags.push({
      code: 'MISSING_HOUSE_NUMBER',
      severity: 'warning',
      label: 'Missing House / Flat Number',
      penalty: 20,
      message: 'No clear flat/house number, floor, or building name detected in address.'
    });
  }

  // Check for Landmark or Locality
  const landmarkKeywords = ['near', 'opp', 'opposite', 'behind', 'next to', 'beside', 'adjacent', 'cross', 'chowk', 'road', 'marg', 'temple', 'mandir', 'hospital', 'school', 'station', 'market', 'colony', 'nagar', 'circle', 'bypass'];
  const hasLandmark = apartment.length > 0 || landmarkKeywords.some(kw => fullAddress.includes(kw));

  if (!hasLandmark) {
    score += 10;
    flags.push({
      code: 'NO_LANDMARK',
      severity: 'warning',
      label: 'No Landmark Specified',
      penalty: 10,
      message: 'No prominent landmark provided for delivery driver doorstep navigation.'
    });
  } else {
    score -= 5;
    flags.push({
      code: 'LANDMARK_AVAILABLE',
      severity: 'info',
      label: 'Landmark Available',
      penalty: -5,
      message: 'Prominent landmark or apartment/area specified.'
    });
  }

  // Check for Suspicious / Test repeated address text
  if (/^(.)\1{4,}/.test(street) || /test|asdf|qwerty|xxxx/i.test(street)) {
    score += 40;
    flags.push({
      code: 'SUSPICIOUS_TEXT',
      severity: 'danger',
      message: 'Address contains suspicious test or repetitive characters.'
    });
  }

  // ==========================================
  // 2. PIN Code Regional Heuristics
  // ==========================================
  if (!pincode || !/^[1-9][0-9]{5}$/.test(pincode)) {
    score += 45;
    flags.push({
      code: 'INVALID_PINCODE',
      severity: 'danger',
      label: 'Invalid PIN Code',
      penalty: 45,
      description: `Invalid 6-digit Indian PIN code (${pincode || 'None'}).`,
      message: `Invalid 6-digit Indian PIN code (${pincode || 'None'}).`
    });
  } else {
    const isRemote = REMOTE_PINCODE_PREFIXES.some(prefix => pincode.startsWith(prefix));
    const isMetro = METRO_PINCODE_PREFIXES.some(prefix => pincode.startsWith(prefix));

    if (isRemote) {
      score += 20;
      flags.push({
        code: 'REMOTE_TRANSIT_PINCODE',
        severity: 'warning',
        label: 'Remote Transit Pincode',
        penalty: 20,
        description: `PIN ${pincode} is in a remote / hill-tract transit zone with higher courier non-delivery rates.`,
        message: `PIN ${pincode} is in a remote / hill-tract transit zone with higher courier non-delivery rates.`
      });
    } else if (isMetro) {
      score -= 10;
      flags.push({
        code: 'METRO_DELIVERY_HUB',
        severity: 'info',
        label: 'Metro Logistics Corridor',
        penalty: -10,
        description: `PIN ${pincode} is in a high-density express metro courier delivery corridor.`,
        message: `PIN ${pincode} is in a high-density express metro courier delivery corridor.`
      });
    }
  }

  // ==========================================
  // 3. Customer Mobile Number Quality
  // ==========================================
  const cleanPhone = phone.startsWith('91') && phone.length === 12 ? phone.substring(2) : phone;

  if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
    score += 35;
    flags.push({
      code: 'INVALID_PHONE_FORMAT',
      severity: 'danger',
      label: 'Invalid Phone Number',
      penalty: 35,
      description: 'Customer phone is not a valid 10-digit Indian mobile number.',
      message: 'Customer phone is not a valid 10-digit Indian mobile number.'
    });
  } else if (DUMMY_PHONE_PATTERNS.includes(cleanPhone)) {
    score += 50;
    flags.push({
      code: 'DUMMY_PHONE_NUMBER',
      severity: 'danger',
      label: 'Dummy / Test Phone',
      penalty: 50,
      description: `Customer phone appears to be a dummy/repeating number (${cleanPhone}).`,
      message: `Customer phone appears to be a dummy/repeating number (${cleanPhone}).`
    });
  } else {
    score -= 5;
    flags.push({
      code: 'VALID_PHONE',
      severity: 'info',
      label: 'Valid Mobile Verified',
      penalty: -5,
      description: `Valid 10-digit mobile number linked (+91 ${cleanPhone}).`,
      message: `Valid 10-digit mobile number linked (+91 ${cleanPhone}).`
    });
  }

  // ==========================================
  // 4. Payment Intent & Proof Risk
  // ==========================================
  if (paymentMethod.includes('cash on delivery') || paymentMethod === 'cod') {
    score += 30;
    flags.push({
      code: 'COD_HIGH_REFUSAL_RISK',
      severity: 'warning',
      label: 'Cash on Delivery (High Refusal Risk)',
      penalty: 30,
      description: 'Cash on delivery carries higher customer refusal & RTO risk at doorstep.',
      message: 'Cash on delivery carries higher customer refusal & RTO risk at doorstep.'
    });
  } else if (hasUpiTxnId || hasPaymentScreenshot) {
    score -= 25;
    flags.push({
      code: 'PAYMENT_PROOF_RECORDED',
      severity: 'info',
      label: 'Prepaid Advance Verified',
      penalty: -25,
      description: '100% advance UPI payment proof / UTR verified.',
      message: '100% advance UPI payment proof / UTR verified.'
    });
  } else {
    score += 10;
    flags.push({
      code: 'PAYMENT_PROOF_PENDING',
      severity: 'warning',
      label: 'Payment Proof Pending',
      penalty: 10,
      description: 'Online payment proof / transaction screenshot not yet uploaded.',
      message: 'Online payment proof / transaction screenshot not yet uploaded.'
    });
  }

  // ==========================================
  // 5. Repeat Customer History
  // ==========================================
  if (options.hasPastDeliveredOrders) {
    score -= 20;
    flags.push({
      code: 'REPEAT_SUCCESSFUL_CUSTOMER',
      severity: 'info',
      message: 'Customer has successfully received previous Kirti Store orders.'
    });
  }
  if (options.hasPastRtoOrders) {
    score += 30;
    flags.push({
      code: 'PREVIOUS_RTO_HISTORY',
      severity: 'danger',
      message: 'Customer phone has previous returned or unaccepted orders on record.'
    });
  }

  // Clamp final score between 0 and 100
  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  let riskLevel = 'LOW';
  if (finalScore >= 50) {
    riskLevel = 'HIGH';
  } else if (finalScore >= 25) {
    riskLevel = 'MEDIUM';
  }

  return {
    riskLevel,
    riskScore: finalScore,
    flags,
    addressVerified: false,
    verifiedBy: '',
    verifiedAt: null,
    verificationNotes: ''
  };
}

module.exports = {
  calculateRtoRisk,
  REMOTE_PINCODE_PREFIXES,
  METRO_PINCODE_PREFIXES
};
