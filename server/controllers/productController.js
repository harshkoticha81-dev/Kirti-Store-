const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const Category = require('../models/Category');
const InventoryTransaction = require('../models/InventoryTransaction');
const pushNotificationService = require('../services/pushNotificationService');
const { isBigAppliance } = require('../utils/shippingCalculator');

// Helper to safely process and persist images (resolves base64 data URIs to files in MongoDB & uploads folder, filters empty strings)
const processProductImages = async (imagesArray) => {
  if (!imagesArray) {
    return ['https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80'];
  }

  const list = Array.isArray(imagesArray) ? imagesArray : [imagesArray];
  const processed = [];
  const uploadDir = path.join(__dirname, '../public/uploads');

  for (let img of list) {
    if (!img || typeof img !== 'string' || !img.trim()) continue;
    img = img.trim();

    // If it's a base64 image string, extract and save to MongoDB Atlas & disk
    if (img.startsWith('data:image/')) {
      try {
        const matches = img.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1].toLowerCase().replace('jpeg', 'jpg');
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const filename = `kirti-appliance-${uniqueSuffix}.${ext}`;

          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          fs.writeFileSync(path.join(uploadDir, filename), buffer);

          // Persist to MongoDB Atlas UploadedFile collection
          try {
            const UploadedFile = require('../models/UploadedFile');
            await UploadedFile.findOneAndUpdate(
              { filename },
              {
                filename,
                contentType: `image/${ext}`,
                data: buffer,
                size: buffer.length
              },
              { upsert: true, new: true }
            );
          } catch (dbErr) {
            console.error('[Product DB Persist Warning]:', dbErr.message);
          }

          processed.push(`/uploads/${filename}`);
          continue;
        }
      } catch (err) {
        console.error('Failed to parse base64 image in productController:', err.message);
      }
    }

    processed.push(img);
  }

  return processed.length > 0
    ? processed
    : ['https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80'];
};

// Helper to generate a URL slug
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

// @desc    Get all products with filtering, search, sorting & pagination
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      inStock,
      sort,
      isFeatured,
      page = 1,
      limit = 12,
      includeInactive = false
    } = req.query;

    const query = {};

    // Only active products unless admin specifies otherwise
    if (!includeInactive || req.user?.role !== 'admin') {
      query.status = 'active';
    }

    // Search filter
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { shortDescription: searchRegex },
        { categoryName: searchRegex },
        { SKU: searchRegex }
      ];
    }

    // Category filter
    if (category && category !== 'all') {
      // Check if valid ObjectId, otherwise query by categoryName or category slug
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        const catDoc = await Category.findOne({
          $or: [{ slug: category.toLowerCase() }, { name: new RegExp(`^${category}$`, 'i') }]
        });
        if (catDoc) {
          query.category = catDoc._id;
        } else {
          query.categoryName = new RegExp(`^${category}$`, 'i');
        }
      }
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.sellingPrice = {};
      if (minPrice !== undefined && minPrice !== '') {
        query.sellingPrice.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && maxPrice !== '') {
        query.sellingPrice.$lte = Number(maxPrice);
      }
    }

    // Availability / inStock filter
    if (inStock === 'true' || inStock === true) {
      query.stockQuantity = { $gt: 0 };
    }

    // Featured filter
    if (isFeatured === 'true' || isFeatured === true) {
      query.isFeatured = true;
    }

    // Spare parts specific filters
    if (req.query.isSparePart !== undefined && req.query.isSparePart !== '') {
      query.isSparePart = req.query.isSparePart === 'true' || req.query.isSparePart === true;
    } else if (req.query.excludeSpares === 'true' || req.query.excludeSpares === true) {
      query.isSparePart = { $ne: true };
    }

    if (req.query.model && req.query.model.trim() !== '' && req.query.model !== 'all') {
      const modelRegex = new RegExp(req.query.model.trim(), 'i');
      query.compatibleModels = { $regex: modelRegex };
    }

    if (req.query.partCategory && req.query.partCategory !== 'all') {
      query.sparePartCategory = req.query.partCategory.toLowerCase();
    }

    if (req.query.applianceType && req.query.applianceType !== 'all') {
      query.applianceType = new RegExp(`^${req.query.applianceType.trim()}$`, 'i');
    }

    // Sorting
    let sortOption = { createdAt: -1 }; // default newest
    if (sort === 'price-asc') {
      sortOption = { sellingPrice: 1 };
    } else if (sort === 'price-desc') {
      sortOption = { sellingPrice: -1 };
    } else if (sort === 'rating') {
      sortOption = { rating: -1, numReviews: -1 };
    } else if (sort === 'popularity') {
      sortOption = { numReviews: -1, rating: -1 };
    } else if (sort === 'name-asc') {
      sortOption = { name: 1 };
    } else if (sort === 'name-desc') {
      sortOption = { name: -1 };
    }

    // Pagination calculations
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ status: 'active', isFeatured: true })
      .populate('category', 'name slug')
      .limit(8)
      .sort({ rating: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID or Slug
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let product;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id).populate('category', 'name slug');
    } else {
      product = await Product.findOne({ slug: id }).populate('category', 'name slug');
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Sanitize images array
    if (Array.isArray(product.images)) {
      product.images = product.images.filter(img => typeof img === 'string' && img.trim().length > 0);
      if (product.images.length === 0) {
        product.images = ['https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80'];
      }
    }

    // Fetch related products from same category
    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      status: 'active'
    })
      .limit(4)
      .select('name slug sellingPrice originalPrice images rating numReviews stockQuantity');

    res.status(200).json({
      success: true,
      product,
      relatedProducts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product (Admin)
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
  try {
    const {
      name,
      SKU,
      category,
      shortDescription,
      description,
      sellingPrice,
      originalPrice,
      stockQuantity = 0,
      lowStockThreshold = 5,
      images = [],
      specifications = [],
      warranty,
      isFeatured = false,
      status = 'active',
      brand = 'Kirti',
      packageSize,
      transportationCharge
    } = req.body;

    if (!name || !SKU || !category || !description || sellingPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, SKU, category, description, and sellingPrice are required.'
      });
    }

    // Check SKU uniqueness
    const skuExists = await Product.findOne({ SKU: SKU.toUpperCase().trim() });
    if (skuExists) {
      return res.status(400).json({
        success: false,
        message: `Product with SKU ${SKU.toUpperCase()} already exists.`
      });
    }

    // Resolve Category (by ObjectId, by name/slug, or auto-create)
    let categoryDoc = null;
    const catStr = category ? category.toString().trim() : '';
    if (catStr.match(/^[0-9a-fA-F]{24}$/)) {
      categoryDoc = await Category.findById(catStr);
    }
    if (!categoryDoc && catStr) {
      categoryDoc = await Category.findOne({
        $or: [
          { name: new RegExp(`^${catStr}$`, 'i') },
          { slug: slugify(catStr) }
        ]
      });
    }
    if (!categoryDoc && catStr) {
      categoryDoc = await Category.create({
        name: catStr,
        slug: slugify(catStr),
        description: `Appliances under ${catStr}`
      });
    }
    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: 'A valid category is required.'
      });
    }

    // Generate Slug
    let baseSlug = slugify(name);
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await Product.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Resolve appliance package size & transportation charge
    const resolvedPackageSize = packageSize || (isBigAppliance({ name, categoryName: categoryDoc.name, sellingPrice }) ? 'big' : 'small');
    const resolvedTransCharge = transportationCharge !== undefined ? Number(transportationCharge) : (resolvedPackageSize === 'big' ? 120 : 60);

    const cleanImages = await processProductImages(images);

    const product = await Product.create({
      name: name.trim(),
      slug: uniqueSlug,
      SKU: SKU.toUpperCase().trim(),
      category: categoryDoc._id,
      categoryName: categoryDoc.name,
      brand,
      shortDescription: shortDescription || '',
      description,
      sellingPrice: Number(sellingPrice),
      originalPrice: originalPrice ? Number(originalPrice) : null,
      stockQuantity: Math.max(0, Number(stockQuantity)),
      lowStockThreshold: Math.max(0, Number(lowStockThreshold)),
      images: cleanImages,
      specifications: Array.isArray(specifications) ? specifications : [],
      warranty: warranty || '2 Years Manufacturer Warranty',
      isFeatured: Boolean(isFeatured),
      status,
      packageSize: resolvedPackageSize,
      transportationCharge: resolvedTransCharge,
      isSparePart: Boolean(req.body.isSparePart),
      sparePartCategory: req.body.sparePartCategory || 'other',
      compatibleModels: Array.isArray(req.body.compatibleModels)
        ? req.body.compatibleModels
        : (req.body.compatibleModels ? req.body.compatibleModels.split(',').map(s => s.trim()).filter(Boolean) : []),
      applianceType: req.body.applianceType || '',
      partNumber: req.body.partNumber || ''
    });

    // Update category image if it is missing or has a duplicate placeholder
    if (product.images && product.images.length > 0 && product.images[0]) {
      if (!categoryDoc.image || categoryDoc.image.includes('photo-1570222094114-d054a817e56b') || categoryDoc.image.includes('photo-1583743814966-8936f5b7be1a')) {
        categoryDoc.image = product.images[0];
        await categoryDoc.save();
      }
    }

    // Log initial inventory transaction
    if (product.stockQuantity > 0) {
      await InventoryTransaction.create({
        product: product._id,
        productName: product.name,
        sku: product.SKU,
        transactionType: 'initial_stock',
        quantityChange: product.stockQuantity,
        previousQuantity: 0,
        newQuantity: product.stockQuantity,
        reason: 'Initial stock entry on product creation',
        administrator: req.user?._id || null,
        administratorName: req.user?.name || 'Admin'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully!',
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product details (Admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const {
      name,
      SKU,
      category,
      shortDescription,
      description,
      sellingPrice,
      originalPrice,
      lowStockThreshold,
      images,
      specifications,
      warranty,
      isFeatured,
      status,
      brand,
      packageSize,
      transportationCharge
    } = req.body;

    if (SKU && SKU.toUpperCase().trim() !== product.SKU) {
      const skuCheck = await Product.findOne({ SKU: SKU.toUpperCase().trim(), _id: { $ne: id } });
      if (skuCheck) {
        return res.status(400).json({
          success: false,
          message: `SKU ${SKU} is already used by another product.`
        });
      }
      product.SKU = SKU.toUpperCase().trim();
    }

    if (category) {
      let categoryDoc = null;
      const catStr = category.toString().trim();
      if (catStr.match(/^[0-9a-fA-F]{24}$/)) {
        categoryDoc = await Category.findById(catStr);
      }
      if (!categoryDoc && catStr) {
        categoryDoc = await Category.findOne({
          $or: [
            { name: new RegExp(`^${catStr}$`, 'i') },
            { slug: slugify(catStr) }
          ]
        });
      }
      if (!categoryDoc && catStr) {
        categoryDoc = await Category.create({
          name: catStr,
          slug: slugify(catStr),
          description: `Appliances under ${catStr}`
        });
      }
      if (categoryDoc) {
        product.category = categoryDoc._id;
        product.categoryName = categoryDoc.name;
      }
    }

    if (name) {
      product.name = name.trim();
      // Keep slug if name changed only if needed or keep existing stable slug
    }
    if (shortDescription !== undefined) product.shortDescription = shortDescription;
    if (description) product.description = description;
    if (sellingPrice !== undefined) product.sellingPrice = Math.max(0, Number(sellingPrice));
    if (originalPrice !== undefined) product.originalPrice = originalPrice ? Math.max(0, Number(originalPrice)) : null;
    if (lowStockThreshold !== undefined) product.lowStockThreshold = Math.max(0, Number(lowStockThreshold));
    if (images !== undefined) product.images = await processProductImages(images);
    if (specifications && Array.isArray(specifications)) product.specifications = specifications;
    if (warranty !== undefined) product.warranty = warranty;
    if (isFeatured !== undefined) product.isFeatured = Boolean(isFeatured);
    if (status !== undefined) product.status = status;
    if (brand !== undefined) product.brand = brand;
    if (packageSize !== undefined) product.packageSize = packageSize;
    if (transportationCharge !== undefined) product.transportationCharge = Number(transportationCharge);
    if (req.body.isSparePart !== undefined) product.isSparePart = Boolean(req.body.isSparePart);
    if (req.body.sparePartCategory !== undefined) product.sparePartCategory = req.body.sparePartCategory;
    if (req.body.compatibleModels !== undefined) {
      product.compatibleModels = Array.isArray(req.body.compatibleModels)
        ? req.body.compatibleModels
        : req.body.compatibleModels.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (req.body.applianceType !== undefined) product.applianceType = req.body.applianceType;
    if (req.body.partNumber !== undefined) product.partNumber = req.body.partNumber;

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Dedicated Price Update (Admin)
// @route   PATCH /api/products/:id/price
// @access  Private/Admin
exports.updateProductPrice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sellingPrice, originalPrice } = req.body;

    if (sellingPrice === undefined || isNaN(sellingPrice) || Number(sellingPrice) < 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid non-negative sellingPrice is required.'
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    product.sellingPrice = Number(sellingPrice);
    if (originalPrice !== undefined) {
      product.originalPrice = originalPrice !== null && originalPrice !== '' ? Math.max(0, Number(originalPrice)) : null;
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: `Price for "${product.name}" updated successfully to ₹${product.sellingPrice}.`,
      product: {
        id: product._id,
        name: product.name,
        SKU: product.SKU,
        sellingPrice: product.sellingPrice,
        originalPrice: product.originalPrice
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Dedicated Stock Update with Audit Transaction Logging (Admin)
// @route   PATCH /api/products/:id/stock
// @access  Private/Admin
exports.updateProductStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adjustmentType = 'set', quantity, reason, lowStockThreshold } = req.body;

    if (quantity === undefined || isNaN(quantity)) {
      return res.status(400).json({
        success: false,
        message: 'A valid quantity number is required.'
      });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'A reason must be provided for manual stock adjustments.'
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    const previousQuantity = product.stockQuantity;
    let newQuantity = previousQuantity;
    let change = 0;

    const qty = Number(quantity);

    if (adjustmentType === 'set') {
      if (qty < 0) {
        return res.status(400).json({ success: false, message: 'Stock cannot be negative.' });
      }
      newQuantity = qty;
      change = newQuantity - previousQuantity;
    } else if (adjustmentType === 'increase') {
      if (qty <= 0) {
        return res.status(400).json({ success: false, message: 'Increase amount must be greater than 0.' });
      }
      change = qty;
      newQuantity = previousQuantity + qty;
    } else if (adjustmentType === 'decrease') {
      if (qty <= 0) {
        return res.status(400).json({ success: false, message: 'Decrease amount must be greater than 0.' });
      }
      if (previousQuantity - qty < 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot decrease by ${qty}. Current stock is only ${previousQuantity}.`
        });
      }
      change = -qty;
      newQuantity = previousQuantity - qty;
    } else {
      return res.status(400).json({
        success: false,
        message: 'adjustmentType must be "set", "increase", or "decrease".'
      });
    }

    product.stockQuantity = newQuantity;
    if (lowStockThreshold !== undefined && !isNaN(lowStockThreshold)) {
      product.lowStockThreshold = Math.max(0, Number(lowStockThreshold));
    }
    await product.save();

    // Create Audit Transaction
    const transaction = await InventoryTransaction.create({
      product: product._id,
      productName: product.name,
      sku: product.SKU,
      transactionType: 'manual_adjustment',
      quantityChange: change,
      previousQuantity,
      newQuantity,
      reason: reason.trim(),
      administrator: req.user?._id || null,
      administratorName: req.user?.name || 'Administrator'
    });

    // Trigger Wishlist Restock Push Notifications if product was previously out of stock
    if (previousQuantity === 0 && newQuantity > 0) {
      pushNotificationService.sendRestockAlert(product).catch(err => {
        console.warn('[PushNotification] Restock alert error:', err.message);
      });
    }

    res.status(200).json({
      success: true,
      message: `Stock for "${product.name}" updated from ${previousQuantity} to ${newQuantity}.`,
      product: {
        id: product._id,
        name: product.name,
        SKU: product.SKU,
        stockQuantity: product.stockQuantity,
        stockStatus: product.stockStatus,
        lowStockThreshold: product.lowStockThreshold
      },
      transaction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product (Admin)
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    // Soft delete or delete document
    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: `Product "${product.name}" has been permanently deleted.`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get distinct appliance models & categories for spare parts portal
// @route   GET /api/products/spares/models
// @access  Public
exports.getSpareModels = async (req, res, next) => {
  try {
    // 1. Get models from appliances currently in DB
    const appliances = await Product.find({ isSparePart: { $ne: true }, status: 'active' })
      .select('name SKU categoryName brand')
      .lean();

    // 2. Get compatibleModels explicitly listed on spare parts
    const spareParts = await Product.find({ isSparePart: true, status: 'active' })
      .select('compatibleModels applianceType sparePartCategory')
      .lean();

    const modelSet = new Set();
    const applianceTypeSet = new Set(['Mixers & Grinders', 'Blenders', 'Food Processors', 'Juicers', 'Electric Kettles', 'Soda Makers', 'Toasters & Sandwich Makers', 'Chopper', 'Iron']);

    appliances.forEach(app => {
      if (app.name) modelSet.add(app.name.trim());
      if (app.categoryName) applianceTypeSet.add(app.categoryName.trim());
    });

    spareParts.forEach(part => {
      if (part.applianceType) applianceTypeSet.add(part.applianceType.trim());
      if (Array.isArray(part.compatibleModels)) {
        part.compatibleModels.forEach(m => {
          if (m && m.trim()) modelSet.add(m.trim());
        });
      }
    });

    const partCategories = [
      { id: 'all', name: 'All Spare Parts' },
      { id: 'jars', name: 'Jars & Pitchers', description: 'Stainless steel wet/dry/chutney jars & carafes' },
      { id: 'blades', name: 'Blades & Cutters', description: 'Multi-cut SS blades, chopping discs & augers' },
      { id: 'lids', name: 'Lids & Domes', description: 'Break-resistant dome lids & measuring caps' },
      { id: 'gaskets', name: 'Rubber Rings & Gaskets', description: 'Food-grade silicone leakproof rings' },
      { id: 'couplers', name: 'Couplers & Drive Gears', description: 'Motor & jar base teeth couplers with brass inserts' },
      { id: 'filters', name: 'Filters & Strainers', description: 'Micro-mesh juice filters & tea infusers' },
      { id: 'bowls', name: 'Bowls & Jars', description: 'Food processor processing bowls & kneader bowls' },
      { id: 'attachments', name: 'Attachments & Tools', description: 'Atta kneaders, spatulas & pushers' },
      { id: 'other', name: 'Other Accessories', description: 'Power cords, knobs & replacement hardware' }
    ];

    res.status(200).json({
      success: true,
      models: Array.from(modelSet).sort(),
      appliances: appliances.map(a => ({ id: a._id, name: a.name, SKU: a.SKU, category: a.categoryName })),
      applianceTypes: Array.from(applianceTypeSet).sort(),
      partCategories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get compatible spare parts for a specific product
// @route   GET /api/products/:id/compatible-spares
// @access  Public
exports.getCompatibleSpares = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    // Match spare parts by model name, SKU, or category/applianceType
    const spares = await Product.find({
      isSparePart: true,
      status: 'active',
      $or: [
        { compatibleModels: { $regex: new RegExp(product.name, 'i') } },
        { compatibleModels: { $regex: new RegExp(product.SKU, 'i') } },
        { applianceType: new RegExp(product.categoryName, 'i') }
      ]
    }).limit(8);

    res.status(200).json({
      success: true,
      count: spares.length,
      productName: product.name,
      spares
    });
  } catch (error) {
    next(error);
  }
};
