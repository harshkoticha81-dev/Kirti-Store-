import api from '../services/api';

// In-memory cache for ultra-fast instant lookups during user session
const clientPincodeCache = new Map();

// Offline fallback dictionary for major Indian metropolitan & commercial hubs
const OFFLINE_PINCODES = {
  '110001': { city: 'New Delhi', state: 'Delhi', district: 'Central Delhi' },
  '110019': { city: 'New Delhi', state: 'Delhi', district: 'South Delhi' },
  '110085': { city: 'Delhi', state: 'Delhi', district: 'North West Delhi' },
  '122001': { city: 'Gurugram', state: 'Haryana', district: 'Gurgaon' },
  '201301': { city: 'Noida', state: 'Uttar Pradesh', district: 'Gautam Buddha Nagar' },
  '302001': { city: 'Jaipur', state: 'Rajasthan', district: 'Jaipur' },
  '380001': { city: 'Ahmedabad', state: 'Gujarat', district: 'Ahmedabad' },
  '395001': { city: 'Surat', state: 'Gujarat', district: 'Surat' },
  '360001': { city: 'Rajkot', state: 'Gujarat', district: 'Rajkot', localities: ['Rajkot HO', 'Dharmendra Road', 'Yagnik Road', 'Kalavad Road', 'Mavdi', 'Jubilee Chowk'] },
  '360410': { 
    city: 'Dhoraji', 
    state: 'Gujarat', 
    district: 'Rajkot', 
    localities: [
      'Station Plot',
      'LIC Street / LIC Colony',
      'Dhoraji Town',
      'Galaxy Chowk',
      'Junagadh Road',
      'Vadi Plot',
      'Bada Darwaja',
      'Darbar Gadh',
      'Navagadh Road',
      'Upleta Road',
      'Tran Darwaja',
      'Vegetable Market',
      'Bapu Ni Vadi',
      'Ganeshnagar',
      'Kharva Plot',
      'Bhader',
      'Bhola',
      'Bhukhi',
      'Chhadvavadar',
      'Chhatrasa',
      'Chikhaliya',
      'Dudhivadar',
      'Jamnavad',
      'Kalana',
      'Nagalkhada',
      'Pipaliya',
      'Raidi',
      'Roghel',
      'Vadodar'
    ] 
  },
  '400001': { city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai' },
  '400013': { city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai' },
  '400050': { city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai Suburban' },
  '400053': { city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai Suburban' },
  '400601': { city: 'Thane', state: 'Maharashtra', district: 'Thane' },
  '400703': { city: 'Navi Mumbai', state: 'Maharashtra', district: 'Thane' },
  '411001': { city: 'Pune', state: 'Maharashtra', district: 'Pune' },
  '411057': { city: 'Pune', state: 'Maharashtra', district: 'Pune' },
  '440001': { city: 'Nagpur', state: 'Maharashtra', district: 'Nagpur' },
  '452001': { city: 'Indore', state: 'Madhya Pradesh', district: 'Indore' },
  '500001': { city: 'Hyderabad', state: 'Telangana', district: 'Hyderabad' },
  '500081': { city: 'Hyderabad', state: 'Telangana', district: 'Rangareddy' },
  '530001': { city: 'Visakhapatnam', state: 'Andhra Pradesh', district: 'Visakhapatnam' },
  '560001': { city: 'Bengaluru', state: 'Karnataka', district: 'Bengaluru Urban' },
  '560034': { city: 'Bengaluru', state: 'Karnataka', district: 'Bengaluru Urban' },
  '560066': { city: 'Bengaluru', state: 'Karnataka', district: 'Bengaluru Urban' },
  '600001': { city: 'Chennai', state: 'Tamil Nadu', district: 'Chennai' },
  '641001': { city: 'Coimbatore', state: 'Tamil Nadu', district: 'Coimbatore' },
  '682001': { city: 'Kochi', state: 'Kerala', district: 'Ernakulam' },
  '700001': { city: 'Kolkata', state: 'West Bengal', district: 'Kolkata' },
  '751001': { city: 'Bhubaneswar', state: 'Odisha', district: 'Khurda' },
  '781001': { city: 'Guwahati', state: 'Assam', district: 'Kamrup' },
  '800001': { city: 'Patna', state: 'Bihar', district: 'Patna' }
};

export const isValidPincode = (val) => {
  return /^\d{6}$/.test(String(val).trim());
};

/**
 * Automatically fetch city and state information for any 6-digit Indian PIN code.
 * 
 * Strategy:
 * 1. Check client session cache
 * 2. Query application backend /api/pincode/:pincode
 * 3. Fallback to direct public India Postal API if backend is unavailable
 * 4. Fallback to client-side curated lookup table
 */
export const lookupPincode = async (pincode) => {
  const pin = String(pincode).trim();
  if (!isValidPincode(pin)) {
    return {
      success: false,
      message: 'PIN code must be exactly 6 digits.'
    };
  }

  // 1. Check in-memory cache
  if (clientPincodeCache.has(pin)) {
    return clientPincodeCache.get(pin);
  }

  // 2. Query our backend API endpoint
  try {
    const res = await api.get(`/pincode/${pin}`, { timeout: 3500 });
    if (res.data && res.data.success) {
      clientPincodeCache.set(pin, res.data);
      return res.data;
    }
  } catch (backendErr) {
    console.warn('Backend pincode route fallback, trying direct public API:', backendErr.message);
  }

  // 3. Direct Public Postal API Fallback
  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data[0] && data[0].Status === 'Success' && data[0].PostOffice?.length > 0) {
        const po = data[0].PostOffice;
        let city = po[0].District || po[0].Name || 'India';
        if (/^bangalore/i.test(city)) city = 'Bengaluru';
        if (/^bombay/i.test(city)) city = 'Mumbai';
        if (/^calcutta/i.test(city)) city = 'Kolkata';
        if (/^madras/i.test(city)) city = 'Chennai';

        const result = {
          success: true,
          pincode: pin,
          city,
          state: po[0].State || 'India',
          district: po[0].District || city,
          localities: Array.from(new Set(po.map(p => p.Name).filter(Boolean))),
          formatted: `${city}, ${po[0].State}`
        };
        clientPincodeCache.set(pin, result);
        return result;
      }
    }
  } catch (publicApiErr) {
    console.warn('Direct postal API fallback note:', publicApiErr.message);
  }

  // 4. Offline Curated Fallback
  if (OFFLINE_PINCODES[pin]) {
    const fallback = {
      success: true,
      pincode: pin,
      ...OFFLINE_PINCODES[pin],
      localities: [],
      formatted: `${OFFLINE_PINCODES[pin].city}, ${OFFLINE_PINCODES[pin].state}`
    };
    clientPincodeCache.set(pin, fallback);
    return fallback;
  }

  return {
    success: false,
    message: 'Could not automatically detect city for this PIN code. You can enter your city manually.'
  };
};

export default lookupPincode;
