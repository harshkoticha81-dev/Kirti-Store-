const Category = require('../models/Category');
const Product = require('../models/Product');

// In-memory cache for ultra-fast category lookups
let cachedCategories = null;
let lastCacheTime = 0;
const CACHE_TTL = 120000; // 2 minutes

const invalidateCategoryCache = () => {
  cachedCategories = null;
  lastCacheTime = 0;
};

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

// @desc    Get all categories with active product count
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const now = Date.now();
    if (cachedCategories && (now - lastCacheTime < CACHE_TTL)) {
      res.setHeader('Cache-Control', 'public, max-age=60');
      return res.status(200).json({
        success: true,
        count: cachedCategories.length,
        categories: cachedCategories
      });
    }

    const categories = await Category.find({ status: 'active' }).sort({ name: 1 }).lean();

    // Fetch product counts grouped by category in ONE single query
    const productStats = await Product.aggregate([
      { $match: { status: 'active' } },
      { 
        $group: { 
          _id: '$category', 
          count: { $sum: 1 },
          latestImage: { $first: { $arrayElemAt: ['$images', 0] } }
        } 
      }
    ]);

    const statMap = {};
    for (const stat of productStats) {
      if (stat._id) {
        statMap[stat._id.toString()] = {
          count: stat.count,
          image: stat.latestImage
        };
      }
    }

    const categoriesWithCount = categories.map((cat) => {
      const stats = statMap[cat._id.toString()] || { count: 0, image: null };
      let image = cat.image;
      if (!image || image.includes('photo-1570222094114-d054a817e56b') || image.includes('photo-1583743814966-8936f5b7be1a')) {
        image = stats.image || cat.image || '';
      }

      return {
        ...cat,
        image: image || cat.image,
        productCount: stats.count
      };
    });

    cachedCategories = categoriesWithCount;
    lastCacheTime = now;

    res.setHeader('Cache-Control', 'public, max-age=60');
    res.status(200).json({
      success: true,
      count: categoriesWithCount.length,
      categories: categoriesWithCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new category (Admin)
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, image, status } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required.'
      });
    }

    const slug = slugify(name);
    const existing = await Category.findOne({ $or: [{ name: name.trim() }, { slug }] });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A category with this name or slug already exists.'
      });
    }

    const category = await Category.create({
      name: name.trim(),
      slug,
      description: description || '',
      image: image || '',
      status: status || 'active'
    });

    invalidateCategoryCache();

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category (Admin)
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, image, status } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.'
      });
    }

    if (name) {
      category.name = name.trim();
      category.slug = slugify(name);
    }
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (status !== undefined) category.status = status;

    await category.save();
    invalidateCategoryCache();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category (Admin)
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.'
      });
    }

    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category: ${productCount} products are currently assigned to it.`
      });
    }

    await Category.findByIdAndDelete(id);
    invalidateCategoryCache();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
