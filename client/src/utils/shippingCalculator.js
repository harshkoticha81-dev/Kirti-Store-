/**
 * Kitchen Appliance Transportation & Packaging Calculator
 *
 * Transportation charge rules:
 * - Big size appliance package (Mixers, Juicers, Food Processors, Soda Makers, Cooktops, Ovens, or price >= ₹2,500):
 *   Standard ₹120 (matches ₹100 to ₹150 range)
 * - Small size appliance package (Electric Kettles, Toasters, Blenders, Choppers, Sandwich Makers, or price < ₹2,500):
 *   Standard ₹60 (matches ₹50 to ₹120 range)
 */

export const isBigAppliance = (product) => {
  if (!product) return false;
  if (product.packageSize === 'big') return true;
  if (product.packageSize === 'small') return false;

  const name = (product.name || '').toLowerCase();
  const category = (product.categoryName || product.category?.name || '').toLowerCase();

  const bigKeywords = [
    'mixer', 'grinder', 'food processor', 'juicer', 'soda maker',
    'cooktop', 'induction', 'microwave', 'oven', 'otg', 'chimney',
    'dishwasher', 'purifier', 'cooler', 'geyser', 'refrigerator', 'washing'
  ];

  if (bigKeywords.some((kw) => name.includes(kw) || category.includes(kw))) {
    return true;
  }

  const price = product.sellingPrice || product.price || 0;
  return price >= 2500;
};

export const getProductTransportationCharge = (product) => {
  if (product?.transportationCharge && product.transportationCharge > 0) {
    return product.transportationCharge;
  }
  return isBigAppliance(product) ? 120 : 60;
};

export const calculateCartTransportation = (items = []) => {
  if (!items || items.length === 0) {
    return {
      fee: 0,
      hasBigAppliance: false,
      packageType: 'none',
      label: 'Free',
      description: 'Cart is empty',
      breakdown: []
    };
  }

  let hasBig = false;
  let totalUnits = 0;
  const breakdown = [];

  items.forEach((item) => {
    const prod = item.product || item;
    const isBig = isBigAppliance(prod);
    const unitFee = isBig ? 120 : 60;
    const qty = item.quantity || 1;

    if (isBig) hasBig = true;
    totalUnits += qty;

    breakdown.push({
      id: item._id || prod._id,
      name: prod.name,
      isBig,
      packageSize: isBig ? 'Big Appliance Package' : 'Small Appliance Package',
      unitFee,
      quantity: qty,
      itemTotalFee: unitFee * qty
    });
  });

  // Base fee: If order contains any big appliance -> ₹120 (in 100-150 range), otherwise ₹60 (in 50-120 range)
  // Multi-item handling discount: +₹30 per extra unit for big mix, +₹20 per extra unit for small mix
  let totalFee = hasBig ? 120 : 60;
  if (totalUnits > 1) {
    totalFee += (totalUnits - 1) * (hasBig ? 30 : 20);
  }

  return {
    fee: totalFee,
    hasBigAppliance: hasBig,
    packageType: hasBig ? 'big' : 'small',
    label: hasBig
      ? `₹${totalFee} (Big Appliance Package)`
      : `₹${totalFee} (Small Appliance Package)`,
    description: hasBig
      ? `Big appliance package transportation charge (₹100–₹150 range)`
      : `Small appliance package transportation charge (₹50–₹120 range)`,
    breakdown
  };
};
