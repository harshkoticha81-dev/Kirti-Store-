import axios from 'axios';
import { Capacitor } from '@capacitor/core';

// Helper to determine the API root URL dynamically for web and native mobile
export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    const raw = import.meta.env.VITE_API_URL.replace(/\/+$/, '');
    return raw.endsWith('/api') ? raw : `${raw}/api`;
  }
  // Native mobile app running inside Capacitor (Android/iOS WebView)
  if (Capacitor.isNativePlatform()) {
    // 10.0.2.2 is Android emulator's loopback to host PC.
    // For a physical phone, set VITE_API_URL to your computer's LAN IP e.g. http://192.168.1.X:5000
    return 'http://10.0.2.2:5000/api';
  }
  return '/api';
};

// Helper for images and static assets from server
export const getServerAssetUrl = (path = '') => {
  if (!path || typeof path !== 'string' || !path.trim() || path.includes('photo-1570222094114-d054a817e56b')) {
    return '';
  }
  const trimmed = path.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  if (import.meta.env.VITE_API_URL) {
    const root = import.meta.env.VITE_API_URL.replace(/\/+$/, '').replace(/\/api$/, '');
    return `${root}${cleanPath}`;
  }

  if (Capacitor.isNativePlatform()) {
    return `http://10.0.2.2:5000${cleanPath}`;
  }

  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.')
  );

  if (isLocalhost) {
    // In local development, relative path /uploads/... is proxied directly to localhost:5000 by vite.config.js
    return cleanPath;
  }

  // Production web deployment (e.g. Vercel)
  return `https://kirti-store-api.onrender.com${cleanPath}`;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kirti_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If expired token, clear storage
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/account') || currentPath.startsWith('/admin')) {
        // Only redirect if on protected page
        localStorage.removeItem('kirti_token');
        localStorage.removeItem('kirti_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
