import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, Phone, Flame, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const { error: showError } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Password strength checker
  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let strength = 0;
    if (pass.length >= 6) strength += 25;
    if (pass.length >= 10) strength += 25;
    if (/[A-Z]/.test(pass)) strength += 25;
    if (/[0-9!@#$%^&*]/.test(pass)) strength += 25;
    return strength;
  };

  const strength = getPasswordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      showError('Passwords do not match. Please re-enter.');
      return;
    }

    if (formData.password.length < 6) {
      showError('Password must be at least 6 characters long.');
      return;
    }

    if (!formData.acceptTerms) {
      showError('Please agree to the Terms of Service to register.');
      return;
    }

    setSubmitting(true);
    const result = await register({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
    });
    setSubmitting(false);

    if (result?.success) {
      navigate(redirect);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-surface-border p-8 sm:p-10 shadow-premium space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-block group" title="Kirti Store Home">
            <img 
              src="/logo-color.png" 
              alt="Kirti Store" 
              className="h-11 w-auto mx-auto object-contain transition-transform duration-200 group-hover:scale-105" 
            />
          </Link>
          <h1 className="text-2xl font-black text-primary">Create Your Account</h1>
          <p className="text-xs text-charcoal-light">
            Join Kirti Store for seamless shopping and product warranty tracking
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-charcoal">Full Name *</label>
            <div className="relative mt-1">
              <input
                type="text"
                name="name"
                required
                placeholder="Rohit Sharma"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-muted border border-surface-border text-charcoal focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
              />
              <User className="w-4 h-4 text-charcoal-light absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="font-semibold text-charcoal">Email Address *</label>
            <div className="relative mt-1">
              <input
                type="email"
                name="email"
                required
                placeholder="rohit@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-muted border border-surface-border text-charcoal focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
              />
              <Mail className="w-4 h-4 text-charcoal-light absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="font-semibold text-charcoal">Phone Number</label>
            <div className="relative mt-1">
              <input
                type="tel"
                name="phone"
                placeholder="+91 9876543210"
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-muted border border-surface-border text-charcoal focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
              />
              <Phone className="w-4 h-4 text-charcoal-light absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="font-semibold text-charcoal">Password *</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                placeholder="Min 6 characters"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-surface-muted border border-surface-border text-charcoal focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
              />
              <Lock className="w-4 h-4 text-charcoal-light absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal-light hover:text-charcoal"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength Bar */}
            {formData.password && (
              <div className="mt-2 space-y-1">
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      strength <= 25 ? 'bg-rose-500 w-1/4' : strength <= 50 ? 'bg-amber-500 w-2/4' : strength <= 75 ? 'bg-blue-500 w-3/4' : 'bg-emerald-500 w-full'
                    }`}
                  />
                </div>
                <p className="text-[10px] text-charcoal-light">
                  Strength: {strength <= 25 ? 'Weak' : strength <= 50 ? 'Fair' : strength <= 75 ? 'Good' : 'Strong'}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="font-semibold text-charcoal">Confirm Password *</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                required
                placeholder="Repeat your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-muted border border-surface-border text-charcoal focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
              />
              <Lock className="w-4 h-4 text-charcoal-light absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <label className="flex items-start gap-2 pt-1 text-xs text-charcoal cursor-pointer">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleChange}
              className="mt-0.5 rounded text-secondary focus:ring-secondary cursor-pointer"
            />
            <span>
              I agree to the <Link to="/contact" className="text-secondary font-semibold hover:underline">Terms of Service</Link> and Privacy Policy.
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-secondary hover:bg-secondary-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting ? 'Creating Account...' : 'Complete Registration'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center text-xs text-charcoal-light">
          Already registered?{' '}
          <Link to={`/login${redirect ? `?redirect=${redirect}` : ''}`} className="font-bold text-secondary hover:underline">
            Sign In Here
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Register;
