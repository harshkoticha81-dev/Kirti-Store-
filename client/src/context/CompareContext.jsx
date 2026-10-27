import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

const CompareContext = createContext(null);

export const CompareProvider = ({ children }) => {
  const { success, error: showError, info } = useToast();

  const [compareItems, setCompareItems] = useState(() => {
    try {
      const saved = localStorage.getItem('kirti_compare');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('kirti_compare', JSON.stringify(compareItems));
    } catch (e) {
      console.error('Failed to save compare items to localStorage', e);
    }
  }, [compareItems]);

  const addToCompare = (product) => {
    const productId = product._id || product.id;
    if (compareItems.some((item) => (item._id || item.id) === productId)) {
      showError(`"${product.name}" is already in your comparison list.`);
      return false;
    }

    if (compareItems.length >= 4) {
      showError('You can compare a maximum of 4 appliances at once.');
      return false;
    }

    setCompareItems((prev) => [...prev, product]);
    success(`Added "${product.name}" to comparison.`);
    return true;
  };

  const removeFromCompare = (productId) => {
    setCompareItems((prev) => {
      const item = prev.find((p) => (p._id || p.id) === productId);
      const filtered = prev.filter((p) => (p._id || p.id) !== productId);
      if (item) {
        info(`Removed "${item.name}" from comparison.`);
      }
      return filtered;
    });
  };

  const toggleCompare = (product) => {
    const productId = product._id || product.id;
    if (isInCompare(productId)) {
      removeFromCompare(productId);
    } else {
      addToCompare(product);
    }
  };

  const clearCompare = () => {
    setCompareItems([]);
    info('Comparison list cleared.');
  };

  const isInCompare = (productId) => {
    return compareItems.some((item) => (item._id || item.id) === productId);
  };

  return (
    <CompareContext.Provider
      value={{
        compareItems,
        addToCompare,
        removeFromCompare,
        toggleCompare,
        clearCompare,
        isInCompare,
        compareCount: compareItems.length,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};

export default CompareContext;
