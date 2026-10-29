import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, MapPin, Clock, Send, MessageSquare, CheckCircle2, Navigation, Store } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Contact = () => {
  const { success } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Product Inquiry',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    success('Thank you! Your message has been sent to Kirti Store Support.');
    setSubmitted(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-secondary">
          Customer Care
        </span>
        <h1 className="text-3xl font-black text-primary">Get in Touch with Us</h1>
        <p className="text-sm text-charcoal-light">
          Have queries about an appliance, order status, or warranty claims? Our team is ready to assist.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Contact Info cards */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-surface-border shadow-sm space-y-4">
            <h3 className="font-bold text-base text-primary">Headquarters & Support</h3>

            <div className="space-y-4 text-xs text-charcoal">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-primary">Store Address</p>
                  <p className="text-charcoal-light">Kirti Store, Main Bazar, Opp. Nandkurba Hospital, Dhoraji - 360410, Gujarat</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-primary">Customer Care / Support</p>
                  <p className="text-charcoal-light">+91 94282 82008</p>
                </div>
              </div>


              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-primary">Operational Hours</p>
                  <p className="text-charcoal-light">Morning: 10:00 AM – 1:00 PM | Evening: 3:00 PM – 8:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Store Locator Card */}
          <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 text-white p-6 rounded-3xl border border-zinc-800 shadow-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Find Nearest Store or Service Center</h4>
                <p className="text-xs text-zinc-400">8+ outlets with live Google Maps navigation</p>
              </div>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Need immediate mixer repair, original spare parts, or want to test kitchen appliances in person?
            </p>
            <Link
              to="/stores"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors shadow-sm"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Open Interactive Store Locator</span>
            </Link>
          </div>
        </div>

        {/* Message Form */}
        <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-surface-border shadow-sm">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-primary">Message Received!</h3>
              <p className="text-xs text-charcoal-light max-w-sm mx-auto">
                A member of our customer care team will review your inquiry and respond within 24 business hours.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', phone: '', subject: 'Product Inquiry', message: '' });
                }}
                className="px-6 py-2 bg-secondary text-white text-xs font-bold rounded-xl"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-secondary" />
                Send a Direct Message
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-charcoal">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-surface-muted border border-surface-border"
                    placeholder="Pooja Sharma"
                  />
                </div>
                <div>
                  <label className="font-semibold text-charcoal">Your Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-surface-muted border border-surface-border"
                    placeholder="pooja@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-charcoal">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-surface-muted border border-surface-border"
                    placeholder="+91 9876543210"
                  />
                </div>
                <div>
                  <label className="font-semibold text-charcoal">Subject</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-surface-muted border border-surface-border"
                  >
                    <option value="Product Inquiry">Product Inquiry</option>
                    <option value="Order Status">Order Tracking</option>
                    <option value="Warranty Claim">Warranty Registration</option>
                    <option value="Feedback">Feedback / Suggestions</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-charcoal">Your Message *</label>
                <textarea
                  rows="4"
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can we assist with your appliance needs?"
                  className="w-full mt-1 px-4 py-2.5 rounded-xl bg-surface-muted border border-surface-border"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 bg-secondary hover:bg-secondary-700 text-white font-bold rounded-xl shadow flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Inquiry</span>
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default Contact;
