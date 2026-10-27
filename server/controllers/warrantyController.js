const Warranty = require('../models/Warranty');
const Order = require('../models/Order');

// Helper to generate official Certificate Number
const generateCertificateNumber = () => {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `KS-WRN-${year}-${randomSuffix}`;
};

// @desc    Register Appliance Warranty & Generate Digital Certificate
// @route   POST /api/warranty/register
// @access  Public (Optional User Auth)
exports.registerWarranty = async (req, res, next) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      applianceModel,
      serialNumber,
      purchaseDate,
      purchaseChannel = 'Kirti Store Online',
      invoiceNumber = '',
      invoiceImage = '',
      orderId = ''
    } = req.body;

    if (!customerName || !customerEmail || !customerPhone || !applianceModel || !serialNumber) {
      return res.status(400).json({
        success: false,
        message: 'All fields (Name, Email, Phone, Appliance Model, Serial Number) are required.'
      });
    }

    const cleanSerial = serialNumber.trim().toUpperCase();

    // Check if serial number already registered
    const existing = await Warranty.findOne({ serialNumber: cleanSerial });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Serial number "${cleanSerial}" is already registered on ${new Date(existing.purchaseDate).toLocaleDateString('en-IN')} (Certificate: ${existing.certificateNumber}).`
      });
    }

    // Compute 24-month validity period
    const parsedPurchaseDate = purchaseDate ? new Date(purchaseDate) : new Date();
    const validUntil = new Date(parsedPurchaseDate);
    validUntil.setMonth(validUntil.getMonth() + 24);

    let linkedOrder = null;
    let orderNumber = '';

    if (orderId && orderId.trim()) {
      linkedOrder = await Order.findById(orderId).catch(() => null);
      if (linkedOrder) {
        orderNumber = linkedOrder._id.toString().substring(0, 8).toUpperCase();
      }
    }

    let certificateNumber = generateCertificateNumber();
    let collisionCheck = await Warranty.findOne({ certificateNumber });
    while (collisionCheck) {
      certificateNumber = generateCertificateNumber();
      collisionCheck = await Warranty.findOne({ certificateNumber });
    }

    const warranty = await Warranty.create({
      user: req.user?._id || null,
      order: linkedOrder?._id || null,
      orderNumber,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      customerPhone: customerPhone.trim(),
      applianceModel: applianceModel.trim(),
      serialNumber: cleanSerial,
      purchaseDate: parsedPurchaseDate,
      purchaseChannel,
      invoiceNumber: invoiceNumber.trim(),
      invoiceImage,
      warrantyPeriodMonths: 24,
      warrantyValidUntil: validUntil,
      certificateNumber,
      status: 'Active'
    });

    res.status(201).json({
      success: true,
      message: 'Appliance warranty registered successfully! Digital certificate generated.',
      warranty
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Warranty by Serial Number or Certificate Number (Public)
// @route   GET /api/warranty/verify/:query
// @access  Public
exports.verifyWarranty = async (req, res, next) => {
  try {
    const { query } = req.params;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Serial number or certificate number is required.' });
    }

    const cleanQuery = query.trim().toUpperCase();

    const warranty = await Warranty.findOne({
      $or: [
        { serialNumber: cleanQuery },
        { certificateNumber: cleanQuery }
      ]
    });

    if (!warranty) {
      return res.status(404).json({
        success: false,
        message: `No active warranty found for "${cleanQuery}". Please check the serial number and try again.`
      });
    }

    // Mask sensitive customer info for public verification
    const maskedName = warranty.customerName.replace(/^(.)(.*)(.)$/, (_, f, m, l) => `${f}${'*'.repeat(m.length)}${l}`);

    res.status(200).json({
      success: true,
      warranty: {
        certificateNumber: warranty.certificateNumber,
        serialNumber: warranty.serialNumber,
        applianceModel: warranty.applianceModel,
        customerNameMasked: maskedName,
        purchaseDate: warranty.purchaseDate,
        warrantyValidUntil: warranty.warrantyValidUntil,
        status: warranty.status,
        warrantyPeriodMonths: warranty.warrantyPeriodMonths,
        coverageDetails: warranty.coverageDetails,
        purchaseChannel: warranty.purchaseChannel
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user's warranties
// @route   GET /api/warranty/my-warranties
// @access  Private
exports.getMyWarranties = async (req, res, next) => {
  try {
    const warranties = await Warranty.find({
      $or: [
        { user: req.user._id },
        { customerEmail: req.user.email.toLowerCase() }
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: warranties.length,
      warranties
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single warranty certificate details
// @route   GET /api/warranty/:id
// @access  Public
exports.getWarrantyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const warranty = await Warranty.findById(id);

    if (!warranty) {
      return res.status(404).json({
        success: false,
        message: 'Warranty certificate not found.'
      });
    }

    res.status(200).json({
      success: true,
      warranty
    });
  } catch (error) {
    next(error);
  }
};
