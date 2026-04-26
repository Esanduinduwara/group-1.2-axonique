import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { CartItem, Product } from '../types';
import { authService } from '../services/authService';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, size: string) => Promise<void>;
  removeItem: (productId: number, size: string) => Promise<void>;
  changeQty: (productId: number, size: string, delta: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  subtotal: number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const API_BASE = 'http://localhost:8080/api/cart';

function getCurrentUserId(): number {
  const user = authService.getUser();
  if (!user?.id) throw new Error('User not authenticated');
  return user.id;
}

type BackendCartItem = {
  id: number;
  product: Product;
  size: string;
  quantity: number;
};

function getDiscountedPrice(product: Product): number {
  const price = Number(product.price);

  if (
    product.discountActive &&
    product.discountPercentage != null &&
    Number(product.discountPercentage) > 0
  ) {
    return price - (price * Number(product.discountPercentage)) / 100;
  }

  return price;
}

function mapBackendItem(item: BackendCartItem): CartItem {
  return {
    product: item.product,
    size: item.size,
    qty: item.quantity,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const refreshCart = async () => {
    const res = await fetch(`${API_BASE}/${getCurrentUserId()}`);
    if (!res.ok) {
      throw new Error('Failed to load cart');
    }

    const data: BackendCartItem[] = await res.json();
    setItems(data.map(mapBackendItem));
  };

  useEffect(() => {
    refreshCart().catch((err) => {
      console.error('Failed to fetch cart:', err);
      setItems([]);
    });
  }, []);

  const addItem = async (product: Product, size: string) => {
    const res = await fetch(`${API_BASE}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: getCurrentUserId(),
        productId: product.id,
        size,
        qty: 1,
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to add item to cart');
    }

    await refreshCart();
  };

  const removeItem = async (productId: number, size: string) => {
    const res = await fetch(`${API_BASE}/remove`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: getCurrentUserId(),
        productId,
        size,
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to remove item from cart');
    }

    await refreshCart();
  };

  const changeQty = async (productId: number, size: string, delta: number) => {
    const existing = items.find(
      (item) => item.product.id === productId && item.size === size
    );

    if (!existing) return;

    const newQty = existing.qty + delta;

    if (newQty <= 0) {
      await removeItem(productId, size);
      return;
    }

    const res = await fetch(`${API_BASE}/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: getCurrentUserId(),
        productId,
        size,
        qty: newQty,
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to update quantity');
    }

    await refreshCart();
  };

  const clearCart = async () => {
    const res = await fetch(`${API_BASE}/clear/${getCurrentUserId()}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      throw new Error('Failed to clear cart');
    }

    await refreshCart();
  };

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.qty, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + getDiscountedPrice(item.product) * item.qty, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        changeQty,
        clearCart,
        totalItems,
        subtotal,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}