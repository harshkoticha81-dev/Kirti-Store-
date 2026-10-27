require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const sync = async () => {
  try {
    const atlasUri = 'mongodb+srv://admin:KirtiAdmin2026@cluster0.c40jq86.mongodb.net/kirti-store?retryWrites=true&w=majority';
    await mongoose.connect(atlasUri);
    console.log('[Connected to Atlas]');

    const Category = mongoose.connection.collection('categories');
    const Product = mongoose.connection.collection('products');

    const cat = await Category.findOne({ slug: 'mixers-grinders' });
    if (!cat) {
      throw new Error('Mixers & Grinders category not found on Atlas');
    }

    const sujata = {
      name: 'SUJATA MG01',
      slug: 'sujata-mg01',
      SKU: 'SUJ-MG01',
      category: cat._id,
      categoryName: cat.name,
      brand: 'SUJATA',
      shortDescription: 'Heavy-duty 900W all-rounder mixer grinder with high-speed rotation and dual vibration absorbers.',
      description: 'Official Kirti Store premium kitchen appliance engineered for modern Indian kitchens. Powered by heavy-duty 900W copper motor with stainless steel jars and razor-sharp blades.',
      sellingPrice: 6500,
      originalPrice: 7700,
      stockQuantity: 25,
      lowStockThreshold: 5,
      images: [
        '/uploads/kirti-appliance-1793135640981-633037209.webp',
        'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80'
      ],
      specifications: [
        { key: 'Power', value: '900W Pure Copper' },
        { key: 'Speed', value: '22000 RPM' },
        { key: 'Jars', value: '3 Stainless Steel Jars' }
      ],
      warranty: '2 Years Manufacturer Warranty',
      isFeatured: true,
      status: 'active',
      packageSize: 'big',
      transportationCharge: 120,
      rating: 5,
      numReviews: 1,
      isSparePart: false,
      sparePartCategory: 'other',
      compatibleModels: [],
      applianceType: '',
      partNumber: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await Product.updateOne(
      { SKU: 'SUJ-MG01' },
      { $set: sujata },
      { upsert: true }
    );

    console.log('[Success] SUJATA MG01 synced to Atlas:', result);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Sync Error]:', err.message);
    process.exit(1);
  }
};

sync();
