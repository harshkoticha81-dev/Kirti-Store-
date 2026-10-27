require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const fixImages = async () => {
  try {
    const atlasUri = 'mongodb+srv://admin:KirtiAdmin2026@cluster0.c40jq86.mongodb.net/kirti-store?retryWrites=true&w=majority';
    await mongoose.connect(atlasUri);
    console.log('[Connected to Atlas]');

    const Product = mongoose.connection.collection('products');

    const updates = [
      {
        query: { name: /Mr\.Butler Soda Maker/i },
        images: [
          'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80'
        ]
      },
      {
        query: { name: /MILTON/i },
        images: [
          'https://images.unsplash.com/photo-1594213114663-d94db9b17125?auto=format&fit=crop&w=800&q=80'
        ]
      },
      {
        query: { name: /BOSS BLENDER/i },
        images: [
          'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80'
        ]
      },
      {
        query: { name: /SUJATA/i },
        images: [
          'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80'
        ]
      }
    ];

    for (const item of updates) {
      const res = await Product.updateMany(item.query, { $set: { images: item.images } });
      console.log(`Updated images for ${JSON.stringify(item.query)}: matched ${res.matchedCount}, modified ${res.modifiedCount}`);
    }

    // Also check all products in Atlas and ensure none have empty images
    const all = await Product.find({}).toArray();
    console.log(`Total products in Atlas: ${all.length}`);
    for (const p of all) {
      console.log(`- ${p.name}: ${JSON.stringify(p.images)}`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Error]:', err.message);
    process.exit(1);
  }
};

fixImages();
