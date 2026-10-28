import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('kirti_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('kirti_token') || null);
  const [loading, setLoading] = useState(true);
  const { success, error: showError } = useToast();

  useEffect(() => {
    const verifyAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('kirti_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('[Auth Error]: Token verification failed', err);
          logout();
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token: authToken, user: authUser } = res.data;
        setToken(authToken);
        setUser(authUser);
        localStorage.setItem('kirti_token', authToken);
        localStorage.setItem('kirti_user', JSON.stringify(authUser));
        success(`Welcome back, ${authUser.name}!`);
        return { success: true, user: authUser };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      showError(msg);
      return { success: false, message: msg };
    }
  };

  const register = async (formData) => {
    try {
      const res = await api.post('/auth/register', formData);
      if (res.data.success) {
        const { token: authToken, user: authUser } = res.data;
        setToken(authToken);
        setUser(authUser);
        localStorage.setItem('kirti_token', authToken);
        localStorage.setItem('kirti_user', JSON.stringify(authUser));
        success('Account created successfully! Welcome to Kirti Store.');
        return { success: true, user: authUser };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      showError(msg);
      return { success: false, message: msg };
    }
  };

  const googleLogin = async (credential) => {
    try {
      const res = await api.post('/auth/google', { credential });
      if (res.data.success) {
        const { token: authToken, user: authUser } = res.data;
        setToken(authToken);
        setUser(authUser);
        localStorage.setItem('kirti_token', authToken);
        localStorage.setItem('kirti_user', JSON.stringify(authUser));
        success(`Welcome, ${authUser.name}!`);
        return { success: true, user: authUser };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Google sign-in failed. Please try again.';
      showError(msg);
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('kirti_token');
    localStorage.removeItem('kirti_user');
    success('Logged out successfully.');
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await api.put('/auth/profile', profileData);
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('kirti_user', JSON.stringify(res.data.user));
        success('Profile updated successfully.');
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile.';
      showError(msg);
      return { success: false, message: msg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        googleLogin,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
