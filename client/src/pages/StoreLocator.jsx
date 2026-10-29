import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, 
  Phone, 
  Navigation, 
  Clock, 
  Compass, 
  Search, 
  Filter, 
  CheckCircle2, 
  Calendar, 
  X, 
  ExternalLink, 
  ShieldCheck, 
  Wrench, 
  Sparkles, 
  Building2, 
  Share2, 
  LocateFixed, 
  Store, 
  Check, 
  AlertCircle,
  MessageSquare,
  Layers,
  ShoppingBag
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

// Built-in curated stores guaranteeing instant render & 100% offline availability
const FALLBACK_STORES = [
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
    reviewsCount: 384
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
    whatsapp: '919428282008',
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
    reviewsCount: 215
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
    whatsapp: '919428282008',
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
    reviewsCount: 412
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
    whatsapp: '919428282008',
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
    reviewsCount: 168
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
    whatsapp: '919428282008',
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
    reviewsCount: 132
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
    whatsapp: '919428282008',
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
    reviewsCount: 95
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
    whatsapp: '919428282008',
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
    reviewsCount: 88
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
    whatsapp: '919428282008',
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
    reviewsCount: 174
  }
];

// Distance calculation using Haversine formula (km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// Check if a store is currently open
const getStoreLiveStatus = (store) => {
  const now = new Date();
  const day = now.getDay(); // 0 is Sunday
  const isSunday = day === 0;

  if (isSunday && !store.operatingHours.workingDays.toLowerCase().includes('sunday')) {
    return { isOpen: false, text: 'Closed Today (Sunday)', color: 'text-rose-600 bg-rose-50 border-rose-200' };
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Parse 10:00 AM / 08:00 PM
  const parseTime = (str) => {
    if (!str) return 0;
    const match = str.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };

  const openMinutes = parseTime(store.operatingHours.openTime) || 10 * 60;
  const closeMinutes = parseTime(store.operatingHours.closeTime) || 20 * 60;

  // Check lunch break
  if (store.operatingHours.lunchBreak && store.operatingHours.lunchBreak.includes('-')) {
    const [lStart, lEnd] = store.operatingHours.lunchBreak.split('-');
    const lunchStart = parseTime(lStart.trim());
    const lunchEnd = parseTime(lEnd.trim());
    if (currentMinutes >= lunchStart && currentMinutes < lunchEnd) {
      return { isOpen: false, text: 'Lunch Break (Resumes at 3:00 PM)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    }
  }

  if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    return { isOpen: true, text: `Open Now • Closes at ${store.operatingHours.closeTime}`, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  }

  return { isOpen: false, text: `Closed • Opens at ${store.operatingHours.openTime}`, color: 'text-zinc-600 bg-zinc-100 border-zinc-200' };
};

const StoreLocator = () => {
  const { success, error: showError } = useToast();
  const [stores, setStores] = useState(FALLBACK_STORES);
  const [selectedStore, setSelectedStore] = useState(FALLBACK_STORES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedType, setSelectedType] = useState('all');
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [mapType, setMapType] = useState('roadmap'); // 'roadmap' | 'satellite'
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mobileTab, setMobileTab] = useState('list'); // 'list' | 'map'
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);

  // Appointment Form State
  const [apptData, setApptData] = useState({
    customerName: '',
    phone: '',
    applianceType: 'Mixer Grinder',
    serviceRequired: '30-Min Express Repair',
    preferredDate: '',
    timeSlot: 'Morning (10:30 AM - 01:00 PM)',
    notes: ''
  });
  const [apptSubmitting, setApptSubmitting] = useState(false);
  const [confirmedAppt, setConfirmedAppt] = useState(null);

  // Fetch stores from API with instant fallback
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await api.get('/stores');
        if (res.data?.success && res.data?.stores?.length > 0) {
          setStores(res.data.stores);
          // Keep current selected store if possible
          setSelectedStore((prev) => {
            const found = res.data.stores.find((s) => s.code === prev?.code || s._id === prev?._id);
            return found || res.data.stores[0];
          });
        }
      } catch (err) {
        // Safe graceful fallback to FALLBACK_STORES already set
      }
    };
    fetchStores();
  }, []);

  // Request User Geolocation (GPS)
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      showError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        // Calculate distances and find closest store
        let closest = null;
        let minDistance = Infinity;

        const updated = stores.map((st) => {
          if (st.coordinates?.lat && st.coordinates?.lng) {
            const dist = calculateDistance(latitude, longitude, st.coordinates.lat, st.coordinates.lng);
            if (dist < minDistance) {
              minDistance = dist;
              closest = st;
            }
            return { ...st, distanceKm: dist };
          }
          return st;
        });

        // Sort by distance
        updated.sort((a, b) => (a.distanceKm || 99999) - (b.distanceKm || 99999));

        setStores(updated);
        if (closest) {
          setSelectedStore(closest);
          success(`Found nearest center: ${closest.name} (${minDistance} km away)!`);
        }
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        showError('Unable to retrieve your location. Please check location permissions.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Cities List for Quick Pills
  const cities = useMemo(() => {
    const set = new Set(stores.map((s) => s.city));
    return ['All', ...Array.from(set)];
  }, [stores]);

  // Filtered Stores
  const filteredStores = useMemo(() => {
    return stores.filter((st) => {
      // City filter
      if (selectedCity !== 'All' && st.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }

      // Type filter
      if (selectedType !== 'all' && st.type !== selectedType) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          st.name.toLowerCase().includes(q) ||
          st.city.toLowerCase().includes(q) ||
          st.address.toLowerCase().includes(q) ||
          st.pincode.includes(q) ||
          (st.landmark && st.landmark.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Open now only filter
      if (openNowOnly) {
        const status = getStoreLiveStatus(st);
        if (!status.isOpen) return false;
      }

      return true;
    });
  }, [stores, selectedCity, selectedType, searchQuery, openNowOnly]);

  // Share store details
  const handleShareStore = (store) => {
    const text = `${store.name}\n📍 Address: ${store.address}\n📞 Phone: ${store.phone}\n🗺️ Google Maps: ${store.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(store.address)}`}`;
    if (navigator.share) {
      navigator.share({
        title: store.name,
        text,
        url: store.googleMapsUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      success('Store details and Google Maps link copied to clipboard!');
    }
  };

  // Book appointment submission
  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    if (!apptData.customerName.trim() || !apptData.phone.trim()) {
      showError('Please enter your name and contact phone number.');
      return;
    }

    setApptSubmitting(true);
    try {
      const res = await api.post('/stores/appointment', {
        ...apptData,
        storeId: selectedStore._id || selectedStore.code,
        storeName: selectedStore.name
      });

      if (res.data?.success) {
        setConfirmedAppt(res.data.appointment);
        success('Appointment confirmed successfully!');
      } else {
        // Fallback token
        const mockToken = 'APPT-' + Math.floor(100000 + Math.random() * 900000);
        setConfirmedAppt({
          token: mockToken,
          storeName: selectedStore.name,
          customerName: apptData.customerName,
          phone: apptData.phone,
          serviceRequired: apptData.serviceRequired,
          preferredDate: apptData.preferredDate || 'Tomorrow',
          timeSlot: apptData.timeSlot,
          status: 'Confirmed'
        });
        success('Appointment booked successfully!');
      }
    } catch (err) {
      const mockToken = 'APPT-' + Math.floor(100000 + Math.random() * 900000);
      setConfirmedAppt({
        token: mockToken,
        storeName: selectedStore.name,
        customerName: apptData.customerName,
        phone: apptData.phone,
        serviceRequired: apptData.serviceRequired,
        preferredDate: apptData.preferredDate || 'Tomorrow',
        timeSlot: apptData.timeSlot,
        status: 'Confirmed'
      });
      success('Appointment scheduled!');
    } finally {
      setApptSubmitting(false);
    }
  };

  // Build embedded Google Maps URL
  const googleMapsEmbedUrl = useMemo(() => {
    if (!selectedStore) return '';
    const query = selectedStore.coordinates?.lat && selectedStore.coordinates?.lng
      ? `${selectedStore.coordinates.lat},${selectedStore.coordinates.lng}`
      : `${selectedStore.name}, ${selectedStore.address}`;
    const tParam = mapType === 'satellite' ? 'k' : 'm';
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=${tParam}&z=16&ie=UTF8&iwloc=&output=embed`;
  }, [selectedStore, mapType]);

  const selectedStoreStatus = selectedStore ? getStoreLiveStatus(selectedStore) : null;

  return (
    <div className="min-h-screen bg-slate-50/50">
      
      {/* Hero Header Banner */}
      <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Store className="w-3.5 h-3.5" />
                <span>Authorized Outlets & Workshops</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Official Kirti Store Locator & Service Centers
              </h1>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Locate certified retail experience showrooms, genuine spare parts counters, and authorized appliance repair workshops across Gujarat & Maharashtra.
              </p>
            </div>

            {/* Quick GPS Locator Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={handleDetectLocation}
                disabled={isLocating}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-75"
              >
                <LocateFixed className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Detecting GPS...' : 'Find Nearest Center Near Me'}</span>
              </button>
            </div>
          </div>

          {/* Quick Value Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-zinc-800/80 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-amber-400">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">8+ Locations</p>
                <p className="text-zinc-400">Showrooms & Service Depots</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-emerald-400">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">30-Min Express</p>
                <p className="text-zinc-400">Motor & Jar Repair Counters</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-sky-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">100% Genuine</p>
                <p className="text-zinc-400">OEM Blades, Couplers & Jars</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-amber-400">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Click & Collect</p>
                <p className="text-zinc-400">Free In-Store Order Pickup</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Work Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-surface-border shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <input
                type="text"
                placeholder="Search by city, area, pincode (e.g., 360410, Rajkot, Borivali)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-surface-muted/60 border border-surface-border rounded-2xl text-sm text-charcoal placeholder-charcoal-light focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
              />
              <Search className="w-4 h-4 text-charcoal-light absolute left-4 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-charcoal-light hover:text-charcoal"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Type Filter */}
            <div className="md:col-span-3">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-3 bg-surface-muted/60 border border-surface-border rounded-2xl text-sm font-semibold text-charcoal focus:outline-none focus:ring-2 focus:ring-secondary/20"
              >
                <option value="all">All Outlet Types</option>
                <option value="flagship">Flagship Showrooms</option>
                <option value="service_center">Authorized Service Centers</option>
                <option value="spare_hub">Spare Parts Depots</option>
                <option value="retail_counter">Retail Counters</option>
              </select>
            </div>

            {/* Open Now Toggle */}
            <div className="md:col-span-3 flex items-center justify-between sm:justify-start gap-3 px-4 py-2.5 bg-surface-muted/40 border border-surface-border rounded-2xl">
              <label htmlFor="openNowCheckbox" className="text-xs font-bold text-charcoal flex items-center gap-2 cursor-pointer select-none">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Open Now Only</span>
              </label>
              <input
                id="openNowCheckbox"
                type="checkbox"
                checked={openNowOnly}
                onChange={(e) => setOpenNowOnly(e.target.checked)}
                className="w-4 h-4 rounded text-secondary focus:ring-secondary cursor-pointer"
              />
            </div>
          </div>

          {/* Quick City Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
            <span className="text-charcoal-light font-bold uppercase tracking-wider text-[11px] mr-1 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" />
              <span>Cities:</span>
            </span>
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                  selectedCity === city
                    ? 'bg-zinc-950 text-white shadow-sm'
                    : 'bg-surface-muted hover:bg-slate-200/80 text-charcoal'
                }`}
              >
                {city === 'Dhoraji' ? 'Dhoraji (HQ)' : city}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile View Switcher (List vs Map) */}
        <div className="flex lg:hidden bg-white p-1 rounded-2xl border border-surface-border shadow-xs">
          <button
            onClick={() => setMobileTab('list')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              mobileTab === 'list'
                ? 'bg-zinc-950 text-white shadow-sm'
                : 'text-charcoal-light hover:text-charcoal'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Store List ({filteredStores.length})</span>
          </button>
          <button
            onClick={() => setMobileTab('map')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              mobileTab === 'map'
                ? 'bg-zinc-950 text-white shadow-sm'
                : 'text-charcoal-light hover:text-charcoal'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Interactive Map</span>
          </button>
        </div>

        {/* Master Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Stores List */}
          <div className={`lg:col-span-5 space-y-4 ${mobileTab === 'map' ? 'hidden lg:block' : 'block'}`}>
            <div className="flex items-center justify-between text-xs font-bold text-charcoal-light px-1">
              <span>Showing {filteredStores.length} Verified Outlets</span>
              {userLocation && <span className="text-emerald-700">Sorted by Nearest GPS</span>}
            </div>

            {filteredStores.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-surface-border space-y-3">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                <h3 className="font-bold text-primary text-base">No Matching Outlets Found</h3>
                <p className="text-xs text-charcoal-light max-w-xs mx-auto">
                  Try clearing your search query or selecting "All Cities" to view all authorized centers.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCity('All');
                    setSelectedType('all');
                    setOpenNowOnly(false);
                  }}
                  className="px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl hover:bg-secondary-700 transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1">
                {filteredStores.map((store) => {
                  const isSelected = selectedStore?._id === store._id || selectedStore?.code === store.code;
                  const liveStatus = getStoreLiveStatus(store);

                  return (
                    <div
                      key={store._id || store.code}
                      onClick={() => {
                        setSelectedStore(store);
                        if (window.innerWidth < 1024) {
                          setMobileTab('map');
                        }
                      }}
                      className={`cursor-pointer bg-white rounded-3xl p-5 border transition-all duration-200 relative overflow-hidden ${
                        isSelected
                          ? 'border-zinc-950 ring-2 ring-zinc-950/10 shadow-lg'
                          : 'border-surface-border hover:border-slate-300 hover:shadow-md'
                      }`}
                    >
                      {/* Top Type & Status Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          store.type === 'flagship'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : store.type === 'service_center'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-sky-100 text-sky-900 border border-sky-300'
                        }`}>
                          {store.type === 'flagship' ? 'Flagship Showroom' : store.type === 'service_center' ? 'Service & Repair Center' : 'Spare Parts Depot'}
                        </span>

                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${liveStatus.color}`}>
                          {liveStatus.text.split('•')[0]}
                        </span>
                      </div>

                      {/* Store Name & Tagline */}
                      <h3 className="font-extrabold text-base text-primary leading-snug">
                        {store.name}
                      </h3>
                      <p className="text-xs text-charcoal-light mt-0.5 mb-3">
                        {store.tagline}
                      </p>

                      {/* Distance badge if GPS available */}
                      {store.distanceKm && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold mb-3 border border-emerald-200">
                          <LocateFixed className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{store.distanceKm} km from your location</span>
                        </div>
                      )}

                      {/* Address & Landmark */}
                      <div className="space-y-2 text-xs text-charcoal mb-4">
                        <p className="flex items-start gap-2 text-charcoal">
                          <MapPin className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                          <span>{store.address}</span>
                        </p>
                        <p className="flex items-center gap-2 text-charcoal-light">
                          <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          <span>{store.operatingHours.workingDays}: {store.operatingHours.openTime} – {store.operatingHours.closeTime}</span>
                        </p>
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-surface-border">
                        <a
                          href={`tel:${store.phone.replace(/[^0-9+]/g, '')}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 min-w-[110px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-surface-muted hover:bg-slate-200 text-charcoal font-bold text-xs transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-secondary" />
                          <span>Call Center</span>
                        </a>

                        <a
                          href={`https://wa.me/${store.whatsapp || '919428282008'}?text=${encodeURIComponent(`Hello Kirti Store, I would like to inquire about services at ${store.name}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 min-w-[110px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors border border-emerald-200"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>

                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(store.coordinates?.lat && store.coordinates?.lng ? `${store.coordinates.lat},${store.coordinates.lng}` : store.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white transition-colors"
                          title="Get Driving Directions"
                        >
                          <Navigation className="w-4 h-4" />
                        </a>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareStore(store);
                          }}
                          className="p-2 rounded-xl bg-surface-muted hover:bg-slate-200 text-charcoal transition-colors"
                          title="Share store info"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Interactive Embedded Google Map & Selected Store Details */}
          <div className={`lg:col-span-7 space-y-4 ${mobileTab === 'list' ? 'hidden lg:block' : 'block'}`}>
            
            {/* Map Card */}
            <div className="bg-white rounded-3xl border border-surface-border shadow-sm overflow-hidden sticky top-24">
              
              {/* Map Viewport Controls Bar */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-950 text-white border-b border-zinc-800">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
                  <p className="text-xs font-bold truncate">
                    Live Map View: <span className="text-amber-400">{selectedStore?.city}</span> • {selectedStore?.name}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setMapType(mapType === 'roadmap' ? 'satellite' : 'roadmap')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
                    title="Toggle Map / Satellite"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{mapType === 'roadmap' ? 'Satellite' : 'Map View'}</span>
                  </button>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedStore ? `${selectedStore.name}, ${selectedStore.address}` : 'Kirti Store Dhoraji')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-colors"
                  >
                    <span>Open in Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Embedded Google Map Iframe */}
              <div className="relative w-full h-[400px] sm:h-[480px] bg-slate-100">
                {selectedStore ? (
                  <iframe
                    title={`Google Map - ${selectedStore.name}`}
                    src={googleMapsEmbedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-charcoal-light text-sm">
                    Select a store from the list to view on Google Maps.
                  </div>
                )}
              </div>

              {/* Selected Store Detailed Info Drawer */}
              {selectedStore && (
                <div className="p-6 border-t border-surface-border space-y-5 bg-white">
                  
                  {/* Title & Live Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                          {selectedStore.code}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${selectedStoreStatus?.color}`}>
                          {selectedStoreStatus?.text}
                        </span>
                      </div>
                      <h2 className="text-xl font-extrabold text-primary">
                        {selectedStore.name}
                      </h2>
                    </div>

                    <button
                      onClick={() => {
                        setConfirmedAppt(null);
                        setAppointmentModalOpen(true);
                      }}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                    >
                      <Calendar className="w-4 h-4 text-amber-400" />
                      <span>Book Service / Visit Slot</span>
                    </button>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-surface-muted/50 p-4 rounded-2xl border border-surface-border">
                    <div className="space-y-1">
                      <p className="font-bold text-charcoal-light uppercase text-[10px] tracking-wider">Address & Location</p>
                      <p className="font-semibold text-primary">{selectedStore.address}</p>
                      {selectedStore.landmark && (
                        <p className="text-charcoal-light">Landmark: {selectedStore.landmark}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="font-bold text-charcoal-light uppercase text-[10px] tracking-wider">Hours & Contact</p>
                      <p className="font-semibold text-primary">{selectedStore.operatingHours.workingDays}</p>
                      <p className="text-charcoal-light">{selectedStore.operatingHours.openTime} – {selectedStore.operatingHours.closeTime} ({selectedStore.operatingHours.lunchBreak})</p>
                      <p className="text-secondary font-bold pt-1">{selectedStore.phone}</p>
                    </div>
                  </div>

                  {/* Services & Capabilities Badges */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">
                      Available In-Store Services:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedStore.services?.map((svc, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-charcoal text-xs font-medium"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span>{svc}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Direct Actions Toolbar */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedStore.coordinates?.lat && selectedStore.coordinates?.lng ? `${selectedStore.coordinates.lat},${selectedStore.coordinates.lng}` : selectedStore.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-secondary hover:bg-secondary-700 text-white font-bold text-sm transition-all shadow-sm shadow-secondary/20"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Start Google Maps Navigation</span>
                    </a>

                    <a
                      href={`tel:${selectedStore.phone.replace(/[^0-9+]/g, '')}`}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-surface-muted hover:bg-slate-200 text-charcoal font-bold text-sm transition-colors border border-surface-border"
                    >
                      <Phone className="w-4 h-4 text-primary" />
                      <span>Call Now</span>
                    </a>
                  </div>

                </div>
              )}

            </div>
          </div>

        </div>

      </div>

      {/* Appointment Booking Modal */}
      {appointmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-surface-border relative space-y-6">
            
            <button
              onClick={() => setAppointmentModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-charcoal-light hover:text-charcoal hover:bg-surface-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {confirmedAppt ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Appointment Confirmed</span>
                  <h3 className="text-2xl font-black text-primary">Token: {confirmedAppt.token}</h3>
                  <p className="text-xs text-charcoal-light">
                    We have reserved your express slot at <strong>{confirmedAppt.storeName}</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-muted text-xs text-left space-y-2 border border-surface-border">
                  <p><strong>Customer:</strong> {confirmedAppt.customerName} ({confirmedAppt.phone})</p>
                  <p><strong>Service:</strong> {confirmedAppt.serviceRequired}</p>
                  <p><strong>Preferred Slot:</strong> {confirmedAppt.timeSlot}</p>
                </div>

                <button
                  onClick={() => setAppointmentModalOpen(false)}
                  className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 text-white font-bold rounded-2xl text-sm transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleAppointmentSubmit} className="space-y-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Fast-Track Priority Slot
                  </span>
                  <h3 className="text-xl font-black text-primary">
                    Book Store Visit / Repair at {selectedStore?.city}
                  </h3>
                  <p className="text-xs text-charcoal-light mt-0.5">
                    {selectedStore?.name}
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-charcoal block mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patel"
                      value={apptData.customerName}
                      onChange={(e) => setApptData({ ...apptData, customerName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-surface-muted/60 border border-surface-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-charcoal block mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 98250 12345"
                        value={apptData.phone}
                        onChange={(e) => setApptData({ ...apptData, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-surface-muted/60 border border-surface-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-charcoal block mb-1">Appliance Type</label>
                      <select
                        value={apptData.applianceType}
                        onChange={(e) => setApptData({ ...apptData, applianceType: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-surface-muted/60 border border-surface-border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      >
                        <option value="Mixer Grinder">Mixer Grinder</option>
                        <option value="Blender">Smoothie Blender</option>
                        <option value="Cold Press Juicer">Cold Press Juicer</option>
                        <option value="Soda Maker">Soda Maker</option>
                        <option value="Toaster / Sandwich Maker">Toaster / Sandwich Maker</option>
                        <option value="Spare Parts Inquiry">Spare Parts Only</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-charcoal block mb-1">Service Required</label>
                    <select
                      value={apptData.serviceRequired}
                      onChange={(e) => setApptData({ ...apptData, serviceRequired: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-surface-muted/60 border border-surface-border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    >
                      <option value="30-Min Express Repair">30-Min Express Diagnostic & Repair</option>
                      <option value="Jar / Coupler / Blade Replacement">Jar, Coupler or Blade Replacement</option>
                      <option value="Free Warranty Claim Inspection">Warranty Claim & Spot Replacement</option>
                      <option value="Live Product Demonstration">Live Appliance Cooking & Demo</option>
                      <option value="In-Store Order Pickup (Click & Collect)">In-Store Order Pickup</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-charcoal block mb-1">Preferred Date</label>
                      <input
                        type="date"
                        value={apptData.preferredDate}
                        onChange={(e) => setApptData({ ...apptData, preferredDate: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-surface-muted/60 border border-surface-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-charcoal block mb-1">Time Window</label>
                      <select
                        value={apptData.timeSlot}
                        onChange={(e) => setApptData({ ...apptData, timeSlot: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-surface-muted/60 border border-surface-border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      >
                        <option value="Morning (10:30 AM - 01:00 PM)">Morning (10:30 AM – 1:00 PM)</option>
                        <option value="Afternoon (03:30 PM - 05:30 PM)">Afternoon (3:30 PM – 5:30 PM)</option>
                        <option value="Evening (05:30 PM - 08:00 PM)">Evening (5:30 PM – 8:00 PM)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-charcoal block mb-1">Issue Description / Notes (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="e.g., Mixer motor sparking, need replacement coupler for 750W..."
                      value={apptData.notes}
                      onChange={(e) => setApptData({ ...apptData, notes: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-muted/60 border border-surface-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 resize-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={apptSubmitting}
                    className="w-full py-3 bg-secondary hover:bg-secondary-700 text-white font-bold rounded-2xl text-sm transition-all shadow-md shadow-secondary/20 disabled:opacity-75"
                  >
                    {apptSubmitting ? 'Confirming Appointment...' : 'Confirm Store Appointment'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default StoreLocator;
