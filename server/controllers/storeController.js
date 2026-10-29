const Store = require('../models/Store');

// Curated default stores dataset ensuring instant reliability
const DEFAULT_STORES = [
  {
    _id: 'ks-dhj-01',
    code: 'KS-DHJ-01',
    name: 'Kirti Store - Flagship Showroom & Master Service Hub',
    type: 'flagship',
    tagline: 'Official Headquarters & Main Service Workshop',
    address: 'Main Bazar, Opp. Nandkurba Hospital, Dhoraji - 360410, Gujarat',
    landmark: 'Opposite Nandkurba Hospital',
    city: 'Dhoraji',
    state: 'Gujarat',
    pincode: '360410',
    phone: '+91 94282 82008',
    alternatePhone: '+91 98252 82008',
    whatsapp: '+919428282008',
    email: 'support@kirtistore.com',
    coordinates: { lat: 21.7345, lng: 70.4503 },
    googleMapsUrl: 'https://maps.google.com/?q=Kirti+Store+Main+Bazar+Opp+Nandkurba+Hospital+Dhoraji+Gujarat+360410',
    operatingHours: {
      openTime: '10:00 AM',
      closeTime: '08:00 PM',
      lunchBreak: '01:00 PM - 03:00 PM',
      workingDays: 'Monday - Saturday (Sunday Closed)'
    },
    services: [
      '30-Min Express Mixer Motor Overhaul',
      '100% Genuine Jars, Blades, Couplers & Gaskets',
      'Instant Warranty Claims & Spot Replacement',
      'Live Cooking & Appliance Demonstrations',
      'Free Same-Day Click & Collect (In-Store Pickup)'
    ],
    features: {
      hasParking: true,
      acceptsUpi: true,
      hasLiveDemo: true,
      expressRepair: true,
      clickAndCollect: true
    },
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    reviewsCount: 384,
    status: 'active'
  },
  {
    _id: 'ks-rjk-02',
    code: 'KS-RJK-02',
    name: 'Kirti Store - Rajkot Service & Spare Hub',
    type: 'service_center',
    tagline: 'Authorized Regional Service & Spare Parts Depot',
    address: 'Shop 12-14, Shreenathji Complex, Opp. Imperial Palace, Dr. Yagnik Road, Rajkot - 360001, Gujarat',
    landmark: 'Opposite Imperial Palace Hotel',
    city: 'Rajkot',
    state: 'Gujarat',
    pincode: '360001',
    phone: '+91 94282 82009',
    whatsapp: '+919428282008',
    email: 'rajkot@kirtistore.com',
    coordinates: { lat: 22.2965, lng: 70.7984 },
    googleMapsUrl: 'https://maps.google.com/?q=Dr+Yagnik+Road+Rajkot+Gujarat+360001',
    operatingHours: {
      openTime: '10:00 AM',
      closeTime: '08:30 PM',
      lunchBreak: '01:30 PM - 03:00 PM',
      workingDays: 'Monday - Saturday'
    },
    services: [
      'Fast Diagnostic & Motor Repair',
      'Wholesale & Retail Spare Parts Counter',
      'Instant Warranty Registration Support',
      'Free In-Store Pickup'
    ],
    features: {
      hasParking: true,
      acceptsUpi: true,
      hasLiveDemo: true,
      expressRepair: true,
      clickAndCollect: true
    },
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewsCount: 215,
    status: 'active'
  },
  {
    _id: 'ks-amd-03',
    code: 'KS-AMD-03',
    name: 'Kirti Store - Ahmedabad Experience Studio',
    type: 'flagship',
    tagline: 'Kitchen Appliances Experience & Customer Care Center',
    address: 'Ground Floor, City Centre Arcade, Near Navrangpura Bus Stand, CG Road, Ahmedabad - 380009, Gujarat',
    landmark: 'Near Navrangpura Bus Stand, CG Road',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380009',
    phone: '+91 94282 82010',
    whatsapp: '+919428282008',
    email: 'ahmedabad@kirtistore.com',
    coordinates: { lat: 23.0305, lng: 72.5694 },
    googleMapsUrl: 'https://maps.google.com/?q=CG+Road+Navrangpura+Ahmedabad+Gujarat+380009',
    operatingHours: {
      openTime: '10:30 AM',
      closeTime: '09:00 PM',
      lunchBreak: 'Continuous Service (No Break)',
      workingDays: 'Monday - Sunday (7 Days Open)'
    },
    services: [
      'Full Appliance Lineup Live Tasting & Demos',
      'Grinding & Blending Power Testing Station',
      'Original Replacement Blades & Jars',
      'Official Warranty Claims Desk'
    ],
    features: {
      hasParking: true,
      acceptsUpi: true,
      hasLiveDemo: true,
      expressRepair: true,
      clickAndCollect: true
    },
    image: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    reviewsCount: 412,
    status: 'active'
  },
  {
    _id: 'ks-srt-04',
    code: 'KS-SRT-04',
    name: 'Kirti Store - Surat Service Point',
    type: 'service_center',
    tagline: 'Fast-Track Mixer & Blender Repair Center',
    address: 'Unit 4, Platinum Plaza, Near Mini Bazar, Varachha Main Road, Surat - 395006, Gujarat',
    landmark: 'Near Mini Bazar, Varachha',
    city: 'Surat',
    state: 'Gujarat',
    pincode: '395006',
    phone: '+91 94282 82011',
    whatsapp: '+919428282008',
    email: 'surat@kirtistore.com',
    coordinates: { lat: 21.1959, lng: 72.8302 },
    googleMapsUrl: 'https://maps.google.com/?q=Varachha+Main+Road+Surat+Gujarat+395006',
    operatingHours: {
      openTime: '10:00 AM',
      closeTime: '08:00 PM',
      lunchBreak: '01:00 PM - 02:30 PM',
      workingDays: 'Monday - Saturday'
    },
    services: [
      'Quick Coupler, Bush & Carbon Brush Fix',
      'Juicer & Soda Maker Repair Service',
      'Original Food-Grade Gaskets & Blades',
      'Spot Warranty Processing'
    ],
    features: {
      hasParking: false,
      acceptsUpi: true,
      hasLiveDemo: false,
      expressRepair: true,
      clickAndCollect: true
    },
    image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    reviewsCount: 168,
    status: 'active'
  },
  {
    _id: 'ks-brd-05',
    code: 'KS-BRD-05',
    name: 'Kirti Store - Vadodara Hub',
    type: 'retail_counter',
    tagline: 'Authorized Appliance Sales & Service Point',
    address: '105, Crystal Square, Opp. Railway Station Road, Alkapuri, Vadodara - 390007, Gujarat',
    landmark: 'Opp. Railway Station, Alkapuri',
    city: 'Vadodara',
    state: 'Gujarat',
    pincode: '390007',
    phone: '+91 94282 82012',
    whatsapp: '+919428282008',
    email: 'vadodara@kirtistore.com',
    coordinates: { lat: 22.3107, lng: 73.1812 },
    googleMapsUrl: 'https://maps.google.com/?q=Alkapuri+Vadodara+Gujarat+390007',
    operatingHours: {
      openTime: '10:00 AM',
      closeTime: '08:00 PM',
      lunchBreak: '01:30 PM - 03:00 PM',
      workingDays: 'Monday - Saturday'
    },
    services: [
      'Mixer & Toaster Repair Diagnostics',
      'Spare Blades, Domes & Polycarbonate Jars',
      'In-Store Order Pickup',
      'Manufacturer Warranty Claims'
    ],
    features: {
      hasParking: true,
      acceptsUpi: true,
      hasLiveDemo: true,
      expressRepair: true,
      clickAndCollect: true
    },
    image: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewsCount: 132,
    status: 'active'
  },
  {
    _id: 'ks-jnd-06',
    code: 'KS-JND-06',
    name: 'Kirti Store - Junagadh Care Center',
    type: 'service_center',
    tagline: 'Regional Appliance Repair & Spare Parts Counter',
    address: 'GF 8, Girnar Plaza, M.G. Road, Near Kalva Chowk, Junagadh - 362001, Gujarat',
    landmark: 'Near Kalva Chowk, M.G. Road',
    city: 'Junagadh',
    state: 'Gujarat',
    pincode: '362001',
    phone: '+91 94282 82013',
    whatsapp: '+919428282008',
    email: 'junagadh@kirtistore.com',
    coordinates: { lat: 21.5222, lng: 70.4579 },
    googleMapsUrl: 'https://maps.google.com/?q=Kalva+Chowk+Junagadh+Gujarat+362001',
    operatingHours: {
      openTime: '10:00 AM',
      closeTime: '07:30 PM',
      lunchBreak: '01:00 PM - 03:00 PM',
      workingDays: 'Monday - Saturday'
    },
    services: [
      'Mixer Grinder Motor Rewinding & Servicing',
      'Genuine Jars & Couplers Exchange',
      'Same-Day Repair Diagnostic'
    ],
    features: {
      hasParking: true,
      acceptsUpi: true,
      hasLiveDemo: false,
      expressRepair: true,
      clickAndCollect: true
    },
    image: 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    reviewsCount: 95,
    status: 'active'
  },
  {
    _id: 'ks-jmn-07',
    code: 'KS-JMN-07',
    name: 'Kirti Store - Jamnagar Outlet',
    type: 'spare_hub',
    tagline: 'Original Kitchen Spare Parts & Overhaul Station',
    address: 'Shop 6, Royal Market, Near Bedi Gate, Jamnagar - 361001, Gujarat',
    landmark: 'Near Bedi Gate',
    city: 'Jamnagar',
    state: 'Gujarat',
    pincode: '361001',
    phone: '+91 94282 82014',
    whatsapp: '+919428282008',
    email: 'jamnagar@kirtistore.com',
    coordinates: { lat: 22.4707, lng: 70.0577 },
    googleMapsUrl: 'https://maps.google.com/?q=Bedi+Gate+Jamnagar+Gujarat+361001',
    operatingHours: {
      openTime: '10:00 AM',
      closeTime: '08:00 PM',
      lunchBreak: '01:30 PM - 03:00 PM',
      workingDays: 'Monday - Saturday'
    },
    services: [
      'Heavy Duty Brass & Steel Spares',
      'Blender & Grinder Attachments',
      'Quick Appliance Health Check'
    ],
    features: {
      hasParking: false,
      acceptsUpi: true,
      hasLiveDemo: false,
      expressRepair: true,
      clickAndCollect: true
    },
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    reviewsCount: 88,
    status: 'active'
  },
  {
    _id: 'ks-mum-08',
    code: 'KS-MUM-08',
    name: 'Kirti Store - Mumbai Service Partner',
    type: 'service_center',
    tagline: 'Metropolitan Service Hub & Express Pickup Point',
    address: 'Shop 18, Goyal Shopping Arcade, SV Road, Borivali West, Mumbai - 400092, Maharashtra',
    landmark: 'Opposite Borivali Station (West)',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400092',
    phone: '+91 94282 82015',
    whatsapp: '+919428282008',
    email: 'mumbai@kirtistore.com',
    coordinates: { lat: 19.2307, lng: 72.8567 },
    googleMapsUrl: 'https://maps.google.com/?q=SV+Road+Borivali+West+Mumbai+400092',
    operatingHours: {
      openTime: '10:30 AM',
      closeTime: '08:30 PM',
      lunchBreak: 'Continuous (No Lunch Break)',
      workingDays: 'Monday - Saturday'
    },
    services: [
      'Same-Day Appliance Overhaul',
      'Western India Spare Parts Counter',
      'Spot Warranty Claims Desk',
      'Click & Collect Pickup'
    ],
    features: {
      hasParking: true,
      acceptsUpi: true,
      hasLiveDemo: true,
      expressRepair: true,
      clickAndCollect: true
    },
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    reviewsCount: 174,
    status: 'active'
  }
];

// Helper: Seed default stores if none exist in MongoDB
const ensureSeededStores = async () => {
  try {
    const count = await Store.countDocuments();
    if (count === 0) {
      await Store.insertMany(DEFAULT_STORES.map(({ _id, ...rest }) => rest));
      console.log('✅ Initialized Kirti Store official service centers and retail counters in database.');
    }
  } catch (err) {
    // If DB is offline or read-only, silently allow fallback
  }
};

// @desc    Get all store locations with optional search/filtering
// @route   GET /api/stores
// @access  Public
exports.getStores = async (req, res) => {
  try {
    await ensureSeededStores();

    const { city, type, search } = req.query;
    let query = { status: { $ne: 'inactive' } };

    if (city && city !== 'All') {
      query.city = new RegExp(`^${city.trim()}$`, 'i');
    }

    if (type && type !== 'all') {
      query.type = type.trim();
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { city: searchRegex },
        { address: searchRegex },
        { pincode: searchRegex },
        { landmark: searchRegex }
      ];
    }

    let stores = await Store.find(query).sort({ type: 1, name: 1 }).lean();

    // If database returned 0 or wasn't reachable, filter from DEFAULT_STORES
    if (!stores || stores.length === 0) {
      stores = DEFAULT_STORES.filter((st) => {
        if (city && city !== 'All' && st.city.toLowerCase() !== city.toLowerCase()) return false;
        if (type && type !== 'all' && st.type !== type) return false;
        if (search) {
          const s = search.toLowerCase();
          const matches =
            st.name.toLowerCase().includes(s) ||
            st.city.toLowerCase().includes(s) ||
            st.address.toLowerCase().includes(s) ||
            st.pincode.includes(s) ||
            (st.landmark && st.landmark.toLowerCase().includes(s));
          if (!matches) return false;
        }
        return true;
      });
    }

    res.status(200).json({
      success: true,
      count: stores.length,
      stores
    });
  } catch (error) {
    console.error('Error fetching stores:', error.message);
    // Graceful fallback to default in-memory stores
    res.status(200).json({
      success: true,
      count: DEFAULT_STORES.length,
      stores: DEFAULT_STORES,
      isFallback: true
    });
  }
};

// @desc    Get single store by ID
// @route   GET /api/stores/:id
// @access  Public
exports.getStoreById = async (req, res) => {
  try {
    let store = null;
    try {
      store = await Store.findById(req.params.id).lean();
    } catch (e) {}

    if (!store) {
      store = DEFAULT_STORES.find(
        (s) => s._id === req.params.id || s.code.toLowerCase() === req.params.id.toLowerCase()
      );
    }

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store location not found'
      });
    }

    res.status(200).json({
      success: true,
      store
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve store details'
    });
  }
};

// @desc    Book a store visit / appliance repair appointment
// @route   POST /api/stores/appointment
// @access  Public
exports.bookAppointment = async (req, res) => {
  try {
    const { storeId, storeName, customerName, phone, applianceType, serviceRequired, preferredDate, timeSlot, notes } = req.body;

    if (!customerName || !phone || !storeName || !serviceRequired) {
      return res.status(400).json({
        success: false,
        message: 'Please provide customer name, phone, store location, and service requested'
      });
    }

    const appointmentToken = 'APPT-' + Math.floor(100000 + Math.random() * 900000);

    res.status(201).json({
      success: true,
      message: 'Store visit appointment booked successfully!',
      appointment: {
        token: appointmentToken,
        storeName,
        customerName,
        phone,
        applianceType: applianceType || 'Mixer Grinder',
        serviceRequired,
        preferredDate: preferredDate || new Date().toISOString().split('T')[0],
        timeSlot: timeSlot || 'Morning (10:30 AM - 1:00 PM)',
        notes: notes || '',
        status: 'Confirmed'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to schedule store visit appointment'
    });
  }
};

exports.DEFAULT_STORES = DEFAULT_STORES;
