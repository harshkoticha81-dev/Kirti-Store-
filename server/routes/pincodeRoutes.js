const express = require('express');
const router = express.Router();

// In-memory cache for ultra-fast repetitive lookups
const pincodeCache = new Map();

// Comprehensive curated mapping of popular and hub Indian pincodes
const KNOWN_PINCODES = {
  '110001': { city: 'New Delhi', state: 'Delhi', district: 'Central Delhi', localities: ['Connaught Place', 'Sansad Marg', 'Janpath'] },
  '110002': { city: 'New Delhi', state: 'Delhi', district: 'Central Delhi', localities: ['Daryaganj', 'Delhi Gate'] },
  '110019': { city: 'New Delhi', state: 'Delhi', district: 'South Delhi', localities: ['Kalkaji', 'Nehru Place'] },
  '110020': { city: 'New Delhi', state: 'Delhi', district: 'South Delhi', localities: ['Okhla Industrial Area', 'Harkesh Nagar'] },
  '110025': { city: 'New Delhi', state: 'Delhi', district: 'South Delhi', localities: ['Jamia Nagar', 'New Friends Colony'] },
  '110085': { city: 'Delhi', state: 'Delhi', district: 'North West Delhi', localities: ['Rohini Sector 7', 'Rohini Sector 8'] },
  '122001': { city: 'Gurugram', state: 'Haryana', district: 'Gurgaon', localities: ['Gurgaon HO', 'Old Railway Road'] },
  '122002': { city: 'Gurugram', state: 'Haryana', district: 'Gurgaon', localities: ['DLF Phase 1', 'Sushant Lok'] },
  '122018': { city: 'Gurugram', state: 'Haryana', district: 'Gurgaon', localities: ['Sector 37', 'Hero Honda Chowk'] },
  '201301': { city: 'Noida', state: 'Uttar Pradesh', district: 'Gautam Buddha Nagar', localities: ['Sector 1', 'Sector 15', 'Noida HO'] },
  '201304': { city: 'Noida', state: 'Uttar Pradesh', district: 'Gautam Buddha Nagar', localities: ['Sector 93', 'Sector 105', 'Expressway'] },
  '201001': { city: 'Ghaziabad', state: 'Uttar Pradesh', district: 'Ghaziabad', localities: ['Ghaziabad HO', 'Navyug Market'] },
  '302001': { city: 'Jaipur', state: 'Rajasthan', district: 'Jaipur', localities: ['M.I. Road', 'Johari Bazar', 'Pink City'] },
  '302017': { city: 'Jaipur', state: 'Rajasthan', district: 'Jaipur', localities: ['Malviya Nagar', 'Jagatpura'] },
  '380001': { city: 'Ahmedabad', state: 'Gujarat', district: 'Ahmedabad', localities: ['Bhadra', 'Relief Road', 'Lal Darwaja'] },
  '380015': { city: 'Ahmedabad', state: 'Gujarat', district: 'Ahmedabad', localities: ['Satellite', 'Vastrapur', 'IIM Road'] },
  '390001': { city: 'Vadodara', state: 'Gujarat', district: 'Vadodara', localities: ['Sayajiganj', 'Raopura'] },
  '395001': { city: 'Surat', state: 'Gujarat', district: 'Surat', localities: ['Surat HO', 'Chowk Bazar'] },
  '360001': { city: 'Rajkot', state: 'Gujarat', district: 'Rajkot', localities: ['Rajkot HO', 'Dharmendra Road', 'Yagnik Road', 'Kalavad Road', 'Mavdi', 'Jubilee Chowk'] },
  '360005': { city: 'Rajkot', state: 'Gujarat', district: 'Rajkot', localities: ['150 Feet Ring Road', 'University Road', 'Nana Mava', 'Raiya Road', 'Indira Circle'] },
  '360370': { city: 'Gondal', state: 'Gujarat', district: 'Rajkot', localities: ['Gondal HO', 'Station Road', 'Gundala Street', 'Bus Stand Area', 'College Road'] },
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
      'Tran Darwaja (Three Gates)',
      'Vegetable Market (Shak Market)',
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
  '360490': { city: 'Upleta', state: 'Gujarat', district: 'Rajkot', localities: ['Upleta HO', 'Station Road', 'Bus Stand Area', 'Bapu Baug', 'Court Road'] },
  '362001': { city: 'Junagadh', state: 'Gujarat', district: 'Junagadh', localities: ['Junagadh HO', 'M.G. Road', 'Kalva Chowk', 'Zanzarda Road', 'Majevadi Gate'] },
  '400001': { city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai', localities: ['Fort', 'Nariman Point', 'Colaba'] },
  '400013': { city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai', localities: ['Lower Parel', 'Delisle Road', 'Currey Road'] },
  '400050': { city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai Suburban', localities: ['Bandra West', 'Pali Hill', 'Carter Road'] },
  '400053': { city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai Suburban', localities: ['Andheri West', 'Lokhandwala', 'Versova'] },
  '400076': { city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai Suburban', localities: ['Powai', 'IIT Bombay', 'Hiranandani'] },
  '400092': { city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai Suburban', localities: ['Borivali West', 'Gorai', 'Shimpoli'] },
  '400601': { city: 'Thane', state: 'Maharashtra', district: 'Thane', localities: ['Thane West', 'Naupada', 'Talao Pali'] },
  '400703': { city: 'Navi Mumbai', state: 'Maharashtra', district: 'Thane', localities: ['Vashi', 'Sanpada'] },
  '411001': { city: 'Pune', state: 'Maharashtra', district: 'Pune', localities: ['Pune Station', 'Camp', 'Dhole Patil Road'] },
  '411004': { city: 'Pune', state: 'Maharashtra', district: 'Pune', localities: ['Deccan Gymkhana', 'FC Road', 'Shivajinagar'] },
  '411014': { city: 'Pune', state: 'Maharashtra', district: 'Pune', localities: ['Viman Nagar', 'Kalyani Nagar', 'Airport Road'] },
  '411057': { city: 'Pune', state: 'Maharashtra', district: 'Pune', localities: ['Hinjewadi IT Park', 'Wakad'] },
  '422001': { city: 'Nashik', state: 'Maharashtra', district: 'Nashik', localities: ['Nashik HO', 'Panchavati'] },
  '440001': { city: 'Nagpur', state: 'Maharashtra', district: 'Nagpur', localities: ['Civil Lines', 'Sitabuldi', 'Nagpur HO'] },
  '452001': { city: 'Indore', state: 'Madhya Pradesh', district: 'Indore', localities: ['Rajwada', 'MG Road', 'Indore HO'] },
  '462001': { city: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal', localities: ['Bhopal HO', 'Old City'] },
  '500001': { city: 'Hyderabad', state: 'Telangana', district: 'Hyderabad', localities: ['Abids', 'Koti', 'Hyderabad HO'] },
  '500081': { city: 'Hyderabad', state: 'Telangana', district: 'Rangareddy', localities: ['Madhapur', 'HITEC City', 'Cyberabad'] },
  '500034': { city: 'Hyderabad', state: 'Telangana', district: 'Hyderabad', localities: ['Banjara Hills', 'Jubilee Hills'] },
  '530001': { city: 'Visakhapatnam', state: 'Andhra Pradesh', district: 'Visakhapatnam', localities: ['Vizag HO', 'One Town'] },
  '560001': { city: 'Bengaluru', state: 'Karnataka', district: 'Bengaluru Urban', localities: ['MG Road', 'Brigade Road', 'Shivajinagar', 'Bengaluru GPO'] },
  '560034': { city: 'Bengaluru', state: 'Karnataka', district: 'Bengaluru Urban', localities: ['Koramangala', 'St. Johns'] },
  '560066': { city: 'Bengaluru', state: 'Karnataka', district: 'Bengaluru Urban', localities: ['Whitefield', 'ITPL', 'Kadugodi'] },
  '560100': { city: 'Bengaluru', state: 'Karnataka', district: 'Bengaluru Urban', localities: ['Electronic City Phase 1', 'Konappana Agrahara'] },
  '560038': { city: 'Bengaluru', state: 'Karnataka', district: 'Bengaluru Urban', localities: ['Indiranagar', 'HAL 2nd Stage'] },
  '600001': { city: 'Chennai', state: 'Tamil Nadu', district: 'Chennai', localities: ['Parrys', 'George Town', 'Chennai GPO'] },
  '600004': { city: 'Chennai', state: 'Tamil Nadu', district: 'Chennai', localities: ['Mylapore', 'Mandaveli'] },
  '600032': { city: 'Chennai', state: 'Tamil Nadu', district: 'Chennai', localities: ['Guindy', 'Ekkattuthangal'] },
  '600096': { city: 'Chennai', state: 'Tamil Nadu', district: 'Kanchipuram', localities: ['Perungudi', 'OMR', 'Thoraipakkam'] },
  '641001': { city: 'Coimbatore', state: 'Tamil Nadu', district: 'Coimbatore', localities: ['R.S. Puram', 'Town Hall'] },
  '682001': { city: 'Kochi', state: 'Kerala', district: 'Ernakulam', localities: ['Fort Kochi', 'Mattancherry'] },
  '682011': { city: 'Kochi', state: 'Kerala', district: 'Ernakulam', localities: ['Kaloor', 'Ernakulam North'] },
  '695001': { city: 'Thiruvananthapuram', state: 'Kerala', district: 'Thiruvananthapuram', localities: ['Statue', 'Palayam', 'GPO'] },
  '700001': { city: 'Kolkata', state: 'West Bengal', district: 'Kolkata', localities: ['BBD Bagh', 'Dalhousie Square', 'Kolkata GPO'] },
  '700020': { city: 'Kolkata', state: 'West Bengal', district: 'Kolkata', localities: ['Park Street', 'Circus Avenue'] },
  '700091': { city: 'Kolkata', state: 'West Bengal', district: 'North 24 Parganas', localities: ['Salt Lake Sector V', 'Bidhannagar'] },
  '751001': { city: 'Bhubaneswar', state: 'Odisha', district: 'Khurda', localities: ['Bhubaneswar HO', 'Old Town'] },
  '781001': { city: 'Guwahati', state: 'Assam', district: 'Kamrup', localities: ['Pan Bazar', 'Fancy Bazar', 'Guwahati GPO'] },
  '800001': { city: 'Patna', state: 'Bihar', district: 'Patna', localities: ['Patna GPO', 'Fraser Road', 'Dak Bungalow'] },
  '834001': { city: 'Ranchi', state: 'Jharkhand', district: 'Ranchi', localities: ['Main Road', 'Ranchi GPO'] },
  '141001': { city: 'Ludhiana', state: 'Punjab', district: 'Ludhiana', localities: ['Clock Tower', 'Ludhiana HO'] },
  '160017': { city: 'Chandigarh', state: 'Chandigarh', district: 'Chandigarh', localities: ['Sector 17', 'City Centre'] },
  '226001': { city: 'Lucknow', state: 'Uttar Pradesh', district: 'Lucknow', localities: ['Hazratganj', 'Lucknow GPO'] },
  '208001': { city: 'Kanpur', state: 'Uttar Pradesh', district: 'Kanpur Nagar', localities: ['Civil Lines', 'Kanpur HO'] }
};

// Regional Indian PIN Code Zone Heuristic (Prefix-based fallback)
const getFallbackByPrefix = (pin) => {
  const p2 = pin.substring(0, 2);
  const p3 = pin.substring(0, 3);

  // Delhi NCR
  if (p2 === '11') return { city: 'New Delhi', state: 'Delhi', district: 'Delhi' };
  if (p2 === '12' || p2 === '13') return { city: 'Haryana', state: 'Haryana', district: 'Haryana' };
  if (p2 === '14' || p2 === '15') return { city: 'Punjab', state: 'Punjab', district: 'Punjab' };
  if (p2 === '16') return { city: 'Chandigarh', state: 'Chandigarh', district: 'Chandigarh' };
  if (p2 === '17') return { city: 'Shimla', state: 'Himachal Pradesh', district: 'Himachal Pradesh' };
  if (p2 === '18' || p2 === '19') return { city: 'Jammu', state: 'Jammu and Kashmir', district: 'Jammu & Kashmir' };
  
  // UP & UK
  if (p3 === '201') return { city: 'Noida / Ghaziabad', state: 'Uttar Pradesh', district: 'Gautam Buddha Nagar' };
  if (p3 === '226') return { city: 'Lucknow', state: 'Uttar Pradesh', district: 'Lucknow' };
  if (p3 === '208') return { city: 'Kanpur', state: 'Uttar Pradesh', district: 'Kanpur Nagar' };
  if (p3 === '282') return { city: 'Agra', state: 'Uttar Pradesh', district: 'Agra' };
  if (p3 === '248') return { city: 'Dehradun', state: 'Uttarakhand', district: 'Dehradun' };
  if (p2 >= '20' && p2 <= '28') return { city: 'Uttar Pradesh', state: 'Uttar Pradesh', district: 'Uttar Pradesh' };
  
  // Rajasthan
  if (p3 === '302') return { city: 'Jaipur', state: 'Rajasthan', district: 'Jaipur' };
  if (p3 === '342') return { city: 'Jodhpur', state: 'Rajasthan', district: 'Jodhpur' };
  if (p3 === '313') return { city: 'Udaipur', state: 'Rajasthan', district: 'Udaipur' };
  if (p2 >= '30' && p2 <= '34') return { city: 'Rajasthan', state: 'Rajasthan', district: 'Rajasthan' };
  
  // Gujarat
  if (p3 === '380') return { city: 'Ahmedabad', state: 'Gujarat', district: 'Ahmedabad' };
  if (p3 === '390') return { city: 'Vadodara', state: 'Gujarat', district: 'Vadodara' };
  if (p3 === '395') return { city: 'Surat', state: 'Gujarat', district: 'Surat' };
  if (p3 === '360') return { city: 'Rajkot', state: 'Gujarat', district: 'Rajkot' };
  if (p2 >= '36' && p2 <= '39') return { city: 'Gujarat', state: 'Gujarat', district: 'Gujarat' };
  
  // Maharashtra & Goa
  if (p3 >= '400' && p3 <= '401') return { city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai' };
  if (p3 === '403') return { city: 'Goa', state: 'Goa', district: 'Goa' };
  if (p3 >= '410' && p3 <= '412') return { city: 'Pune', state: 'Maharashtra', district: 'Pune' };
  if (p3 === '422') return { city: 'Nashik', state: 'Maharashtra', district: 'Nashik' };
  if (p3 === '431') return { city: 'Chhatrapati Sambhajinagar', state: 'Maharashtra', district: 'Aurangabad' };
  if (p3 === '440') return { city: 'Nagpur', state: 'Maharashtra', district: 'Nagpur' };
  if (p2 >= '40' && p2 <= '44') return { city: 'Maharashtra', state: 'Maharashtra', district: 'Maharashtra' };
  
  // MP & Chhattisgarh
  if (p3 === '452') return { city: 'Indore', state: 'Madhya Pradesh', district: 'Indore' };
  if (p3 === '462') return { city: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal' };
  if (p3 === '492') return { city: 'Raipur', state: 'Chhattisgarh', district: 'Raipur' };
  if (p2 >= '45' && p2 <= '49') return { city: 'Madhya Pradesh', state: 'Madhya Pradesh', district: 'Madhya Pradesh' };
  
  // Andhra & Telangana
  if (p3 >= '500' && p3 <= '501') return { city: 'Hyderabad', state: 'Telangana', district: 'Hyderabad' };
  if (p3 === '530') return { city: 'Visakhapatnam', state: 'Andhra Pradesh', district: 'Visakhapatnam' };
  if (p3 === '520') return { city: 'Vijayawada', state: 'Andhra Pradesh', district: 'Krishna' };
  if (p2 >= '50' && p2 <= '53') return { city: 'Telangana / Andhra Pradesh', state: 'Telangana', district: 'Telangana' };
  
  // Karnataka
  if (p3 >= '560' && p3 <= '562') return { city: 'Bengaluru', state: 'Karnataka', district: 'Bengaluru' };
  if (p3 === '570') return { city: 'Mysuru', state: 'Karnataka', district: 'Mysuru' };
  if (p3 === '575') return { city: 'Mangaluru', state: 'Karnataka', district: 'Dakshina Kannada' };
  if (p2 >= '56' && p2 <= '59') return { city: 'Karnataka', state: 'Karnataka', district: 'Karnataka' };
  
  // Tamil Nadu & Kerala
  if (p3 >= '600' && p3 <= '603') return { city: 'Chennai', state: 'Tamil Nadu', district: 'Chennai' };
  if (p3 === '641') return { city: 'Coimbatore', state: 'Tamil Nadu', district: 'Coimbatore' };
  if (p3 === '625') return { city: 'Madurai', state: 'Tamil Nadu', district: 'Madurai' };
  if (p3 === '682') return { city: 'Kochi', state: 'Kerala', district: 'Ernakulam' };
  if (p3 === '695') return { city: 'Thiruvananthapuram', state: 'Kerala', district: 'Thiruvananthapuram' };
  if (p2 >= '60' && p2 <= '64') return { city: 'Tamil Nadu', state: 'Tamil Nadu', district: 'Tamil Nadu' };
  if (p2 >= '67' && p2 <= '69') return { city: 'Kerala', state: 'Kerala', district: 'Kerala' };
  
  // West Bengal & North East
  if (p3 >= '700' && p3 <= '701') return { city: 'Kolkata', state: 'West Bengal', district: 'Kolkata' };
  if (p3 === '781') return { city: 'Guwahati', state: 'Assam', district: 'Kamrup' };
  if (p2 >= '70' && p2 <= '74') return { city: 'West Bengal', state: 'West Bengal', district: 'West Bengal' };
  if (p2 >= '75' && p2 <= '77') return { city: 'Odisha', state: 'Odisha', district: 'Odisha' };
  if (p2 === '78' || p2 === '79') return { city: 'Assam / North East', state: 'Assam', district: 'Assam' };
  
  // Bihar & Jharkhand
  if (p3 === '800') return { city: 'Patna', state: 'Bihar', district: 'Patna' };
  if (p3 === '834') return { city: 'Ranchi', state: 'Jharkhand', district: 'Ranchi' };
  if (p3 === '831') return { city: 'Jamshedpur', state: 'Jharkhand', district: 'East Singhbhum' };
  if (p2 >= '80' && p2 <= '85') return { city: 'Bihar / Jharkhand', state: 'Bihar', district: 'Bihar' };

  return { city: 'India', state: 'India', district: 'India' };
};

/**
 * Clean and normalize district / city names
 */
const normalizeCityName = (district, name, block) => {
  if (!district) return name || block || 'Unknown';
  let clean = district.trim();
  // Normalize Bangalore to Bengaluru
  if (/^bangalore/i.test(clean)) clean = 'Bengaluru';
  if (/^bombay/i.test(clean)) clean = 'Mumbai';
  if (/^calcutta/i.test(clean)) clean = 'Kolkata';
  if (/^madras/i.test(clean)) clean = 'Chennai';
  // Strip redundant "District" suffix
  clean = clean.replace(/\s+District$/i, '');
  return clean;
};

/**
 * GET /api/pincode/:pincode
 * Automatically fetches city, state, district, and localities for any 6-digit Indian PIN code.
 */
router.get('/:pincode', async (req, res) => {
  const { pincode } = req.params;
  const pin = String(pincode).trim();

  // Validate 6 digits
  if (!/^\d{6}$/.test(pin)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid Indian PIN code format. Please provide exactly 6 numeric digits.'
    });
  }

  // 1. Check in-memory cache
  if (pincodeCache.has(pin)) {
    return res.json({
      success: true,
      source: 'cache',
      ...pincodeCache.get(pin)
    });
  }

  // 2. Check curated instant dictionary
  if (KNOWN_PINCODES[pin]) {
    const known = {
      pincode: pin,
      ...KNOWN_PINCODES[pin],
      formatted: `${KNOWN_PINCODES[pin].city}, ${KNOWN_PINCODES[pin].state}`
    };
    pincodeCache.set(pin, known);
    return res.json({
      success: true,
      source: 'curated',
      ...known
    });
  }

  // 3. Query India Postal Pincode Open API with 3.5s timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const apiRes = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeout);

    if (apiRes.ok) {
      const data = await apiRes.json();
      if (Array.isArray(data) && data[0] && data[0].Status === 'Success' && Array.isArray(data[0].PostOffice)) {
        const offices = data[0].PostOffice;
        const primary = offices[0];
        const city = normalizeCityName(primary.District, primary.Name, primary.Block);
        const state = primary.State || 'India';
        const district = primary.District || city;
        
        // Extract distinct locality / post office names
        const localities = Array.from(new Set(offices.map(o => o.Name).filter(Boolean)));

        const result = {
          pincode: pin,
          city,
          state,
          district,
          localities,
          formatted: `${city}, ${state}`
        };

        pincodeCache.set(pin, result);
        return res.json({
          success: true,
          source: 'postal_api',
          ...result
        });
      }
    }
  } catch (err) {
    // Timeout or network error; gracefully fall through to regional heuristic
    console.warn(`Pincode API lookup note for ${pin}:`, err.message);
  }

  // 4. Regional Heuristic Fallback
  const fallback = getFallbackByPrefix(pin);
  const result = {
    pincode: pin,
    city: fallback.city,
    state: fallback.state,
    district: fallback.district,
    localities: [],
    formatted: `${fallback.city}, ${fallback.state}`,
    isEstimated: true
  };

  pincodeCache.set(pin, result);
  return res.json({
    success: true,
    source: 'heuristic',
    ...result
  });
});

module.exports = router;
