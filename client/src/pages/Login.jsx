import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Flame, ArrowRight, ShieldCheck } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result?.success) {
      if (result.user?.role === 'admin' && redirect === '/') {
        navigate('/admin/dashboard');
      } else {
        navigate(redirect);
      }
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) return;
    setSubmitting(true);
    const result = await googleLogin(credentialResponse.credential);
    setSubmitting(false);

    if (result?.success) {
      if (result.user?.role === 'admin' && redirect === '/') {
        navigate('/admin/dashboard');
      } else {
        navigate(redirect);
      }
    }
  };

  const handleGoogleError = () => {
    console.warn('[Google Sign-In]: Authentication dialog closed or failed.');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
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
          <h1 className="text-2xl font-black text-primary">Sign in to Kirti Store</h1>
          <p className="text-xs text-charcoal-light">
            Access your orders, saved wishlist, and faster checkout
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-charcoal">Email Address</label>
            <div className="relative mt-1">
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-muted border border-surface-border text-charcoal focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
              />
              <Mail className="w-4 h-4 text-charcoal-light absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="font-semibold text-charcoal">Password</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-900 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Google Sign In Divider & Button */}
        <div className="space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="border-t border-surface-border w-full"></div>
            <span className="bg-white px-3 text-[11px] font-semibold text-charcoal-light uppercase tracking-wider shrink-0">
              or continue with
            </span>
            <div className="border-t border-surface-border w-full"></div>
          </div>

          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              shape="pill"
              size="large"
              text="signin_with"
              theme="outline"
              width="100%"
            />
          </div>
        </div>

        {/* Footer Link */}
        <div className="text-center text-xs text-charcoal-light">
          Don't have an account yet?{' '}
          <Link to={`/register${redirect ? `?redirect=${redirect}` : ''}`} className="font-bold text-secondary hover:underline">
            Create an Account
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;
