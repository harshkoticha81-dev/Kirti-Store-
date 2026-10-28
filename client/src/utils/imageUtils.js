import { getServerAssetUrl } from '../services/api';

export const CATEGORY_FALLBACK_IMAGES = {
  'mixers-grinders': '/images/appliances/mixer.svg',
  'blenders': '/images/appliances/blender.svg',
  'soda-makers': '/images/appliances/soda.svg',
  'electric-kettles': '/images/appliances/kettle.svg',
  'juicers': '/images/appliances/blender.svg',
  'toasters-sandwich-makers': '/images/appliances/default.svg',
  'food-processors': '/images/appliances/mixer.svg',
  'default': '/images/appliances/default.svg'
};

export const getApplianceFallbackImage = (categoryOrName = '') => {
  const query = String(categoryOrName || '').toLowerCase();
  if (query.includes('kettle')) return CATEGORY_FALLBACK_IMAGES['electric-kettles'];
  if (query.includes('blender')) return CATEGORY_FALLBACK_IMAGES['blenders'];
  if (query.includes('soda')) return CATEGORY_FALLBACK_IMAGES['soda-makers'];
  if (query.includes('juice')) return CATEGORY_FALLBACK_IMAGES['juicers'];
  if (query.includes('toast') || query.includes('sandwich')) return CATEGORY_FALLBACK_IMAGES['toasters-sandwich-makers'];
  if (query.includes('food') || query.includes('processor') || query.includes('chopper')) return CATEGORY_FALLBACK_IMAGES['food-processors'];
  if (query.includes('mixer') || query.includes('grinder') || query.includes('sujata')) return CATEGORY_FALLBACK_IMAGES['mixers-grinders'];
  return CATEGORY_FALLBACK_IMAGES['default'];
};

export const getSafeProductImageUrl = (imageSrc, categoryOrName = '') => {
  if (!imageSrc) return getApplianceFallbackImage(categoryOrName);
  return getServerAssetUrl(imageSrc);
};
