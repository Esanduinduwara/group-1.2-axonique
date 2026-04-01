import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Product } from '../types';

interface WishlistContextType {
  items: Product[];
  addItem: (product: Product) => boolean;
  removeItem: (productId: number) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
const WISHLIST_STORAGE_KEY = 'axo_wishlist_items_v1';

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Product[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const addItem = (product: Product) => {
    const exists = items.some((item) => item.id === product.id);
    if (exists) return false;
    setItems((prev) => [...prev, product]);
    return true;
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  };

  useEffect(() => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  return (
    <WishlistContext.Provider value={{ items, addItem, removeItem }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextType {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
