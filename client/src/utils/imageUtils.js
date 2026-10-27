import { getServerAssetUrl } from '../services/api';

export const CATEGORY_FALLBACK_IMAGES = {
  'mixers-grinders': 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=600&q=80',
  'blenders': 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=600&q=80',
  'soda-makers': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
  'electric-kettles': 'https://images.unsplash.com/photo-1594213114663-d94db9b17125?auto=format&fit=crop&w=600&q=80',
  'juicers': 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=600&q=80',
  'toasters-sandwich-makers': 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80',
  'food-processors': 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80',
  'default': 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=600&q=80'
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
