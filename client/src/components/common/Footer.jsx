import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Phone, MapPin, ShieldCheck, Truck, Award, Send } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const Footer = () => {
  const [email, setEmail] = useState('');
  const { success, error: showError } = useToast();

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/.test(email)) {
      showError('Please enter a valid email address.');
      return;
    }
    success('Thank you for subscribing to Kirti Store newsletters!');
    setEmail('');
  };

  return (
    <footer className="bg-zinc-950 text-zinc-300 pt-16 pb-8 border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Value Proposition Highlights Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white flex-shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Genuine Quality</h4>
              <p className="text-xs text-zinc-400">100% certified kitchen appliances</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 flex-shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Free Express Delivery</h4>
              <p className="text-xs text-zinc-400">On all orders above ₹999</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">2-Year Warranty</h4>
              <p className="text-xs text-zinc-400">Comprehensive manufacturer coverage</p>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 py-12 border-b border-slate-800">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block group" title="Kirti Store Home">
              <img 
                src="/logo-white.png" 
                alt="Kirti Store" 
                className="h-10 sm:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105" 
              />
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Smart Appliances. Smarter Living. Dedicated to engineering durable, aesthetic, and energy-efficient kitchen appliances tailored for modern Indian culinary homes.
            </p>
            <div className="space-y-2 text-xs text-zinc-400 pt-2">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                <span>Kirti Store, Main Bazar, Opp. Nandkurba Hospital, Dhoraji - 360410</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                <span>Support: +91 94282 82008 (Morning 10AM - 1PM & 3PM - 8PM)</span>
              </p>
            </div>
          </div>

          {/* Categories Links */}
          <div className="space-y-3">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider">Top Categories</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><Link to="/shop?category=mixers-grinders" className="hover:text-white transition-colors">Mixers & Grinders</Link></li>
              <li><Link to="/shop?category=blenders" className="hover:text-white transition-colors">Smoothie Blenders</Link></li>
              <li><Link to="/shop?category=soda-makers" className="hover:text-white transition-colors">Home Soda Makers</Link></li>
              <li><Link to="/shop?category=juicers" className="hover:text-white transition-colors">Cold Press Juicers</Link></li>
              <li><Link to="/shop?category=electric-kettles" className="hover:text-white transition-colors">Electric Kettles</Link></li>
              <li><Link to="/shop?category=food-processors" className="hover:text-white transition-colors">Food Processors</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider">Customer Care</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><Link to="/track-order" className="hover:text-white transition-colors">Live Shipment Tracker</Link></li>
              <li><Link to="/stores" className="hover:text-white transition-colors text-amber-400 font-semibold">Store Locator & Service Centers</Link></li>
              <li><Link to="/compare" className="hover:text-white transition-colors">Compare Appliances</Link></li>
              <li><Link to="/buying-guide" className="hover:text-white transition-colors">Culinary Buying Guide</Link></li>
              <li><Link to="/warranty-registration" className="hover:text-white transition-colors text-amber-400 font-semibold">Warranty Registration & Certificate</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">FAQs & Support</Link></li>
              <li><Link to="/admin/login" className="hover:text-white transition-colors font-semibold text-secondary">Admin Portal</Link></li>
            </ul>
          </div>

          {/* Newsletter Form */}
          <div className="space-y-4">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider">Stay Updated</h4>
            <p className="text-xs text-zinc-400">
              Subscribe for exclusive kitchen recipe guides, discount drops, and product care tips.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 transition-colors"
                  title="Subscribe"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-slate-500">We respect your privacy. Unsubscribe anytime.</p>
            </form>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
