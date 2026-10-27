/**
 * Kitchen Appliance Transportation & Packaging Calculator (Server-side)
 *
 * Transportation charge rules:
 * - Big size appliance package (Mixers, Juicers, Food Processors, Soda Makers, Cooktops, Ovens, or price >= ₹2,500):
 *   Standard ₹120 (matches ₹100 to ₹150 range)
 * - Small size appliance package (Electric Kettles, Toasters, Blenders, Choppers, Sandwich Makers, or price < ₹2,500):
 *   Standard ₹60 (matches ₹50 to ₹120 range)
 */

const isBigAppliance = (product) => {
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

const getProductTransportationCharge = (product) => {
  if (product && product.transportationCharge && product.transportationCharge > 0) {
    return product.transportationCharge;
  }
  return isBigAppliance(product) ? 120 : 60;
};

const calculateCartTransportation = (items = []) => {
  if (!items || items.length === 0) return 0;

  let hasBig = false;
  let totalUnits = 0;

  for (const item of items) {
    const prod = item.product || item;
    const isBig = isBigAppliance(prod);
    if (isBig) hasBig = true;
    totalUnits += (item.quantity || 1);
  }

  let totalFee = hasBig ? 120 : 60;
  if (totalUnits > 1) {
    totalFee += (totalUnits - 1) * (hasBig ? 30 : 20);
  }

  return totalFee;
};

module.exports = {
  isBigAppliance,
  getProductTransportationCharge,
  calculateCartTransportation
};
