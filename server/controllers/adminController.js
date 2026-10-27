const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Category = require('../models/Category');
const InventoryTransaction = require('../models/InventoryTransaction');

// @desc    Get dashboard metrics & summary
// @route   GET /api/admin/dashboard/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ status: 'active' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalOrders = await Order.countDocuments();

    // Calculate revenue from non-cancelled orders
    const revenueResult = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Stock metrics
    const outOfStockProducts = await Product.countDocuments({ stockQuantity: 0 });
    const lowStockProductsCount = await Product.countDocuments({
      $expr: {
        $and: [
          { $gt: ['$stockQuantity', 0] },
          { $lte: ['$stockQuantity', '$lowStockThreshold'] }
        ]
      }
    });

    // RTO Risk: Count pending orders with high return risk needing address verification
    let highRtoRiskCount = 0;
    try {
      highRtoRiskCount = await Order.countDocuments({
        'rtoRisk.riskLevel': 'HIGH',
        'rtoRisk.addressVerified': { $ne: true },
        orderStatus: { $nin: ['Cancelled', 'Delivered'] }
      });
    } catch (_) {}

    // Recent orders with complete customer & order details
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(8);

    // Products that need attention (low or out of stock)
    const lowStockAlerts = await Product.find({
      $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] }
    })
      .limit(6)
      .select('name SKU stockQuantity lowStockThreshold sellingPrice images categoryName');

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        activeProducts,
        totalCustomers,
        totalOrders,
        totalRevenue,
        outOfStockProducts,
        lowStockProductsCount,
        highRtoRiskCount
      },
      recentOrders,
      lowStockAlerts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get chart data for sales, statuses & categories
// @route   GET /api/admin/dashboard/sales
// @access  Private/Admin
exports.getDashboardSalesChart = async (req, res, next) => {
  try {
    // Sales grouped by date / month
    const salesData = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalSales: { $sum: '$totalAmount' },
          ordersCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 14 }
    ]);

    // Order status breakdown
    const orderStatusBreakdown = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Category distribution
    const categoryDistribution = await Product.aggregate([
      {
        $group: {
          _id: '$categoryName',
          count: { $sum: 1 },
          totalStock: { $sum: '$stockQuantity' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      salesData: salesData.map(d => ({
        date: d._id,
        sales: d.totalSales,
        orders: d.ordersCount
      })),
      orderStatusBreakdown: orderStatusBreakdown.map(s => ({
        status: s._id,
        count: s.count
      })),
      categoryDistribution: categoryDistribution.map(c => ({
        name: c._id || 'General',
        count: c.count,
        totalStock: c.totalStock
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get top selling products
// @route   GET /api/admin/dashboard/top-products
// @access  Private/Admin
exports.getTopProducts = async (req, res, next) => {
  try {
    const topProducts = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          sku: { $first: '$items.SKU' },
          image: { $first: '$items.image' },
          totalUnitsSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.lineTotal' }
        }
      },
      { $sort: { totalUnitsSold: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      success: true,
      topProducts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get registered customers with order summary
// @route   GET /api/admin/customers
// @access  Private/Admin
exports.getCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 15 } = req.query;
    const query = { role: 'customer' };

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const total = await User.countDocuments(query);
    const customers = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Attach order summary to each customer
    const customersWithOrders = await Promise.all(
      customers.map(async (cust) => {
        const orderCount = await Order.countDocuments({ user: cust._id });
        const revenue = await Order.aggregate([
          { $match: { user: cust._id, orderStatus: { $ne: 'Cancelled' } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        return {
          ...cust.toObject(),
          orderCount,
          totalSpent: revenue.length > 0 ? revenue[0].total : 0
        };
      })
    );

    res.status(200).json({
      success: true,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      customers: customersWithOrders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer detail with full order history
// @route   GET /api/admin/customers/:id
// @access  Private/Admin
exports.getCustomerById = async (req, res, next) => {
  try {
    const customer = await User.findById(req.params.id).select('-passwordHash');
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const orders = await Order.find({ user: customer._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      customer,
      orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get inventory audit transactions
// @route   GET /api/admin/inventory/transactions
// @access  Private/Admin
exports.getInventoryTransactions = async (req, res, next) => {
  try {
    const { productId, type, page = 1, limit = 20 } = req.query;
    const query = {};

    if (productId) {
      query.product = productId;
    }
    if (type && type !== 'all') {
      query.transactionType = type;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const total = await InventoryTransaction.countDocuments(query);
    const transactions = await InventoryTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      transactions
    });
  } catch (error) {
    next(error);
  }
};
