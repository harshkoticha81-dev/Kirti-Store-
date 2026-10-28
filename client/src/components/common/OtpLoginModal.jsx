import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Phone, 
  ShieldCheck, 
  ArrowRight, 
  RotateCw, 
  X, 
  Lock, 
  ShoppingBag, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { auth, RecaptchaVerifier, signInWithPhoneNumber, isFirebaseConfigured } from '../../config/firebase';
import { getSafeProductImageUrl, getApplianceFallbackImage } from '../../utils/imageUtils';

const RESEND_TIMEOUT_SECONDS = 60;

const OtpLoginModal = ({ isOpen, onClose, product, onSuccess }) => {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(RESEND_TIMEOUT_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [demoOtpHint, setDemoOtpHint] = useState('');

  const otpInputsRef = useRef([]);
  const recaptchaVerifierRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const { sendPhoneOtp, verifyPhoneOtp } = useAuth();
  const { success: showToastSuccess, error: showToastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Reset modal state when opening
  useEffect(() => {
    if (isOpen) {
      setStep('phone');
      setPhoneNumber('');
      setOtpValues(['', '', '', '', '', '']);
      setErrorMsg('');
      setDemoOtpHint('');
      setConfirmationResult(null);
      setTimer(RESEND_TIMEOUT_SECONDS);
      setCanResend(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      clearInterval(timerIntervalRef.current);
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (_) {}
        recaptchaVerifierRef.current = null;
      }
    }
    return () => {
      document.body.style.overflow = 'unset';
      clearInterval(timerIntervalRef.current);
    };
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Countdown timer logic
  useEffect(() => {
    if (step === 'otp' && timer > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [step, timer]);

  if (!isOpen) return null;

  // Initialize invisible reCAPTCHA for Firebase Phone Auth
  const setupRecaptcha = () => {
    if (!isFirebaseConfigured || !auth) return null;
    try {
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'otp-recaptcha-container', {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved
          },
          'expired-callback': () => {
            setErrorMsg('reCAPTCHA expired. Please try again.');
          }
        });
      }
      return recaptchaVerifierRef.current;
    } catch (err) {
      console.warn('[Recaptcha Init Warning]:', err.message);
      return null;
    }
  };

  // Step 1: Send OTP handler
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    if (cleanedPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanedPhone)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number (starting with 6-9).');
      return;
    }

    setLoading(true);
    const fullPhone = `+91${cleanedPhone}`;

    try {
      // 1. If Firebase Client is configured, send real SMS via Firebase Phone Auth
      if (isFirebaseConfigured && auth) {
        try {
          const appVerifier = setupRecaptcha();
          if (appVerifier) {
            const confirmation = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
            setConfirmationResult(confirmation);
            showToastSuccess(`OTP sent via SMS to ${fullPhone}`);
            setStep('otp');
            setTimer(RESEND_TIMEOUT_SECONDS);
            setCanResend(false);
            setLoading(false);
            setTimeout(() => otpInputsRef.current[0]?.focus(), 200);
            return;
          }
        } catch (firebaseErr) {
          console.warn('[Firebase SMS Fallback]:', firebaseErr.message);
          // Fall through to server OTP engine
        }
      }

      // 2. Server OTP Engine
      const res = await sendPhoneOtp(fullPhone);
      if (res?.success) {
        if (res.demoOtp) {
          setDemoOtpHint(res.demoOtp);
        }
        setStep('otp');
        setTimer(RESEND_TIMEOUT_SECONDS);
        setCanResend(false);
        setTimeout(() => otpInputsRef.current[0]?.focus(), 200);
      } else {
        setErrorMsg(res?.message || 'Unable to send OTP. Please try again.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong while sending the OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend OTP handler
  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setOtpValues(['', '', '', '', '', '']);
    setErrorMsg('');
    await handleSendOtp();
  };

  // OTP Inputs handling (digit typing, backspace, paste)
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newValues = [...otpValues];
    // Handle single digit
    newValues[index] = value.slice(-1);
    setOtpValues(newValues);
    setErrorMsg('');

    // Auto advance focus
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (!pastedData) return;

    const digits = pastedData.slice(0, 6).split('');
    const newValues = [...otpValues];
    digits.forEach((digit, idx) => {
      newValues[idx] = digit;
    });
    setOtpValues(newValues);

    const focusIndex = Math.min(digits.length, 5);
    otpInputsRef.current[focusIndex]?.focus();
  };

  // Step 2: Verify OTP and Login
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const enteredOtp = otpValues.join('');

    if (enteredOtp.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the OTP.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    const fullPhone = `+91${phoneNumber.replace(/\D/g, '')}`;

    try {
      let authUser = null;

      // Method A: Firebase confirmationResult
      if (confirmationResult) {
        try {
          const userCredential = await confirmationResult.confirm(enteredOtp);
          const idToken = await userCredential.user.getIdToken();
          const serverRes = await verifyPhoneOtp({
            phone: fullPhone,
            idToken
          });
          if (serverRes?.success) {
            authUser = serverRes.user;
          }
        } catch (firebaseConfirmErr) {
          console.warn('[Firebase Confirm Fallback]:', firebaseConfirmErr.message);
          // Fall back to server OTP verification if token validation fails
        }
      }

      // Method B: Server verification fallback
      if (!authUser) {
        const serverRes = await verifyPhoneOtp({
          phone: fullPhone,
          otp: enteredOtp
        });
        if (serverRes?.success) {
          authUser = serverRes.user;
        } else {
          setErrorMsg(serverRes?.message || 'Invalid OTP. Please check and try again.');
          setLoading(false);
          return;
        }
      }

      if (authUser) {
        showToastSuccess(`Logged in successfully as ${authUser.name}!`);
        if (typeof onSuccess === 'function') {
          onSuccess(authUser);
        }
        onClose();

        // If user logged in while on the /login route, redirect appropriately
        if (location.pathname === '/login') {
          const params = new URLSearchParams(location.search);
          const redirectParam = params.get('redirect');
          if (authUser.role === 'admin' && (!redirectParam || redirectParam === '/')) {
            navigate('/admin/dashboard');
          } else {
            navigate(redirectParam ? decodeURIComponent(redirectParam) : '/');
          }
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPhone = () => {
    setStep('phone');
    setOtpValues(['', '', '', '', '', '']);
    setErrorMsg('');
    clearInterval(timerIntervalRef.current);
  };

  const currentRedirect = encodeURIComponent(location.pathname + location.search);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Invisible container for Firebase reCAPTCHA */}
      <div id="otp-recaptcha-container"></div>

      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div 
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-surface-border overflow-hidden z-10 animate-in zoom-in-95 fade-in duration-200 p-6 sm:p-8"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-2 text-charcoal-light hover:text-charcoal hover:bg-surface-muted rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-5">
          <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Smartphone className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-primary tracking-tight">
            {step === 'phone' ? 'Instant Mobile Login' : 'Enter 6-Digit OTP'}
          </h2>
          <p className="text-xs text-charcoal-light max-w-xs mx-auto">
            {step === 'phone' 
              ? 'Enter your mobile number to receive a one-time password (OTP)'
              : `Enter the code sent via SMS to +91 ${phoneNumber}`}
          </p>
        </div>

        {/* Product Preview Banner if opened from "Add to Cart" */}
        {product && (
          <div className="mb-5 p-3 rounded-2xl bg-surface-muted/70 border border-surface-border flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white p-1 border border-surface-border flex-shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src={getSafeProductImageUrl(product.images?.[0], product.categoryName || product.name)}
                alt={product.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = getApplianceFallbackImage(product.categoryName || product.name);
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-secondary uppercase tracking-wider">
                <Sparkles className="w-3 h-3" /> Auto-Adds to Cart
              </span>
              <p className="text-xs font-bold text-primary truncate">{product.name}</p>
              <p className="text-xs font-black text-secondary">
                ₹{(product.sellingPrice || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        )}

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-tight font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Demo OTP Hint (for immediate testing in dev/demo) */}
        {demoOtpHint && (
          <div className="mb-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center justify-between animate-in fade-in">
            <span><strong>Demo OTP:</strong> {demoOtpHint}</span>
            <button
              type="button"
              onClick={() => {
                const digits = demoOtpHint.split('');
                setOtpValues(digits);
              }}
              className="text-xs font-bold text-secondary hover:underline"
            >
              Autofill
            </button>
          </div>
        )}

        {/* STEP 1: Phone Input Form */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-charcoal mb-1.5">
                Mobile Number
              </label>
              <div className="relative flex items-center">
                {/* Country Code Prefix */}
                <div className="absolute left-3 flex items-center gap-1.5 pointer-events-none text-charcoal font-bold text-xs select-none">
                  <span className="text-sm">🇮🇳</span>
                  <span>+91</span>
                  <span className="text-surface-border">|</span>
                </div>

                <input
                  type="tel"
                  maxLength={10}
                  autoFocus
                  placeholder="98765 43210"
                  value={phoneNumber}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    setPhoneNumber(clean);
                    setErrorMsg('');
                  }}
                  className="w-full pl-20 pr-4 py-3.5 rounded-2xl bg-surface-muted border border-surface-border text-sm font-semibold text-charcoal tracking-wider placeholder-charcoal-light/60 focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all"
                />
              </div>
              <p className="text-[11px] text-charcoal-light mt-1.5 pl-1">
                We'll send a 6-digit verification code via SMS
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || phoneNumber.length !== 10}
              className="w-full py-3.5 rounded-2xl bg-secondary hover:bg-secondary-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-secondary/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Sending OTP...</span>
                </>
              ) : (
                <>
                  <span>Send OTP via SMS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: 6-Digit OTP Verification Form */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            {/* Phone Info & Change Number */}
            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-semibold text-charcoal">
                Sent to: <strong className="text-primary">+91 {phoneNumber}</strong>
              </span>
              <button
                type="button"
                onClick={handleEditPhone}
                className="text-secondary font-bold hover:underline"
              >
                Change
              </button>
            </div>

            {/* Verification Code Banner (when SMS gateway pending configuration) */}
            {demoOtpHint && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between shadow-sm animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Your OTP:</strong>{' '}
                    <span className="font-mono font-bold tracking-widest text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300 ml-1">
                      {demoOtpHint}
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const digits = demoOtpHint.split('');
                    setOtpValues(digits);
                    setTimeout(() => otpInputsRef.current[5]?.focus(), 50);
                  }}
                  className="text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded-lg transition-all active:scale-95 cursor-pointer"
                >
                  Autofill Code
                </button>
              </div>
            )}

            {/* 6 Individual Digit Inputs */}
            <div className="flex justify-between gap-2" onPaste={handlePaste}>
              {otpValues.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpInputsRef.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-black rounded-xl bg-surface-muted border border-surface-border text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
                />
              ))}
            </div>

            {/* Timer & Resend Button */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-charcoal-light">
                {timer > 0 ? (
                  <span>Resend OTP in <strong className="text-secondary font-bold">{timer}s</strong></span>
                ) : (
                  <span>Didn't receive code?</span>
                )}
              </span>

              <button
                type="button"
                disabled={!canResend || loading}
                onClick={handleResendOtp}
                className={`font-bold text-xs flex items-center gap-1 transition-colors ${
                  canResend && !loading 
                    ? 'text-secondary hover:underline cursor-pointer' 
                    : 'text-charcoal-light/50 cursor-not-allowed'
                }`}
              >
                <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Resend OTP</span>
              </button>
            </div>

            {/* Submit Verification Button */}
            <button
              type="submit"
              disabled={loading || otpValues.join('').length !== 6}
              className="w-full py-3.5 rounded-2xl bg-primary hover:bg-zinc-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Verify & Log In</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Alternatives */}
        <div className="mt-6 pt-4 border-t border-surface-border/60 text-center text-xs text-charcoal-light space-y-2">
          <div>
            Prefer password?{' '}
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/login?redirect=${currentRedirect}`);
              }}
              className="font-bold text-secondary hover:underline cursor-pointer"
            >
              Log in with Password / Google
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] text-charcoal-light/70 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-Bit Encrypted Mobile Verification</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpLoginModal;
