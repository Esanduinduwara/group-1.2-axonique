import { createContext, useContext, useEffect, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { Product } from '../types';

export interface BulkItem {
  product: Product;
  size: string;
  qty: number;
  unitPrice: number;
}

export interface BulkInfo {
  companyName: string;
  contactPerson: string;
  contactEmail: string;
  deliveryAddress: string;
  notes: string;
}

interface BulkState {
  items: BulkItem[];
  info: BulkInfo;
}

type BulkAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; size: string; qty: number } }
  | { type: 'REMOVE_ITEM'; payload: { productId: number; size: string } }
  | { type: 'CHANGE_QTY'; payload: { productId: number; size: string; qty: number } }
  | { type: 'CLEAR' }
  | { type: 'SET_INFO'; payload: Partial<BulkInfo> };

export const DISCOUNT_TIERS = [
  { minQty: 50,  pct: 5,  label: 'Bronze' },
  { minQty: 100, pct: 10, label: 'Silver' },
  { minQty: 200, pct: 15, label: 'Gold'   },
  { minQty: 500, pct: 20, label: 'Platinum'},
];

export function getBulkDiscount(totalQty: number): { pct: number; label: string } {
  for (let i = DISCOUNT_TIERS.length - 1; i >= 0; i--) {
    if (totalQty >= DISCOUNT_TIERS[i].minQty) return DISCOUNT_TIERS[i];
  }
  return { pct: 0, label: 'Standard' };
}

interface BulkContextType {
  items: BulkItem[];
  addItem: (product: Product, size: string, qty: number) => void;
  removeItem: (productId: number, size: string) => void;
  changeQty: (productId: number, size: string, qty: number) => void;
  clearBulk: () => void;
  totalQty: number;
  subtotal: number;
  discountPct: number;
  discountAmt: number;
  grandTotal: number;
  info: BulkInfo;
  setInfo: (info: Partial<BulkInfo>) => void;
}

const BulkContext = createContext<BulkContextType | undefined>(undefined);
const BULK_STORAGE_KEY = 'axo_bulk_items_v1';

function bulkReducer(state: BulkState, action: BulkAction): BulkState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, size, qty } = action.payload;
      const idx = state.items.findIndex(
        (i) => i.product.id === product.id && i.size === size
      );
      if (idx >= 0) {
        const updated = [...state.items];
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + qty };
        return { ...state, items: updated };
      }
      return { ...state, items: [...state.items, { product, size, qty, unitPrice: product.price }] };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(
          (i) => !(i.product.id === action.payload.productId && i.size === action.payload.size)
        ),
      };
    case 'CHANGE_QTY': {
      const { productId, size, qty } = action.payload;
      const updated = state.items
        .map((i) =>
          i.product.id === productId && i.size === size
            ? { ...i, qty }
            : i
        )
        .filter((i) => i.qty > 0);
      return { ...state, items: updated };
    }
    case 'CLEAR':
      return { ...state, items: [] };
    case 'SET_INFO':
      return { ...state, info: { ...state.info, ...action.payload } };
    default:
      return state;
  }
}

export function BulkProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bulkReducer, { items: [], info: { companyName: '', contactPerson: '', contactEmail: '', deliveryAddress: '', notes: '' } }, () => {
    try {
      const raw = localStorage.getItem(BULK_STORAGE_KEY);
      if (!raw) return { items: [], info: { companyName: '', contactPerson: '', contactEmail: '', deliveryAddress: '', notes: '' } };
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Migration from old schema
        return { items: parsed, info: { companyName: '', contactPerson: '', contactEmail: '', deliveryAddress: '', notes: '' } };
      }
      return {
        items: Array.isArray(parsed.items) ? parsed.items : [],
        info: parsed.info || { companyName: '', contactPerson: '', contactEmail: '', deliveryAddress: '', notes: '' }
      };
    } catch {
      return { items: [], info: { companyName: '', contactPerson: '', contactEmail: '', deliveryAddress: '', notes: '' } };
    }
  });

  const addItem = (product: Product, size: string, qty: number) =>
    dispatch({ type: 'ADD_ITEM', payload: { product, size, qty } });

  const removeItem = (productId: number, size: string) =>
    dispatch({ type: 'REMOVE_ITEM', payload: { productId, size } });

  const changeQty = (productId: number, size: string, qty: number) =>
    dispatch({ type: 'CHANGE_QTY', payload: { productId, size, qty } });

  const clearBulk = () => dispatch({ type: 'CLEAR' });

  const setInfo = (info: Partial<BulkInfo>) => dispatch({ type: 'SET_INFO', payload: info });

  const totalQty = state.items.reduce((s: number, i: BulkItem) => s + i.qty, 0);
  const subtotal = state.items.reduce((s: number, i: BulkItem) => s + i.unitPrice * i.qty, 0);
  const discountInfo = getBulkDiscount(totalQty);
  const discountPct = discountInfo.pct;
  const discountAmt = Math.round(subtotal * (discountPct / 100));
  const grandTotal = subtotal - discountAmt;

  useEffect(() => {
    localStorage.setItem(BULK_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return (
    <BulkContext.Provider value={{ 
      items: state.items, 
      addItem, 
      removeItem, 
      changeQty, 
      clearBulk, 
      totalQty, 
      subtotal, 
      discountPct, 
      discountAmt, 
      grandTotal,
      info: state.info,
      setInfo
    }}>
      {children}
    </BulkContext.Provider>
  );
}

export function useBulk() {
  const ctx = useContext(BulkContext);
  if (!ctx) throw new Error('useBulk must be used within BulkProvider');
  return ctx;
}
