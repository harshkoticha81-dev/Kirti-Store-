import React, { useState, useEffect } from 'react';
import { MapPin, Truck, ShieldCheck, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { lookupPincode } from '../../utils/pincodeService';

const popularCities = [
  { name: 'Mumbai', pin: '400001' },
  { name: 'Delhi NCR', pin: '110001' },
  { name: 'Bengaluru', pin: '560001' },
  { name: 'Hyderabad', pin: '500001' },
  { name: 'Pune', pin: '411001' },
  { name: 'Chennai', pin: '600001' }
];

const PincodeChecker = ({ sellingPrice = 1999 }) => {
  const [pincode, setPincode] = useState(() => {
    return localStorage.getItem('kirti_pincode') || '400013';
  });
  const [checkedInfo, setCheckedInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingCity, setLoadingCity] = useState(false);

  const calculateDelivery = async (pin) => {
    if (!/^\d{6}$/.test(pin)) {
      setErrorMsg('Please enter a valid 6-digit Indian PIN code.');
      setCheckedInfo(null);
      return;
    }

    setErrorMsg('');
    localStorage.setItem('kirti_pincode', pin);

    // Dynamic dates (Standard 3-5 business days dispatch)
    const now = new Date();
    const estDate = new Date();
    estDate.setDate(now.getDate() + 4);

    const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    const formattedDate = estDate.toLocaleDateString('en-IN', dateOptions);

    setLoadingCity(true);
    let cityName = '';
    let stateName = '';
    try {
      const pinData = await lookupPincode(pin);
      if (pinData && pinData.success) {
        cityName = pinData.city;
        stateName = pinData.state;
      }
    } catch (e) {
      console.warn('City lookup error:', e);
    } finally {
      setLoadingCity(false);
    }

    setCheckedInfo({
      pincode: pin,
      city: cityName,
      state: stateName,
      deliveryDate: formattedDate,
      isFree: sellingPrice >= 999,
      prepaidSecured: true,
      replacementDays: 7
    });
  };

  useEffect(() => {
    if (pincode && /^\d{6}$/.test(pincode)) {
      calculateDelivery(pincode);
    }
  }, []);

  const handleCheck = (e) => {
    e.preventDefault();
    calculateDelivery(pincode);
  };

  return (
    <div className="bg-surface-muted/50 rounded-2xl border border-surface-border p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
          <Truck className="w-4 h-4 text-secondary" />
          <span>Delivery & Service Availability</span>
        </div>
        <span className="text-[11px] text-charcoal-light flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
          <span>Standard Safe Dispatch</span>
        </span>
      </div>

      {/* Pincode Form */}
      <form onSubmit={handleCheck} className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="w-4 h-4 text-charcoal-light absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            maxLength={6}
            value={pincode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              setPincode(val);
              setErrorMsg('');
            }}
            placeholder="Enter 6-digit Delivery Pincode"
            className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-surface-border text-xs sm:text-sm font-semibold text-primary placeholder-charcoal-light focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-primary hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex-shrink-0"
        >
          Check
        </button>
      </form>

      {/* Popular Metro Quick Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[10px] text-charcoal-light font-medium mr-1">Metros:</span>
        {popularCities.map((city) => (
          <button
            key={city.name}
            type="button"
            onClick={() => {
              setPincode(city.pin);
              calculateDelivery(city.pin);
            }}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
              pincode === city.pin
                ? 'bg-secondary text-white border-secondary font-bold'
                : 'bg-white border-surface-border text-charcoal hover:border-secondary'
            }`}
          >
            {city.name}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 pt-1">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </p>
      )}

      {/* Results Box */}
      {checkedInfo && !errorMsg && (
        <div className="pt-2 border-t border-surface-border space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <div>
              <span>
                Guaranteed Delivery to{' '}
                <strong>
                  {checkedInfo.city ? `${checkedInfo.city}${checkedInfo.state ? `, ${checkedInfo.state}` : ''} (${checkedInfo.pincode})` : checkedInfo.pincode}
                </strong>{' '}
                by <strong>{checkedInfo.deliveryDate}</strong>
              </span>
              <p className="text-[10px] text-emerald-600 font-normal">Dispatched via Blue Dart / Delhivery Express Priority</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-charcoal pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>{checkedInfo.isFree ? 'FREE Express Shipping' : 'Standard Shipping ₹99'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>100% Prepaid Secure Checkout</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>7-Day Replacement Policy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Free Transit Insurance</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PincodeChecker;
