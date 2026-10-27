import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, Flame, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const { error: showError } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);

    if (res?.success) {
      if (res.user?.role !== 'admin') {
        showError('Access denied: Administrator privileges required.');
        return;
      }
      navigate('/admin/dashboard');
    }
  };

  const handleAutofill = () => {
    setEmail('admin@kirtistore.com');
    setPassword('Admin@KirtiStore2026');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12 text-slate-100 font-sans">
      <div className="max-w-md w-full bg-slate-900 rounded-3xl border border-slate-800 p-8 sm:p-10 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-block group" title="Kirti Store Home">
            <img 
              src="/logo-white.png" 
              alt="Kirti Store" 
              className="h-10 w-auto mx-auto object-contain transition-transform duration-200 group-hover:scale-105" 
            />
          </Link>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-white mx-auto shadow-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-white">Administrator Portal</h1>
          <p className="text-xs text-slate-400">
            Secure backoffice access for inventory & store management
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-300">Admin Email</label>
            <div className="relative mt-1">
              <input
                type="email"
                required
                placeholder="admin@kirtistore.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-300">Password</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-secondary hover:bg-secondary-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting ? 'Verifying...' : 'Access Admin Console'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Quick Button */}
        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-center">
          <button
            type="button"
            onClick={handleAutofill}
            className="text-xs text-accent hover:underline font-bold"
          >
            Autofill Default Admin Credentials
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
