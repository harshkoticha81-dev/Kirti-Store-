const User = require('../models/User');
const OtpToken = require('../models/OtpToken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client();

const normalizePhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.toString().trim().replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+91')) {
    return cleaned;
  }
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return '+' + cleaned;
  }
  if (cleaned.length === 10) {
    return '+91' + cleaned;
  }
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  return '+91' + cleaned;
};

// @desc    Register a new customer
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, acceptTerms } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user (role always forced to 'customer')
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      passwordHash,
      role: 'customer',
      accountStatus: 'active'
    });

    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to Kirti Store.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log in user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    // Check for user (include passwordHash)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (user.accountStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account is suspended. Please contact customer support.'
      });
    }

    // Match password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        accountStatus: user.accountStatus,
        addresses: user.addresses
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log out user
// @route   POST /api/auth/logout
// @access  Public
exports.logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile & address
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, addresses } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (addresses && Array.isArray(addresses)) user.addresses = addresses;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.'
      });
    }

    const user = await User.findById(req.user.id).select('+passwordHash');
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password entered is incorrect.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email ? email.toLowerCase() : '' });

    if (!user) {
      // Return success anyway to avoid user enumeration
      return res.status(200).json({
        success: true,
        message: 'If that email address exists in our system, a password reset link has been dispatched.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset token generated.',
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required.'
      });
    }

    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully! You can now log in.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate or register customer via Google OAuth ID token
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential token is required.'
      });
    }

    let payload;
    try {
      const verifyOptions = { idToken: credential };
      if (process.env.GOOGLE_CLIENT_ID) {
        verifyOptions.audience = process.env.GOOGLE_CLIENT_ID;
      }
      const ticket = await googleClient.verifyIdToken(verifyOptions);
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.error('[Google Token Verify Error]:', verifyErr.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid Google credential token. Verification failed.'
      });
    }

    if (!payload || !payload.email) {
      return res.status(400).json({
        success: false,
        message: 'Google profile did not contain a valid email address.'
      });
    }

    const { sub: googleId, email, name, picture } = payload;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      // Check if suspended
      if (user.accountStatus === 'suspended') {
        return res.status(403).json({
          success: false,
          message: 'Your account has been suspended. Please contact customer support.'
        });
      }

      // Link googleId or update avatar if not yet set
      let needsSave = false;
      if (!user.googleId) {
        user.googleId = googleId;
        needsSave = true;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
      }
    } else {
      // Create new customer account
      user = await User.create({
        name: name || 'Google Customer',
        email: normalizedEmail,
        googleId,
        avatar: picture || '',
        role: 'customer',
        accountStatus: 'active'
      });
    }

    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: `Welcome, ${user.name}!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        avatar: user.avatar || '',
        accountStatus: user.accountStatus
      }
    });
  } catch (error) {
    console.error('[Google Auth Error]:', error);
    next(error);
  }
};

// @desc    Send 6-digit OTP to customer mobile number
// @route   POST /api/auth/otp/send
// @access  Public
exports.sendPhoneOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid mobile number.'
      });
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!/^\+91[6-9]\d{9}$/.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit Indian mobile number.'
      });
    }

    // Rate limiting: check if an OTP was sent in the last 60 seconds
    const existingOtp = await OtpToken.findOne({
      phone: normalizedPhone,
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) }
    });

    if (existingOtp) {
      const secondsLeft = Math.ceil((existingOtp.createdAt.getTime() + 60 * 1000 - Date.now()) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${secondsLeft} seconds before requesting a new OTP.`
      });
    }

    // Generate 6-digit numeric OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(rawOtp).digest('hex');

    // Remove any previous OTPs for this phone
    await OtpToken.deleteMany({ phone: normalizedPhone });

    // Store new OTP with 5 minute expiry
    await OtpToken.create({
      phone: normalizedPhone,
      otpHash,
      attempts: 0,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    console.log(`[SMS OTP Service]: 📲 OTP generated for ${normalizedPhone}: ${rawOtp} (Valid for 5 mins)`);

    // 1. Send via Fast2SMS if configured on backend
    let smsSent = false;
    if (process.env.FAST2SMS_API_KEY) {
      try {
        const pureMobile = normalizedPhone.replace('+91', '');
        const response = await fetch(
          `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(process.env.FAST2SMS_API_KEY)}&variables_values=${rawOtp}&route=otp&numbers=${pureMobile}`
        );
        const f2sData = await response.json();
        if (f2sData?.return) {
          smsSent = true;
          console.log(`[Fast2SMS]: ✅ SMS successfully delivered to ${normalizedPhone}`);
        } else {
          console.warn('[Fast2SMS]: ⚠️ Gateway response:', f2sData?.message);
        }
      } catch (smsErr) {
        console.warn('[Fast2SMS]: ⚠️ Error:', smsErr.message);
      }
    }

    // 2. Return response (if no real SMS service dispatched, include demoOtp for instant testing)
    res.status(200).json({
      success: true,
      message: smsSent
        ? `OTP sent via SMS to ${normalizedPhone.slice(0, 5)}*****${normalizedPhone.slice(-2)}.`
        : `Verification code generated for ${normalizedPhone.slice(0, 5)}*****${normalizedPhone.slice(-2)}.`,
      smsDelivered: smsSent,
      ...(!smsSent && { demoOtp: rawOtp })
    });
  } catch (error) {
    console.error('[Send OTP Error]:', error);
    next(error);
  }
};

// @desc    Verify mobile OTP & authenticate/register customer
// @route   POST /api/auth/otp/verify
// @access  Public
exports.verifyPhoneOtp = async (req, res, next) => {
  try {
    const { phone, otp, idToken } = req.body;

    if (!phone && !idToken) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number or verification token is required.'
      });
    }

    let verifiedPhone = null;

    // Method A: Firebase ID Token Verification
    if (idToken) {
      try {
        let adminSdk = null;
        try {
          adminSdk = require('firebase-admin');
        } catch (_) {}

        if (adminSdk && adminSdk.apps && adminSdk.apps.length > 0) {
          const decodedToken = await adminSdk.auth().verifyIdToken(idToken);
          verifiedPhone = decodedToken.phone_number;
        } else {
          const base64Url = idToken.split('.')[1];
          if (base64Url) {
            const decoded = JSON.parse(Buffer.from(base64Url, 'base64').toString('utf8'));
            verifiedPhone = decoded.phone_number || normalizePhoneNumber(phone);
          }
        }
      } catch (fbErr) {
        console.warn('[Firebase Token Verify Warning]:', fbErr.message);
      }
    }

    // Method B: Server 6-Digit OTP Verification
    if (!verifiedPhone) {
      if (!phone || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Please provide both mobile number and 6-digit OTP.'
        });
      }

      const normalizedPhone = normalizePhoneNumber(phone);
      const otpRecord = await OtpToken.findOne({
        phone: normalizedPhone,
        expiresAt: { $gt: new Date() }
      });

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: 'OTP has expired or is invalid. Please request a new OTP.'
        });
      }

      // Brute-force protection: max 3 attempts
      if (otpRecord.attempts >= 3) {
        await OtpToken.deleteMany({ phone: normalizedPhone });
        return res.status(429).json({
          success: false,
          message: 'Too many incorrect attempts. Please request a fresh OTP.'
        });
      }

      const incomingHash = crypto.createHash('sha256').update(otp.toString().trim()).digest('hex');
      if (incomingHash !== otpRecord.otpHash) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        const remaining = 3 - otpRecord.attempts;
        return res.status(400).json({
          success: false,
          message: `Incorrect OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        });
      }

      // Valid OTP! Delete used record
      await OtpToken.deleteMany({ phone: normalizedPhone });
      verifiedPhone = normalizedPhone;
    }

    if (!verifiedPhone) {
      return res.status(400).json({
        success: false,
        message: 'Mobile verification failed.'
      });
    }

    // Locate or create user in MongoDB
    const phoneDigits = verifiedPhone.replace(/\D/g, '');
    let user = await User.findOne({
      $or: [
        { phone: verifiedPhone },
        { phone: phoneDigits },
        { phone: phoneDigits.slice(-10) }
      ]
    });

    if (!user) {
      const autoEmail = `customer_${phoneDigits.slice(-10)}@kirtistore.in`;
      user = await User.create({
        name: `Customer ${phoneDigits.slice(-4)}`,
        phone: verifiedPhone,
        email: autoEmail,
        role: 'customer',
        accountStatus: 'active'
      });
    } else {
      if (user.phone !== verifiedPhone) {
        user.phone = verifiedPhone;
        await user.save();
      }
    }

    if (user.accountStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account is suspended. Please contact customer support.'
      });
    }

    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar || '',
        accountStatus: user.accountStatus
      }
    });
  } catch (error) {
    console.error('[Verify OTP Error]:', error);
    next(error);
  }
};

