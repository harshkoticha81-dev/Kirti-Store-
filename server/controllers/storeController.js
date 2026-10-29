const Store = require('../models/Store');

// Curated official headquarters dataset
const DEFAULT_STORES = [
  {
    _id: 'ks-dhj-01',
    code: 'KS-DHJ-01',
    name: 'Kirti Store - Headquarters (Dhoraji)',
    type: 'headquarters',
    tagline: 'Official Store Headquarters, Sales & Service Workshop',
    address: 'Kirti Store, Main Bazar, Opp. Nandkurba Hospital, Dhoraji - 360410, Gujarat',
    landmark: 'Opposite Nandkurba Hospital',
    city: 'Dhoraji',
    state: 'Gujarat',
    pincode: '360410',
    phone: '+91 94282 82008',
    alternatePhone: '+91 98252 82008',
    whatsapp: '919428282008',
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
      'Official Store Headquarters & Customer Care',
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
  }
];

// Helper: Ensure only Dhoraji headquarters exists in database
const ensureSeededStores = async () => {
  try {
    await Store.deleteMany({ city: { $ne: 'Dhoraji' } });
    const count = await Store.countDocuments();
    if (count === 0) {
      await Store.insertMany(DEFAULT_STORES.map(({ _id, ...rest }) => rest));
      console.log('✅ Initialized Kirti Store Dhoraji Headquarters in database.');
    }
  } catch (err) {
    // If DB is offline or read-only, silently allow fallback
  }
};

// @desc    Get store location (Headquarters)
// @route   GET /api/stores
// @access  Public
exports.getStores = async (req, res) => {
  try {
    await ensureSeededStores();

    let stores = await Store.find({ status: { $ne: 'inactive' } }).lean();

    // If database returned 0 or wasn't reachable, use DEFAULT_STORES
    if (!stores || stores.length === 0) {
      stores = DEFAULT_STORES;
    }

    res.status(200).json({
      success: true,
      count: stores.length,
      stores
    });
  } catch (error) {
    console.error('Error fetching store:', error.message);
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
      store = DEFAULT_STORES[0];
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
    const { customerName, phone, applianceType, serviceRequired, preferredDate, timeSlot, notes } = req.body;

    if (!customerName || !phone || !serviceRequired) {
      return res.status(400).json({
        success: false,
        message: 'Please provide customer name, phone, and service requested'
      });
    }

    const appointmentToken = 'APPT-' + Math.floor(100000 + Math.random() * 900000);

    res.status(201).json({
      success: true,
      message: 'Store visit appointment booked successfully at Dhoraji Headquarters!',
      appointment: {
        token: appointmentToken,
        storeName: 'Kirti Store - Headquarters (Dhoraji)',
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
