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
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const root = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace(/\/+$/, '').replace(/\/api$/, '')
    : (Capacitor.isNativePlatform() ? 'http://10.0.2.2:5000' : '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${root}${cleanPath}`;
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
