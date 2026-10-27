require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');

const seedSpares = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kirti-store';
    await mongoose.connect(mongoUri);
    console.log('[Connected to MongoDB for Spares Seeding]');

    // Find categories
    const categories = await Category.find({});
    const categoryMap = {};
    categories.forEach(c => {
      categoryMap[c.slug] = c;
      categoryMap[c.name.toLowerCase()] = c;
    });

    const getCat = (slug, fallbackName) => {
      if (categoryMap[slug]) return categoryMap[slug];
      if (categoryMap[fallbackName.toLowerCase()]) return categoryMap[fallbackName.toLowerCase()];
      // Return first available category if not found
      return categories[0];
    };

    const sparesData = [
      {
        name: 'Genuine 0.4L Stainless Steel Chutney Jar with Blade & Lid',
        slug: 'genuine-04l-chutney-jar-assembly',
        SKU: 'KRT-SP-JAR-04',
        catSlug: 'mixers-grinders',
        catName: 'Mixers & Grinders',
        brand: 'Kirti Genuine Parts',
        shortDescription: 'Heavy-gauge SS 304 compact jar with razor-sharp chutney blade and airtight silicone lid.',
        description: 'Restore your mixer grinder to brand-new grinding performance. Built from heavy-gauge food-grade SS 304 with razor-sharp micro-serrated blade and airtight anti-leak lid. Designed specifically for fine dry spices, fresh coconut chutneys, and ginger-garlic paste.',
        sellingPrice: 499,
        originalPrice: 799,
        stockQuantity: 25,
        lowStockThreshold: 5,
        isSparePart: true,
        sparePartCategory: 'jars',
        applianceType: 'Mixers & Grinders',
        compatibleModels: ['Sujata MG-03', 'Kirti ProMix 750W', 'Kirti Silenta 1000W', 'Universal 750W/1000W'],
        partNumber: 'KRT-SP-J04',
        packageSize: 'small',
        transportationCharge: 60,
        warranty: '6 Months Genuine Part Warranty',
        images: ['https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80'],
        specifications: [
          { key: 'Material', value: 'Food-Grade Stainless Steel 304' },
          { key: 'Capacity', value: '0.4 Litres (400 ml)' },
          { key: 'Blade Assembly', value: 'Fixed Multi-Cut SS Blade with Brass Bush' },
          { key: 'Lid Type', value: 'Airtight Polycarbonate with Silicone Gasket' }
        ],
        rating: 4.9,
        numReviews: 18,
        status: 'active'
      },
      {
        name: '1.5L Wet Grinding Master Jar with Flow Breakers',
        slug: '15l-wet-grinding-master-jar',
        SKU: 'KRT-SP-JAR-15',
        catSlug: 'mixers-grinders',
        catName: 'Mixers & Grinders',
        brand: 'Kirti Genuine Parts',
        shortDescription: 'Heavy-duty 1.5L liquidizing jar with built-in flow breakers for silky dosa batter and purees.',
        description: 'Engineered for tough daily grinding. Deep-embossed flow breaker walls force ingredients directly into the vortex for 30% faster, silkier batter without motor strain. Features heavy-duty ergonomic handle and durable brass drive coupling.',
        sellingPrice: 899,
        originalPrice: 1299,
        stockQuantity: 18,
        lowStockThreshold: 4,
        isSparePart: true,
        sparePartCategory: 'jars',
        applianceType: 'Mixers & Grinders',
        compatibleModels: ['Sujata MG-03', 'Kirti ProMix 750W', 'Kirti Silenta 1000W'],
        partNumber: 'KRT-SP-J15',
        packageSize: 'small',
        transportationCharge: 60,
        warranty: '6 Months Genuine Part Warranty',
        images: ['https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=600&q=80'],
        specifications: [
          { key: 'Capacity', value: '1.5 Litres' },
          { key: 'Internal Wall', value: 'Quad Flow-Breaker Technology' },
          { key: 'Handle', value: 'Reinforced Heat-Resistant Ergonomic Grip' },
          { key: 'Locking Base', value: 'Precision Self-Centering Twist Lock' }
        ],
        rating: 4.8,
        numReviews: 14,
        status: 'active'
      },
      {
        name: 'Food-Grade Silicone Leakproof Rubber Gaskets (Pack of 3)',
        slug: 'silicone-leakproof-gaskets-pack-of-3',
        SKU: 'KRT-SP-GSK-03',
        catSlug: 'mixers-grinders',
        catName: 'Mixers & Grinders',
        brand: 'Kirti Genuine Parts',
        shortDescription: 'Heavy-gauge food-safe silicone rubber sealing rings for leak-free high-speed grinding.',
        description: 'Eliminate messy liquid leaks permanently. Made from 100% FDA-compliant food-grade pure silicone that resists hardening, heat degradation, and spice stains. Fits chutney, dry, and wet grinding jar lids across all Kirti and Sujata models.',
        sellingPrice: 199,
        originalPrice: 349,
        stockQuantity: 50,
        lowStockThreshold: 10,
        isSparePart: true,
        sparePartCategory: 'gaskets',
        applianceType: 'Mixers & Grinders',
        compatibleModels: ['Sujata MG-03', 'Kirti ProMix 750W', 'B132', 'Universal 750W/1000W'],
        partNumber: 'KRT-SP-GSK',
        packageSize: 'small',
        transportationCharge: 60,
        warranty: '100% Fitment Guarantee',
        images: ['https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=600&q=80'],
        specifications: [
          { key: 'Quantity', value: '3 Units (Small, Medium, Large)' },
          { key: 'Material', value: 'BPA-Free Food-Grade Silicone' },
          { key: 'Heat Resistance', value: 'Up to 220°C' },
          { key: 'Elasticity', value: 'High Tensile Stretch Memory' }
        ],
        rating: 5.0,
        numReviews: 32,
        status: 'active'
      },
      {
        name: 'Heavy-Duty Motor Drive Teeth Coupler (Pack of 2)',
        slug: 'heavy-duty-motor-drive-coupler-pack-of-2',
        SKU: 'KRT-SP-CPL-02',
        catSlug: 'mixers-grinders',
        catName: 'Mixers & Grinders',
        brand: 'Kirti Genuine Parts',
        shortDescription: 'Precision 6-tooth motor drive coupler with solid brass thread insert preventing teeth wear.',
        description: 'The coupler is designed as a safety fuse to protect your motor during accidental overload. Replace stripped teeth in under 60 seconds with this OEM brass-threaded 6-tooth drive gear. Includes step-by-step DIY installation card.',
        sellingPrice: 249,
        originalPrice: 399,
        stockQuantity: 40,
        lowStockThreshold: 8,
        isSparePart: true,
        sparePartCategory: 'couplers',
        applianceType: 'Mixers & Grinders',
        compatibleModels: ['Sujata MG-03', 'Kirti ProMix 750W', 'Kirti Silenta 1000W', 'Universal 750W/1000W'],
        partNumber: 'KRT-SP-CPL',
        packageSize: 'small',
        transportationCharge: 60,
        warranty: '100% Fitment Guarantee',
        images: ['https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=600&q=80'],
        specifications: [
          { key: 'Quantity', value: '2 Units with brass thread' },
          { key: 'Tooth Count', value: '6 Precision Drive Teeth' },
          { key: 'Core Insert', value: 'Solid Machined Brass' },
          { key: 'Rotation', value: 'Anti-Clockwise Reverse Thread' }
        ],
        rating: 4.9,
        numReviews: 27,
        status: 'active'
      },
      {
        name: 'High-Impact Break-Resistant Polycarbonate Dome Lid',
        slug: 'high-impact-polycarbonate-dome-lid',
        SKU: 'KRT-SP-LID-01',
        catSlug: 'mixers-grinders',
        catName: 'Mixers & Grinders',
        brand: 'Kirti Genuine Parts',
        shortDescription: 'Shatter-resistant transparent dome lid with soft-grip rubber gasket and top measuring plug.',
        description: 'Crystal-clear dome lid engineered from unbreakable polycarbonate. Watch your ingredients grind in real time without removing the lid. Features built-in locking ears and central opening with silicone stopper for adding water on the fly.',
        sellingPrice: 299,
        originalPrice: 449,
        stockQuantity: 30,
        lowStockThreshold: 5,
        isSparePart: true,
        sparePartCategory: 'lids',
        applianceType: 'Mixers & Grinders',
        compatibleModels: ['Sujata MG-03', 'Kirti ProMix 750W'],
        partNumber: 'KRT-SP-LID',
        packageSize: 'small',
        transportationCharge: 60,
        warranty: '6 Months Replacement Warranty',
        images: ['https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80'],
        specifications: [
          { key: 'Material', value: 'Optical Grade Polycarbonate' },
          { key: 'Lock System', value: 'Dual Wing Lock Tabs' },
          { key: 'Gasket Included', value: 'Yes (Pre-Fitted)' }
        ],
        rating: 4.8,
        numReviews: 11,
        status: 'active'
      },
      {
        name: 'Tritan 600ml Replacement Sport Bottle & Flip Sip Lid',
        slug: 'tritan-600ml-replacement-blender-bottle',
        SKU: 'KRT-SP-BL-BTL',
        catSlug: 'blenders',
        catName: 'Blenders',
        brand: 'Kirti Genuine Parts',
        shortDescription: 'BPA-free Tritan travel tumbler with carry loop and silicone leakproof drinking seal.',
        description: 'Blend and run! Direct replacement drinking bottle for your personal blender. Crafted from ultra-durable USA Eastman Tritan that resists drops, odors, and clouding. Perfect for protein shakes, smoothies, and detox juices on the go.',
        sellingPrice: 449,
        originalPrice: 699,
        stockQuantity: 22,
        lowStockThreshold: 5,
        isSparePart: true,
        sparePartCategory: 'jars',
        applianceType: 'Blenders',
        compatibleModels: ['B132', 'Kirti BlendMax'],
        partNumber: 'KRT-SP-BTL600',
        packageSize: 'small',
        transportationCharge: 60,
        warranty: '6 Months Genuine Part Warranty',
        images: ['https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80'],
        specifications: [
          { key: 'Capacity', value: '600 ml' },
          { key: 'Material', value: '100% BPA-Free Eastman Tritan' },
          { key: 'Cap Type', value: 'Flip-Top Sports Cap with Carry Strap' }
        ],
        rating: 4.9,
        numReviews: 16,
        status: 'active'
      },
      {
        name: '6-Leaf 304 Stainless Steel Vortex Blade Assembly',
        slug: '6-leaf-stainless-steel-blender-blade',
        SKU: 'KRT-SP-BL-BLD',
        catSlug: 'blenders',
        catName: 'Blenders',
        brand: 'Kirti Genuine Parts',
        shortDescription: 'Surgical stainless steel vortex blades engineered for ice crushing and fine fruit puréeing.',
        description: 'Features 6 high-precision multi-angle blades crafted from laser-sharpened 304 stainless steel. Crushes ice cubes, frozen fruits, nuts, and fibrous spinach leaves in seconds with zero residue at the bottom.',
        sellingPrice: 349,
        originalPrice: 499,
        stockQuantity: 28,
        lowStockThreshold: 6,
        isSparePart: true,
        sparePartCategory: 'blades',
        applianceType: 'Blenders',
        compatibleModels: ['B132', 'Kirti BlendMax'],
        partNumber: 'KRT-SP-BLD6',
        packageSize: 'small',
        transportationCharge: 60,
        warranty: '6 Months Genuine Part Warranty',
        images: ['https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=600&q=80'],
        specifications: [
          { key: 'Blade Count', value: '6-Leaf 3D Vortex System' },
          { key: 'Steel Grade', value: 'SUS 304 Surgical Steel' },
          { key: 'Seal Ring', value: 'Pre-Installed Food Silicone Gasket' }
        ],
        rating: 4.7,
        numReviews: 9,
        status: 'active'
      },
      {
        name: 'Precision Stainless Steel Reversible Slicing & Shredding Disc',
        slug: 'precision-reversible-slicing-shredding-disc',
        SKU: 'KRT-SP-FP-DSC',
        catSlug: 'food-processors',
        catName: 'Food Processors',
        brand: 'Kirti Genuine Parts',
        shortDescription: 'Reversible dual-sided disc for ultra-fine wafer slicing on one side and julienne grating on the other.',
        description: 'Slice cucumbers, onions, and potatoes paper-thin on one side, or flip over to shred cheese, carrots, and cabbage into crisp juliennes. High-carbon stainless steel retains surgical sharpness for years.',
        sellingPrice: 599,
        originalPrice: 899,
        stockQuantity: 15,
        lowStockThreshold: 4,
        isSparePart: true,
        sparePartCategory: 'blades',
        applianceType: 'Food Processors',
        compatibleModels: ['Foodo Processor', 'Chopper'],
        partNumber: 'KRT-SP-DSC-REV',
        packageSize: 'small',
        transportationCharge: 60,
        warranty: '1 Year Material Warranty',
        images: ['https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=600&q=80'],
        specifications: [
          { key: 'Blade Style', value: 'Reversible 2-in-1 Dual Function' },
          { key: 'Slice Thickness', value: '2mm Razor Slice / 4mm Medium Shred' },
          { key: 'Disc Diameter', value: 'Standard 175mm Center Shaft Fit' }
        ],
        rating: 4.9,
        numReviews: 21,
        status: 'active'
      },
      {
        name: '3.2L Shatterproof Processing Bowl with Interlocking Handle',
        slug: '32l-food-processor-bowl-assembly',
        SKU: 'KRT-SP-FP-BWL',
        catSlug: 'food-processors',
        catName: 'Food Processors',
        brand: 'Kirti Genuine Parts',
        shortDescription: 'High-clarity, BPA-free thick polycarbonate processing bowl with safety interlocking system.',
        description: 'Accidentally cracked your food processor bowl? This genuine replacement bowl features the exact magnetic safety interlocking pin required for motor start. Graduated measurement markings in ml and cups embossed on the side.',
        sellingPrice: 1199,
        originalPrice: 1699,
        stockQuantity: 12,
        lowStockThreshold: 3,
        isSparePart: true,
        sparePartCategory: 'bowls',
        applianceType: 'Food Processors',
        compatibleModels: ['Foodo Processor'],
        partNumber: 'KRT-SP-BWL32',
        packageSize: 'small',
        transportationCharge: 60,
        warranty: '6 Months Manufacturer Warranty',
        images: ['https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=600&q=80'],
        specifications: [
          { key: 'Bowl Volume', value: '3.2 Litres Total / 2.0L Liquid Work' },
          { key: 'Safety Feature', value: 'Dual Micro-Switch Interlock Tab' },
          { key: 'Material', value: 'Shock-Absorbing Polycarbonate' }
        ],
        rating: 5.0,
        numReviews: 8,
        status: 'active'
      },
      {
        name: 'Cold-Press Ultem Auger & Laser-Cut Fine Sieve Filter',
        slug: 'cold-press-auger-fine-sieve-filter',
        SKU: 'KRT-SP-JC-AUG',
        catSlug: 'juicers',
        catName: 'Juicers',
        brand: 'Kirti Genuine Parts',
        shortDescription: 'Ultra-durable GE Ultem squeezing screw with laser-perforated fine mesh filter for maximum extraction.',
        description: 'Designed for slow cold-press masticating juicers. Molded from 8x stronger GE Ultem material that withstands enormous crushing pressure without micro-cracking. Delivers 95% juice yield with dry pulp extraction.',
        sellingPrice: 899,
        originalPrice: 1399,
        stockQuantity: 14,
        lowStockThreshold: 3,
        isSparePart: true,
        sparePartCategory: 'filters',
        applianceType: 'Juicers',
        compatibleModels: ['Juicer'],
        partNumber: 'KRT-SP-AUG-JC',
        packageSize: 'small',
        transportationCharge: 60,
        warranty: '1 Year Warranty',
        images: ['https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=600&q=80'],
        specifications: [
          { key: 'Auger Material', value: 'GE Ultem Space-Grade Resin' },
          { key: 'Mesh Hole Size', value: '0.3mm Laser Micro-Perforations' },
          { key: 'Cleaning Tool', value: 'Rotary Brush Compatible' }
        ],
        rating: 4.8,
        numReviews: 12,
        status: 'active'
      },
      {
        name: 'Electric Kettle Spring-Assisted Safety Pop-Up Lid',
        slug: 'electric-kettle-spring-popup-lid',
        SKU: 'KRT-SP-KT-LID',
        catSlug: 'electric-kettles',
        catName: 'Electric Kettles',
        brand: 'Kirti Genuine Parts',
        shortDescription: 'Pop-up spring loaded safety lid with anti-calc spout filter mesh.',
        description: 'Single-button release lid replacement for borosilicate and stainless electric kettles. Includes fine anti-calc mesh filter inside the pour spout to stop limescale particles from entering your teacup.',
        sellingPrice: 299,
        originalPrice: 449,
        stockQuantity: 20,
        lowStockThreshold: 5,
        isSparePart: true,
        sparePartCategory: 'lids',
        applianceType: 'Electric Kettles',
        compatibleModels: ['Electric Kettle'],
        partNumber: 'KRT-SP-KT-01',
        packageSize: 'small',
        transportationCharge: 60,
        warranty: '6 Months Warranty',
        images: ['https://images.unsplash.com/photo-1594213114663-d94db9b17125?auto=format&fit=crop&w=600&q=80'],
        specifications: [
          { key: 'Hinge Type', value: 'Stainless Steel Coil Spring 85° Open' },
          { key: 'Spout Filter', value: 'Removable Fine Mesh Limescale Screen' },
          { key: 'Heat Resistance', value: 'Cool-Touch Polypropylene Exterior' }
        ],
        rating: 4.9,
        numReviews: 15,
        status: 'active'
      },
      {
        name: '1-Litre High-Pressure Carbonation Replacement Bottle',
        slug: '1-litre-carbonation-replacement-bottle',
        SKU: 'KRT-SP-SD-BTL',
        catSlug: 'soda-makers',
        catName: 'Soda Makers',
        brand: 'Kirti Genuine Parts',
        shortDescription: 'High-pressure certified PET carbonation bottle with hermetic seal keeping fizz for up to 2 weeks.',
        description: 'Certified to withstand 150 PSI gas pressure for home soda makers. Made from 100% BPA-free food-grade PET with an airtight hermetic valve cap that locks in bubbles and keeps drinks carbonated in your refrigerator for up to 14 days.',
        sellingPrice: 399,
        originalPrice: 599,
        stockQuantity: 30,
        lowStockThreshold: 6,
        isSparePart: true,
        sparePartCategory: 'jars',
        applianceType: 'Soda Makers',
        compatibleModels: ['Soda Maker'],
        partNumber: 'KRT-SP-SD10',
        packageSize: 'small',
        transportationCharge: 60,
        warranty: '1 Year Pressure Safety Warranty',
        images: ['https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80'],
        specifications: [
          { key: 'Capacity', value: '1.0 Litres (1000 ml)' },
          { key: 'Pressure Rating', value: 'Tested to 150 PSI / 10 Bar' },
          { key: 'Mouth Thread', value: 'Quick-Twist Carbonator Thread' }
        ],
        rating: 4.9,
        numReviews: 23,
        status: 'active'
      }
    ];

    let inserted = 0;
    for (const item of sparesData) {
      const cat = getCat(item.catSlug, item.catName);
      const existing = await Product.findOne({ SKU: item.SKU });
      if (existing) {
        // Update spare part fields
        existing.isSparePart = true;
        existing.sparePartCategory = item.sparePartCategory;
        existing.compatibleModels = item.compatibleModels;
        existing.applianceType = item.applianceType;
        existing.partNumber = item.partNumber;
        await existing.save();
        console.log(`Updated existing spare part: ${item.name}`);
      } else {
        await Product.create({
          name: item.name,
          slug: item.slug,
          SKU: item.SKU,
          category: cat._id,
          categoryName: cat.name,
          brand: item.brand,
          shortDescription: item.shortDescription,
          description: item.description,
          sellingPrice: item.sellingPrice,
          originalPrice: item.originalPrice,
          stockQuantity: item.stockQuantity,
          lowStockThreshold: item.lowStockThreshold,
          images: item.images,
          specifications: item.specifications,
          warranty: item.warranty,
          isFeatured: false,
          status: 'active',
          packageSize: item.packageSize,
          transportationCharge: item.transportationCharge,
          rating: item.rating,
          numReviews: item.numReviews,
          isSparePart: true,
          sparePartCategory: item.sparePartCategory,
          compatibleModels: item.compatibleModels,
          applianceType: item.applianceType,
          partNumber: item.partNumber
        });
        inserted++;
        console.log(`Created new spare part: ${item.name}`);
      }
    }

    console.log(`[Spare parts seeding complete: ${inserted} created.]`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed spare parts:', err);
    process.exit(1);
  }
};

seedSpares();
