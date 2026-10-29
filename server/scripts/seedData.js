require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const InventoryTransaction = require('../models/InventoryTransaction');
const Review = require('../models/Review');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');

const categoriesData = [
  {
    name: 'Mixers & Grinders',
    slug: 'mixers-grinders',
    description: 'High-power copper motor mixer grinders engineered for tough Indian kitchen spices and pastes.',
    image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=600&q=80',
    status: 'active'
  },
  {
    name: 'Blenders',
    slug: 'blenders',
    description: 'Ultra-fast smoothie blenders and portable immersion blenders for daily nutrition.',
    image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=600&q=80',
    status: 'active'
  },
  {
    name: 'Soda Makers',
    slug: 'soda-makers',
    description: 'Eco-friendly carbonators to make fresh sparkling water and sodas on-demand at home.',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
    status: 'active'
  },
  {
    name: 'Juicers',
    slug: 'juicers',
    description: 'Cold-press slow juicers and centrifugal extractors preserving maximum vitamins and enzymes.',
    image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=600&q=80',
    status: 'active'
  },
  {
    name: 'Toasters & Sandwich Makers',
    slug: 'toasters-sandwich-makers',
    description: 'Even-browning popup toasters and non-stick grillers for crispy breakfasts.',
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80',
    status: 'active'
  },
  {
    name: 'Electric Kettles',
    slug: 'electric-kettles',
    description: 'Borosilicate glass and food-grade stainless steel kettles with rapid boil technology.',
    image: 'https://images.unsplash.com/photo-1594213114663-d94db9b17125?auto=format&fit=crop&w=600&q=80',
    status: 'active'
  },
  {
    name: 'Food Processors',
    slug: 'food-processors',
    description: 'Versatile multi-blade processors for chopping, slicing, shredding, and dough kneading.',
    image: 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=600&q=80',
    status: 'active'
  },
  {
    name: 'Other Kitchen Appliances',
    slug: 'other-kitchen-appliances',
    description: 'Digital air fryers, induction cooktops, and smart culinary accessories.',
    image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80',
    status: 'active'
  }
];

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kirti-store';
    await mongoose.connect(mongoUri);
    console.log('[Connected to MongoDB for Seeding]');

    // Clear existing collections
    console.log('[Cleaning existing database collections...]');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      InventoryTransaction.deleteMany({}),
      Review.deleteMany({}),
      Cart.deleteMany({}),
      Wishlist.deleteMany({})
    ]);

    // 1. Create Users
    console.log('[Creating Administrator and Demo Customer users...]');
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@KirtiStore2026', salt);
    const customerPasswordHash = await bcrypt.hash('Customer@2026', salt);

    const adminUser = await User.create({
      name: process.env.ADMIN_NAME || 'Kirti Store Administrator',
      email: (process.env.ADMIN_EMAIL || 'admin@kirtistore.com').toLowerCase(),
      phone: process.env.ADMIN_PHONE || '+919876543210',
      passwordHash: adminPasswordHash,
      role: 'admin',
      accountStatus: 'active'
    });

    const demoCustomer = await User.create({
      name: 'Pooja Sharma',
      email: 'customer@kirtistore.com',
      phone: '+919812345678',
      passwordHash: customerPasswordHash,
      role: 'customer',
      accountStatus: 'active',
      addresses: [
        {
          street: 'Main Bazar, Opp. Nandkurba Hospital',
          apartment: 'Near Tower Chowk',
          city: 'Dhoraji',
          state: 'Gujarat',
          postalCode: '360410',
          country: 'India',
          phone: '+919812345678',
          isDefault: true,
          label: 'Home'
        }
      ]
    });

    // 2. Create Categories
    console.log('[Creating Product Categories...]');
    const createdCategories = await Category.insertMany(categoriesData);
    const categoryMap = {};
    createdCategories.forEach(cat => {
      categoryMap[cat.slug] = cat;
    });

    // 3. Create Demonstration Products
    console.log('[Creating Demonstration Appliances...]');
    const sampleProducts = [
      {
        name: 'Kirti ProMix 750W Heavy-Duty Mixer Grinder',
        slug: 'kirti-promix-750w-mixer-grinder',
        SKU: 'KRT-MX-750',
        category: categoryMap['mixers-grinders']._id,
        categoryName: categoryMap['mixers-grinders'].name,
        brand: 'Kirti',
        shortDescription: '750W 100% pure copper motor with 3 heavy gauge stainless steel jars and razor-sharp blades.',
        description: 'The Kirti ProMix 750W is built for high-performance everyday cooking. Engineered with dual-fan cooling technology to protect the copper motor during prolonged grinding of heavy batters and whole turmeric. Includes 1.5L wet grinding jar, 1.0L dry grinding jar, and 0.4L chutney jar with anti-spill lids.',
        sellingPrice: 3499,
        originalPrice: 4999,
        stockQuantity: 42,
        lowStockThreshold: 8,
        images: [
          'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=800&q=80'
        ],
        specifications: [
          { key: 'Motor Power', value: '750 Watts Pure Copper' },
          { key: 'No. of Jars', value: '3 Stainless Steel Jars' },
          { key: 'Speed Control', value: '3 Speeds + Pulse Incher' },
          { key: 'Overload Protection', value: 'Auto-cut Thermal Breaker' },
          { key: 'Voltage', value: '230V ~ 50Hz' }
        ],
        warranty: '2 Years Comprehensive + 5 Years Motor Warranty',
        isFeatured: true,
        status: 'active',
        rating: 4.8,
        numReviews: 24
      },
      {
        name: 'Kirti BlendMax Portable Smoothie Blender',
        slug: 'kirti-blendmax-portable-blender',
        SKU: 'KRT-BL-MAX',
        category: categoryMap['blenders']._id,
        categoryName: categoryMap['blenders'].name,
        brand: 'Kirti',
        shortDescription: 'USB-C rechargeable travel blender with 6-leaf 304 stainless steel vortex blades.',
        description: 'Blend smoothies, protein shakes, and baby purées anywhere with the Kirti BlendMax. Featuring a powerful 20,000 RPM motor and a high-capacity 4000mAh battery providing up to 18 blends on a single charge. BPA-free Tritan sport bottle with leakproof sip lid.',
        sellingPrice: 1899,
        originalPrice: 2499,
        stockQuantity: 28,
        lowStockThreshold: 5,
        images: [
          'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80'
        ],
        specifications: [
          { key: 'Capacity', value: '450 ml Tritan Bottle' },
          { key: 'Battery', value: '4000 mAh Dual Lithium' },
          { key: 'Blade Type', value: '6-Leaf 304 Food-grade Steel' },
          { key: 'Charging', value: 'Fast USB-C (2.5 hrs)' }
        ],
        warranty: '1 Year Replacement Warranty',
        isFeatured: true,
        status: 'active',
        rating: 4.7,
        numReviews: 18
      },
      {
        name: 'Kirti SparkFizz Home Soda & Sparkling Water Maker',
        slug: 'kirti-sparkfizz-home-soda-maker',
        SKU: 'KRT-SD-FIZZ',
        category: categoryMap['soda-makers']._id,
        categoryName: categoryMap['soda-makers'].name,
        brand: 'Kirti',
        shortDescription: 'Zero electricity carbonator transforming plain water into refreshing sparkling soda in 3 seconds.',
        description: 'Enjoy crisp sparkling water, handcrafted fruit sodas, and mocktails at the touch of a button. The Kirti SparkFizz requires no electricity or batteries. Precision pressure-release valve ensures consistent carbonation levels according to your preference.',
        sellingPrice: 4299,
        originalPrice: 5499,
        stockQuantity: 15,
        lowStockThreshold: 4,
        images: [
          'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80'
        ],
        specifications: [
          { key: 'Mechanism', value: 'Gas-injection (No Electricity Required)' },
          { key: 'Bottle Capacity', value: '1.0 Litre BPA-free PET' },
          { key: 'Carbonation Cylinder', value: '60L CO2 Standard Compatible' },
          { key: 'Material', value: 'Matte Brushed Aluminum Body' }
        ],
        warranty: '2 Years Manufacturer Warranty',
        isFeatured: true,
        status: 'active',
        rating: 4.9,
        numReviews: 31
      },
      {
        name: 'Kirti FreshPress Cold Press Masticating Juicer',
        slug: 'kirti-freshpress-cold-press-juicer',
        SKU: 'KRT-JC-COLD',
        category: categoryMap['juicers']._id,
        categoryName: categoryMap['juicers'].name,
        brand: 'Kirti',
        shortDescription: 'Low-speed 55 RPM cold press extraction with 92% maximum juice yield and zero heat buildup.',
        description: 'Squeeze the purest juice from leafy greens, wheatgrass, fibrous celery, hard carrots, and citrus fruits. The gentle masticating spiral auger preserves cellular enzymes, vitamins, and natural flavor without heat or oxidation. Whisper-quiet under 60dB.',
        sellingPrice: 5999,
        originalPrice: 7999,
        stockQuantity: 19,
        lowStockThreshold: 4,
        images: [
          'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=800&q=80'
        ],
        specifications: [
          { key: 'RPM', value: '55 RPM Low Speed' },
          { key: 'Feed Chute', value: '80mm Wide Mouth (Whole Apple)' },
          { key: 'Yield Efficiency', value: 'Up to 92% Juice Recovery' },
          { key: 'Sound Level', value: '< 60 dB Ultra Quiet' }
        ],
        warranty: '3 Years Motor Warranty + 1 Year Parts',
        isFeatured: true,
        status: 'active',
        rating: 4.8,
        numReviews: 15
      },
      {
        name: 'Kirti CrispToast 2-Slice Pop-Up Toaster',
        slug: 'kirti-crisptoast-2-slice-toaster',
        SKU: 'KRT-TS-CRISP',
        category: categoryMap['toasters-sandwich-makers']._id,
        categoryName: categoryMap['toasters-sandwich-makers'].name,
        brand: 'Kirti',
        shortDescription: '7-level browning control with extra-wide slots, reheat, defrost, and cancel functions.',
        description: 'Start your mornings with perfectly golden bread, bagels, and artisan brioches. Extra-wide 38mm slots accommodate thick slices, while self-centering guides guarantee uniform crispness on both sides. Removable slide-out crumb tray ensures effortless cleaning.',
        sellingPrice: 1299,
        originalPrice: 1799,
        stockQuantity: 50,
        lowStockThreshold: 10,
        images: [
          'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80'
        ],
        specifications: [
          { key: 'Power', value: '850 Watts' },
          { key: 'Browning Levels', value: '7 Variable Heat Settings' },
          { key: 'Slot Width', value: '38mm Extra Wide' },
          { key: 'Body Material', value: 'Cool-Touch Stainless Steel Trim' }
        ],
        warranty: '2 Years Manufacturer Warranty',
        isFeatured: false,
        status: 'active',
        rating: 4.6,
        numReviews: 12
      },
      {
        name: 'Kirti QuickBoil 1.8L Borosilicate Glass Electric Kettle',
        slug: 'kirti-quickboil-1-8l-electric-kettle',
        SKU: 'KRT-KT-BOIL',
        category: categoryMap['electric-kettles']._id,
        categoryName: categoryMap['electric-kettles'].name,
        brand: 'Kirti',
        shortDescription: '1500W rapid boil cordless kettle with blue LED halo light and auto shut-off protection.',
        description: 'Boil water for your morning tea or pour-over coffee in under 3 minutes. Crafted from high-heat thermal shock resistant borosilicate glass and 304 food-grade stainless steel base. Equipped with Strix thermostat controller and boil-dry auto cut-off.',
        sellingPrice: 1499,
        originalPrice: 2199,
        stockQuantity: 36,
        lowStockThreshold: 6,
        images: [
          'https://images.unsplash.com/photo-1594213114663-d94db9b17125?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80'
        ],
        specifications: [
          { key: 'Capacity', value: '1.8 Litres' },
          { key: 'Power', value: '1500 Watts Rapid Heating' },
          { key: 'Safety', value: 'British Strix Controller, Auto-Shutoff' },
          { key: 'Illumination', value: 'Ambient Blue LED Ring' }
        ],
        warranty: '2 Years Manufacturer Warranty',
        isFeatured: true,
        status: 'active',
        rating: 4.9,
        numReviews: 40
      },
      {
        name: 'Kirti MultiChef 1000W All-in-One Food Processor',
        slug: 'kirti-multichef-1000w-food-processor',
        SKU: 'KRT-FP-MULTI',
        category: categoryMap['food-processors']._id,
        categoryName: categoryMap['food-processors'].name,
        brand: 'Kirti',
        shortDescription: '12-in-1 kitchen powerhouse with kneader, slicer, citrus press, and blender attachment.',
        description: 'Master meal prep in seconds. The Kirti MultiChef slices vegetables wafer-thin, juliennes carrots, shreds cheese, kneads smooth roti dough in under 2 minutes, and blends silky soups. Includes 3.2L processing bowl and precision micro-serrated Japanese steel blades.',
        sellingPrice: 7899,
        originalPrice: 9999,
        stockQuantity: 14,
        lowStockThreshold: 3,
        images: [
          'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80'
        ],
        specifications: [
          { key: 'Motor', value: '1000 Watts Turbo Drive' },
          { key: 'Main Bowl', value: '3.2L BPA-Free Polycarbonate' },
          { key: 'Attachments', value: '9 Stainless Steel Discs & Blades' },
          { key: 'Speeds', value: 'Variable Dial + Pulse Mode' }
        ],
        warranty: '2 Years Product + 5 Years Motor Warranty',
        isFeatured: true,
        status: 'active',
        rating: 4.9,
        numReviews: 22
      },
      {
        name: 'Kirti GrillMate Jumbo Non-Stick Sandwich Maker',
        slug: 'kirti-grillmate-sandwich-maker',
        SKU: 'KRT-SW-GRILL',
        category: categoryMap['toasters-sandwich-makers']._id,
        categoryName: categoryMap['toasters-sandwich-makers'].name,
        brand: 'Kirti',
        shortDescription: '1000W dual-side ribbed grill plates with ceramic non-stick coating and 180° flat open hinge.',
        description: 'Make café-quality paninis, toasted clubhouse sandwiches, grilled paneer tikka, and skewered kebabs at home. The dual floating hinge opens flat 180 degrees to double as a tabletop electric barbecue grill.',
        sellingPrice: 1599,
        originalPrice: 2299,
        stockQuantity: 4, // Intentionally low stock for testing alerts!
        lowStockThreshold: 5,
        images: [
          'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80'
        ],
        specifications: [
          { key: 'Wattage', value: '1000 Watts Fast Heating' },
          { key: 'Coating', value: 'PFOA-Free Teflon Triple Coating' },
          { key: 'Hinge', value: '180° Open Flat Barbecue Hinge' },
          { key: 'Indicators', value: 'Red Power & Green Ready LEDs' }
        ],
        warranty: '1 Year Comprehensive Warranty',
        isFeatured: false,
        status: 'active',
        rating: 4.5,
        numReviews: 9
      },
      {
        name: 'Kirti AeroCrisp 6.5L Digital Air Fryer',
        slug: 'kirti-aerocrisp-6-5l-air-fryer',
        SKU: 'KRT-AF-CRISP',
        category: categoryMap['other-kitchen-appliances']._id,
        categoryName: categoryMap['other-kitchen-appliances'].name,
        brand: 'Kirti',
        shortDescription: '360° rapid hot air convection technology for guilt-free crispy snacks with 85% less oil.',
        description: 'Cook crispy french fries, samosas, roasted vegetables, and baked muffins with up to 85% less oil. Features 8 pre-programmed smart culinary presets, glass viewing window with internal oven light, and temperature control from 60°C to 200°C.',
        sellingPrice: 6499,
        originalPrice: 8999,
        stockQuantity: 22,
        lowStockThreshold: 5,
        images: [
          'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=800&q=80'
        ],
        specifications: [
          { key: 'Capacity', value: '6.5 Litres Family Size' },
          { key: 'Wattage', value: '1700 Watts' },
          { key: 'Controls', value: 'Digital Touch LED Panel' },
          { key: 'Basket', value: 'Dishwasher-Safe Non-Stick' }
        ],
        warranty: '2 Years Manufacturer Warranty',
        isFeatured: true,
        status: 'active',
        rating: 4.9,
        numReviews: 35
      },
      {
        name: 'Kirti SmartDough Electric Atta & Dough Kneader',
        slug: 'kirti-smartdough-electric-dough-maker',
        SKU: 'KRT-DK-SMART',
        category: categoryMap['other-kitchen-appliances']._id,
        categoryName: categoryMap['other-kitchen-appliances'].name,
        brand: 'Kirti',
        shortDescription: 'Automatic planetary kneader preparing soft chapati atta, pizza dough, and bread in 3 minutes.',
        description: 'Tired of tiring manual dough kneading? The Kirti SmartDough uses bidirectional planetary movement to knead smooth, pliable dough every single time. Easy measuring cups and oil dispensers included.',
        sellingPrice: 3199,
        originalPrice: 4299,
        stockQuantity: 0, // Intentionally 0 for testing Out-of-Stock badge & behavior!
        lowStockThreshold: 5,
        images: [
          'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80'
        ],
        specifications: [
          { key: 'Capacity', value: '2.5 Litres Stainless Bowl' },
          { key: 'Knead Time', value: '3 Minutes Auto-Timer' },
          { key: 'Motor', value: '350 Watts High Torque' }
        ],
        warranty: '2 Years Manufacturer Warranty',
        isFeatured: false,
        status: 'active',
        rating: 4.4,
        numReviews: 6
      },
      {
        name: 'Kirti TurboChop 400W Mini Electric Food Chopper',
        slug: 'kirti-turbochop-mini-food-chopper',
        SKU: 'KRT-CH-MINI',
        category: categoryMap['food-processors']._id,
        categoryName: categoryMap['food-processors'].name,
        brand: 'Kirti',
        shortDescription: 'One-touch bi-level quad stainless blades for tearless onion, garlic, and nut mincing.',
        description: 'Chop onions without tears, mince garlic, ginger, herbs, and chop nuts in under 10 seconds. Thick tempered glass bowl is stain-resistant and odour-free.',
        sellingPrice: 999,
        originalPrice: 1499,
        stockQuantity: 30,
        lowStockThreshold: 6,
        images: [
          'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=800&q=80'
        ],
        specifications: [
          { key: 'Power', value: '400 Watts Copper Motor' },
          { key: 'Bowl', value: '1.2 Litres Tempered Glass' },
          { key: 'Blades', value: '4 Stainless Steel Bi-Level' }
        ],
        warranty: '1 Year Warranty',
        isFeatured: false,
        status: 'active',
        rating: 4.7,
        numReviews: 14
      },
      {
        name: 'Kirti Silenta 1000W Ultra-Quiet Mixer Grinder',
        slug: 'kirti-silenta-1000w-mixer-grinder',
        SKU: 'KRT-MX-SILENT',
        category: categoryMap['mixers-grinders']._id,
        categoryName: categoryMap['mixers-grinders'].name,
        brand: 'Kirti',
        shortDescription: 'Acoustic sound-dampening hood technology cutting down noise by 60% with commercial 1000W torque.',
        description: 'Grind without waking the house! The Kirti Silenta incorporates an acoustic silence enclosure that dampens motor frequency while delivering massive 1000 Watts grinding torque. Comes with 4 flow-breaker jars including juice extractor.',
        sellingPrice: 4999,
        originalPrice: 6499,
        stockQuantity: 18,
        lowStockThreshold: 5,
        images: [
          'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=800&q=80'
        ],
        specifications: [
          { key: 'Noise Reduction', value: 'Double Acoustic Shell (-60% dB)' },
          { key: 'Power', value: '1000 Watts High Torque Commercial Class' },
          { key: 'Jars', value: '4 Heavy Duty Stainless Steel Jars' }
        ],
        warranty: '3 Years Product + 7 Years Motor Warranty',
        isFeatured: true,
        status: 'active',
        rating: 5.0,
        numReviews: 29
      }
    ];

    const shouldSeedProducts = process.env.SEED_DEFAULT_PRODUCTS === 'true';
    let createdProducts = [];

    if (shouldSeedProducts) {
      createdProducts = await Product.insertMany(sampleProducts);

      // 4. Create Initial Inventory Transactions
      console.log('[Logging initial stock transaction history...]');
      const transactions = createdProducts.map(prod => ({
        product: prod._id,
        productName: prod.name,
        sku: prod.SKU,
        transactionType: 'initial_stock',
        quantityChange: prod.stockQuantity,
        previousQuantity: 0,
        newQuantity: prod.stockQuantity,
        reason: 'Initial seed stock inventory load',
        administrator: adminUser._id,
        administratorName: adminUser.name
      }));
      await InventoryTransaction.insertMany(transactions);
    } else {
      console.log('[Default sample products excluded - catalog initialized empty for live custom products]');
    }

    // 5. Create Sample Orders for Dashboard Analytics
    if (shouldSeedProducts && createdProducts.length >= 6) {
      console.log('[Creating sample orders for live dashboard metrics...]');
      const p1 = createdProducts[0]; // Mixer
      const p2 = createdProducts[2]; // Soda maker
      const p3 = createdProducts[5]; // Electric kettle

      // 6. Create Verified Customer Reviews
      console.log('[Creating sample verified customer reviews...]');
      await Review.create({
        user: demoCustomer._id,
        userName: demoCustomer.name,
        product: p1._id,
        rating: 5,
        title: 'Flawless grinding power!',
        comment: 'This 750W mixer easily handled thick idli batter and whole garam masala without warming up. The build quality feels very premium and solid. Highly recommended!',
        verifiedPurchase: true
      });

      await Review.create({
        user: demoCustomer._id,
        userName: demoCustomer.name,
        product: p3._id,
        rating: 5,
        title: 'Boils water amazingly fast',
        comment: 'The blue LED glow looks great on our kitchen counter. The glass body makes it easy to check water levels and cleanliness.',
        verifiedPurchase: true
      });
    }

    console.log('====================================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log(`- Categories Seeded: ${createdCategories.length}`);
    console.log(`- Products Seeded:   ${createdProducts.length}`);
    console.log(`- Admin Account:     ${adminUser.email} / ${process.env.ADMIN_PASSWORD || 'Admin@KirtiStore2026'}`);
    console.log(`- Customer Account:  ${demoCustomer.email} / Customer@2026`);
    console.log('====================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`[Fatal Seeding Error]: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
