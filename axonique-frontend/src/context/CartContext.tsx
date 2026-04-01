import { createContext, useContext, useEffect, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { CartItem, Product } from '../types';

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; size: string } }
  | { type: 'REMOVE_ITEM'; payload: { productId: number; size: string } }
  | { type: 'CHANGE_QTY'; payload: { productId: number; size: string; delta: number } }
  | { type: 'CLEAR' };

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, size: string) => void;
  removeItem: (productId: number, size: string) => void;
  changeQty: (productId: number, size: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = 'axo_cart_items_v1';

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, size } = action.payload;
      const idx = state.items.findIndex(
        (i) => i.product.id === product.id && i.size === size
      );
      if (idx >= 0) {
        const updated = [...state.items];
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + 1 };
        return { items: updated };
      }
      return { items: [...state.items, { product, size, qty: 1 }] };
    }
    case 'REMOVE_ITEM':
      return {
        items: state.items.filter(
          (i) => !(i.product.id === action.payload.productId && i.size === action.payload.size)
        ),
      };
    case 'CHANGE_QTY': {
      const { productId, size, delta } = action.payload;
      const updated = state.items
        .map((i) =>
          i.product.id === productId && i.size === size
            ? { ...i, qty: i.qty + delta }
            : i
        )
        .filter((i) => i.qty > 0);
      return { items: updated };
    }
    case 'CLEAR':
      return { items: [] };
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] }, () => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return { items: [] };
      const parsed = JSON.parse(raw) as CartItem[];
      return { items: Array.isArray(parsed) ? parsed : [] };
    } catch {
      return { items: [] };
    }
  });

  const addItem = (product: Product, size: string) =>
    dispatch({ type: 'ADD_ITEM', payload: { product, size } });

  const removeItem = (productId: number, size: string) =>
    dispatch({ type: 'REMOVE_ITEM', payload: { productId, size } });

  const changeQty = (productId: number, size: string, delta: number) =>
    dispatch({ type: 'CHANGE_QTY', payload: { productId, size, delta } });

  const clearCart = () => dispatch({ type: 'CLEAR' });

  const totalItems = state.items.reduce((s, i) => s + i.qty, 0);
  const subtotal = state.items.reduce((s, i) => s + i.product.price * i.qty, 0);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items]);

  return (
    <CartContext.Provider value={{ items: state.items, addItem, removeItem, changeQty, clearCart, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
