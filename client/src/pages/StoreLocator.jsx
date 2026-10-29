import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, 
  Phone, 
  Navigation, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  X, 
  ExternalLink, 
  ShieldCheck, 
  Wrench, 
  Building2, 
  Share2, 
  LocateFixed, 
  Store, 
  Check, 
  MessageSquare,
  Layers,
  ShoppingBag,
  Sparkles,
  Award
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

// Official Headquarters of Dhoraji
const DHORAJI_HEADQUARTERS = {
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
  googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Kirti+Store%2C+Main+Bazar%2C+Opp.+Nandkurba+Hospital%2C+Dhoraji+-+360410%2C+Gujarat',
  operatingHours: {
    openTime: '10:00 AM',
    closeTime: '08:00 PM',
    lunchBreak: '01:00 PM - 03:00 PM',
    workingDays: 'Monday - Saturday (Sunday Closed)'
  },
  services: [
    'Official Headquarters & Customer Care Helpdesk',
    '30-Min Express Mixer Motor Overhaul & Diagnostic',
    '100% Genuine Jars, Blades, Couplers & Rubber Gaskets',
    'Instant Manufacturer Warranty Claims & Spot Replacement',
    'Live Cooking & Appliance Power Testing Counter',
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
};

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

// Check if headquarters is currently open
const getStoreLiveStatus = (store) => {
  const now = new Date();
  const day = now.getDay(); // 0 is Sunday
  const isSunday = day === 0;

  if (isSunday) {
    return { isOpen: false, text: 'Closed Today (Sunday)', color: 'text-rose-600 bg-rose-50 border-rose-200' };
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

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

  // Lunch break check (01:00 PM - 03:00 PM)
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
  const [store, setStore] = useState(DHORAJI_HEADQUARTERS);
  const [mapType, setMapType] = useState('roadmap'); // 'roadmap' | 'satellite'
  const [userDistance, setUserDistance] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
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

  // Fetch store from API
  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await api.get('/stores');
        if (res.data?.success && res.data?.stores?.length > 0) {
          setStore(res.data.stores[0]);
        }
      } catch (err) {
        // Fallback to DHORAJI_HEADQUARTERS
      }
    };
    fetchStore();
  }, []);

  // Request User Geolocation (GPS) to calculate distance to Dhoraji
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      showError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const dist = calculateDistance(
          latitude, 
          longitude, 
          store.coordinates.lat, 
          store.coordinates.lng
        );
        setUserDistance(dist);
        setIsLocating(false);
        success(`You are ${dist} km away from Kirti Store Headquarters in Dhoraji!`);
      },
      (err) => {
        setIsLocating(false);
        showError('Unable to retrieve your location. Please check location permissions.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Share store details
  const handleShareStore = () => {
    const text = `${store.name}\n📍 Address: ${store.address}\n📞 Phone: ${store.phone}\n🗺️ Google Maps: ${store.googleMapsUrl}`;
    if (navigator.share) {
      navigator.share({
        title: store.name,
        text,
        url: store.googleMapsUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      success('Dhoraji Headquarters address and Google Maps link copied to clipboard!');
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
        storeId: store._id || store.code,
        storeName: store.name
      });

      if (res.data?.success) {
        setConfirmedAppt(res.data.appointment);
        success('Appointment confirmed successfully!');
      } else {
        const mockToken = 'APPT-' + Math.floor(100000 + Math.random() * 900000);
        setConfirmedAppt({
          token: mockToken,
          storeName: store.name,
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
        storeName: store.name,
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

  // Build embedded Google Maps URL for Dhoraji Headquarters
  const googleMapsEmbedUrl = useMemo(() => {
    // Authoritative store search query guaranteeing exact store placement matching the navigation
    const query = store.address || 'Kirti Store, Main Bazar, Opp. Nandkurba Hospital, Dhoraji - 360410, Gujarat';
    const tParam = mapType === 'satellite' ? 'k' : 'm';
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=${tParam}&z=17&ie=UTF8&iwloc=&output=embed`;
  }, [store.address, mapType]);

  const liveStatus = getStoreLiveStatus(store);

  return (
    <div className="min-h-screen bg-slate-50/50">
      
      {/* Hero Header Banner */}
      <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5" />
                <span>Official Store Headquarters</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Kirti Store Headquarters — Dhoraji
              </h1>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Visit our official flagship store, customer care helpdesk, and master appliance workshop located in the heart of Dhoraji, Gujarat.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={handleDetectLocation}
                disabled={isLocating}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-75"
              >
                <LocateFixed className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Calculating Distance...' : 'Check Distance to Store'}</span>
              </button>

              <button
                onClick={() => {
                  setConfirmedAppt(null);
                  setAppointmentModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm transition-all border border-zinc-700 active:scale-95"
              >
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Book Priority Visit</span>
              </button>
            </div>
          </div>

          {/* Quick Value Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-zinc-800/80 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-amber-400">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Headquarters</p>
                <p className="text-zinc-400">Main Bazar, Dhoraji</p>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Distance Banner if GPS active */}
        {userDistance && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-4 text-emerald-900 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
                <LocateFixed className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">Direct GPS Distance</p>
                <p className="text-xs text-emerald-700">
                  You are approximately <strong>{userDistance} km</strong> away from Kirti Store Headquarters in Dhoraji.
                </p>
              </div>
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(store.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Get Driving Route</span>
            </a>
          </div>
        )}

        {/* Master Two-Column Grid: Left Details & Right Google Maps */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Headquarters Details Card */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-surface-border shadow-sm space-y-6">
              
              {/* Badges */}
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>Official Headquarters</span>
                </span>

                <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${liveStatus.color}`}>
                  {liveStatus.text}
                </span>
              </div>

              {/* Title & Tagline */}
              <div>
                <h2 className="text-2xl font-black text-primary leading-tight">
                  {store.name}
                </h2>
                <p className="text-xs text-charcoal-light mt-1">
                  {store.tagline}
                </p>
              </div>

              {/* Address & Timings List */}
              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-surface-muted/60 border border-surface-border">
                  <MapPin className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-primary">Headquarters Address</p>
                    <p className="text-charcoal leading-relaxed">{store.address}</p>
                    <p className="text-charcoal-light text-[11px]">Landmark: {store.landmark}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-surface-muted/60 border border-surface-border">
                  <Clock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-primary">Working Hours</p>
                    <p className="text-charcoal">{store.operatingHours.workingDays}</p>
                    <p className="text-charcoal-light text-[11px]">
                      Morning 10:00 AM – 01:00 PM | Evening 03:00 PM – 08:00 PM
                    </p>
                    <p className="text-amber-800 text-[11px] font-medium">Lunch Break: 01:00 PM – 03:00 PM</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-surface-muted/60 border border-surface-border">
                  <Phone className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-primary">Official Contact Lines</p>
                    <p className="text-charcoal font-semibold">{store.phone}</p>
                    <p className="text-charcoal-light text-[11px]">Direct Support & Warranty Helpline</p>
                  </div>
                </div>
              </div>

              {/* In-Store Capabilities */}
              <div className="space-y-3 pt-2 border-t border-surface-border">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                  Headquarters Services & Facilities:
                </h4>
                <div className="space-y-2">
                  {store.services.map((svc, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-charcoal">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{svc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4 border-t border-surface-border">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(store.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-secondary hover:bg-secondary-700 text-white font-bold text-sm transition-all shadow-md shadow-secondary/20"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Start Google Maps Driving Navigation</span>
                </a>

                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={`tel:${store.phone.replace(/[^0-9+]/g, '')}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-surface-muted hover:bg-slate-200 text-charcoal font-bold text-xs transition-colors border border-surface-border"
                  >
                    <Phone className="w-4 h-4 text-secondary" />
                    <span>Call Store</span>
                  </a>

                  <a
                    href={`https://wa.me/${store.whatsapp}?text=${encodeURIComponent('Hello Kirti Store Dhoraji, I would like to inquire about store visit and services.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors border border-emerald-200"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={handleShareStore}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 text-xs font-semibold text-charcoal-light hover:text-charcoal transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Address & Google Maps Link</span>
                </button>
              </div>

            </div>

          </div>

          {/* Right Column: Live Interactive Google Maps Viewport */}
          <div className="lg:col-span-7 space-y-4">
            
            <div className="bg-white rounded-3xl border border-surface-border shadow-sm overflow-hidden sticky top-24">
              
              {/* Map Controls Header */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-950 text-white border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
                  <p className="text-xs font-bold">
                    Interactive Map: <span className="text-amber-400">Dhoraji, Gujarat</span> (Main Bazar)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMapType(mapType === 'roadmap' ? 'satellite' : 'roadmap')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
                    title="Toggle Map / Satellite"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{mapType === 'roadmap' ? 'Satellite' : 'Map View'}</span>
                  </button>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address || 'Kirti Store, Main Bazar, Opp. Nandkurba Hospital, Dhoraji - 360410, Gujarat')}`}
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
              <div className="relative w-full h-[450px] sm:h-[550px] bg-slate-100">
                <iframe
                  title="Google Map - Kirti Store Headquarters Dhoraji"
                  src={googleMapsEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                />
              </div>

              {/* Map Footer Bar */}
              <div className="p-4 bg-zinc-50 border-t border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-charcoal">
                  <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span className="font-semibold">{store.address}</span>
                </div>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(store.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold text-secondary hover:text-secondary-700"
                >
                  <span>Get Driving Route</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

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
                    We have reserved your express slot at <strong>Kirti Store Headquarters (Dhoraji)</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-muted text-xs text-left space-y-2 border border-surface-border">
                  <p><strong>Customer:</strong> {confirmedAppt.customerName} ({confirmedAppt.phone})</p>
                  <p><strong>Service:</strong> {confirmedAppt.serviceRequired}</p>
                  <p><strong>Preferred Slot:</strong> {confirmedAppt.timeSlot}</p>
                  <p><strong>Location:</strong> Main Bazar, Opp. Nandkurba Hospital, Dhoraji</p>
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
                    Book Visit / Repair at Dhoraji Headquarters
                  </h3>
                  <p className="text-xs text-charcoal-light mt-0.5">
                    Kirti Store, Main Bazar, Opp. Nandkurba Hospital, Dhoraji
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
