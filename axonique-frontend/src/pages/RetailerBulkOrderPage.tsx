// RetailerBulkOrderPage.tsx
// User Story: As a retailer, I want to manage bulk purchases, inventory,
// and orders efficiently so that I can streamline my business operations.

import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import './RetailerBulkOrderPage.css'; 

// ─── Types ───────────────────────────────────────────────────────────────────

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  emoji: string;
  imageUrl?: string;
  badge: string | null;
  sizes: string[];
  desc?: string;
  description?: string;
  inStock: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  lowStock: boolean;
}

interface BulkLineItem {
  product: Product;
  size: string;
  qty: number;
  unitPrice: number;
  discountPct: number;
}

type Tab = 'order' | 'inventory' | 'history';

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

interface PastOrder {
  id: number;
  ref: string;
  date: string;
  items: number;
  subtotal: number;
  discount: number;
  total: number;
  status: OrderStatus;
}

// ─── Discount tiers ───────────────────────────────────────────────────────────

const DISCOUNT_TIERS = [
  { minQty: 50,  pct: 5,  label: 'Bronze' },
  { minQty: 100, pct: 10, label: 'Silver' },
  { minQty: 200, pct: 15, label: 'Gold'   },
  { minQty: 500, pct: 20, label: 'Platinum'},
];

function getDiscount(qty: number): { pct: number; label: string } {
  for (let i = DISCOUNT_TIERS.length - 1; i >= 0; i--) {
    if (qty >= DISCOUNT_TIERS[i].minQty) return DISCOUNT_TIERS[i];
  }
  return { pct: 0, label: 'Standard' };
}

// ─── Mock data (replace with real API calls) ─────────────────────────────────
// Replaced with real API calls in the main component useEffect hooks.

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_META: Record<OrderStatus, { label: string; cls: string }> = {
  PENDING:   { label: 'Pending',   cls: 'status--pending'   },
  CONFIRMED: { label: 'Confirmed', cls: 'status--confirmed' },
  SHIPPED:   { label: 'Shipped',   cls: 'status--shipped'   },
  DELIVERED: { label: 'Delivered', cls: 'status--delivered' },
  CANCELLED: { label: 'Cancelled', cls: 'status--cancelled' },
};

function fmt(n: number) {
  return `Rs ${n.toLocaleString('en-LK')}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DiscountBanner({ totalQty }: { totalQty: number }) {
  const current = getDiscount(totalQty);
  const next = DISCOUNT_TIERS.find(t => t.minQty > totalQty);
  const needed = next ? next.minQty - totalQty : 0;

  return (
    <div className="discount-banner">
      <div className="discount-banner__left">
        <span className="discount-banner__tier">{current.label}</span>
        <span className="discount-banner__rate">
          {current.pct > 0 ? `${current.pct}% bulk discount applied` : 'No discount yet'}
        </span>
      </div>
      <div className="discount-banner__tiers">
        {DISCOUNT_TIERS.map(t => (
          <div key={t.label} className={`tier-badge ${totalQty >= t.minQty ? 'tier-badge--active' : ''}`}>
            <span className="tier-badge__pct">{t.pct}%</span>
            <span className="tier-badge__label">{t.label}</span>
            <span className="tier-badge__min">{t.minQty}+ units</span>
          </div>
        ))}
      </div>
      {next && (
        <div className="discount-banner__nudge">
          Add <strong>{needed}</strong> more units to unlock <strong>{next.pct}%</strong> ({next.label})
        </div>
      )}
    </div>
  );
}

function ProductSelector({
  products,
  onAdd,
}: {
  products: Product[];
  onAdd: (p: Product, size: string, qty: number) => void;
}) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [selections, setSelections] = useState<Record<number, { size: string; qty: string }>>({});

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filtered = products.filter(p => {
    const matchCat = catFilter === 'All' || p.category === catFilter;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch && p.inStock;
  });

  function getSel(id: number) {
    return selections[id] ?? { size: '', qty: '50' };
  }

  function setSel(id: number, key: 'size' | 'qty', val: string) {
    setSelections(prev => ({ ...prev, [id]: { ...getSel(id), [key]: val } }));
  }

  function handleAdd(p: Product) {
    const sel = getSel(p.id);
    const size = sel.size || p.sizes[0];
    const qty = Math.max(1, parseInt(sel.qty) || 1);
    onAdd(p, size, qty);
  }

  return (
    <div className="product-selector">
      <div className="product-selector__toolbar">
        <input
          className="rb-input"
          placeholder="Search products…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search products"
        />
        <div className="cat-tabs" role="tablist">
          {categories.map(c => (
            <button
              key={c}
              role="tab"
              aria-selected={catFilter === c}
              className={`cat-tab ${catFilter === c ? 'cat-tab--active' : ''}`}
              onClick={() => setCatFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="product-grid">
        {filtered.map(p => {
          const sel = getSel(p.id);
          const qty = parseInt(sel.qty) || 0;
          const disc = getDiscount(qty);
          const effectivePrice = p.price * (1 - disc.pct / 100);

          return (
            <div key={p.id} className={`product-tile ${p.lowStock ? 'product-tile--low-stock' : ''}`}>
              {p.lowStock && <div className="low-stock-badge">Low Stock</div>}
              {p.badge && <div className="product-badge">{p.badge}</div>}
              <div className="product-tile__emoji">{p.emoji}</div>
              <div className="product-tile__body">
                <div className="product-tile__name">{p.name}</div>
                <div className="product-tile__cat">{p.category}</div>
                <div className="product-tile__stock">Stock: {p.stockQuantity} units</div>
                <div className="product-tile__price">
                  {disc.pct > 0 && (
                    <span className="price-original">{fmt(p.price)}</span>
                  )}
                  <span className="price-final">{fmt(Math.round(effectivePrice))}</span>
                  {disc.pct > 0 && <span className="price-disc">−{disc.pct}%</span>}
                </div>
              </div>
              <div className="product-tile__controls">
                <select
                  className="rb-select"
                  value={sel.size || p.sizes[0]}
                  onChange={e => setSel(p.id, 'size', e.target.value)}
                  aria-label={`Size for ${p.name}`}
                >
                  {p.sizes.map(s => <option key={s}>{s}</option>)}
                </select>
                <input
                  className="rb-input rb-input--qty"
                  type="number"
                  min={1}
                  max={p.stockQuantity}
                  value={sel.qty}
                  onChange={e => setSel(p.id, 'qty', e.target.value)}
                  aria-label={`Quantity for ${p.name}`}
                />
                <button className="btn-add" onClick={() => handleAdd(p)} aria-label={`Add ${p.name} to order`}>
                  + Add
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="empty-state">No products match your search.</div>
        )}
      </div>
    </div>
  );
}

function OrderBuilder({
  lines,
  onRemove,
  onQtyChange,
  onSubmit,
  submitting,
  companyName,
  setCompanyName,
  contactPerson,
  setContactPerson,
  contactEmail,
  setContactEmail,
  deliveryAddress,
  setDeliveryAddress,
  notes,
  setNotes,
}: {
  lines: BulkLineItem[];
  onRemove: (idx: number) => void;
  onQtyChange: (idx: number, qty: number) => void;
  onSubmit: () => void;
  submitting: boolean;
  companyName: string;
  setCompanyName: (val: string) => void;
  contactPerson: string;
  setContactPerson: (val: string) => void;
  contactEmail: string;
  setContactEmail: (val: string) => void;
  deliveryAddress: string;
  setDeliveryAddress: (val: string) => void;
  notes: string;
  setNotes: (val: string) => void;
}) {

  const totalQty      = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal      = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const totalDiscount = lines.reduce((s, l) => s + (l.unitPrice * l.qty * l.discountPct / 100), 0);
  const grandTotal    = subtotal - totalDiscount;

  const canSubmit = lines.length > 0 && companyName && contactPerson && contactEmail && deliveryAddress;

  return (
    <div className="order-builder">
      <div className="order-builder__main">
        {/* Retailer Info */}
        <section className="rb-section">
          <h3 className="rb-section__title">Retailer Information</h3>
          <div className="rb-form-grid">
            <label className="rb-label">
              Company / Brand Name
              <input className="rb-input" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Retail Ltd." />
            </label>
            <label className="rb-label">
              Contact Person
              <input className="rb-input" value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="Jane Doe" />
            </label>
            <label className="rb-label">
              Email
              <input className="rb-input" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="orders@acme.lk" />
            </label>
            <label className="rb-label">
              Delivery Address
              <input className="rb-input" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="123 Main St, Colombo 03" />
            </label>
            <label className="rb-label" style={{ gridColumn: '1 / -1' }}>
              Special Notes
              <textarea className="rb-input rb-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Delivery instructions, packing preferences…" />
            </label>
          </div>
        </section>

        {/* Line Items */}
        <section className="rb-section">
          <h3 className="rb-section__title">Order Lines <span className="rb-badge">{lines.length}</span></h3>
          {lines.length === 0 ? (
            <div className="empty-state">No items added yet — use the product catalogue below.</div>
          ) : (
            <div className="order-lines">
              <div className="order-lines__header">
                <span>Product</span><span>Size</span><span>Qty</span><span>Unit</span><span>Disc</span><span>Subtotal</span><span></span>
              </div>
              {lines.map((line, idx) => {
                const lineSubtotal = line.unitPrice * line.qty;
                const discAmt = lineSubtotal * line.discountPct / 100;
                return (
                  <div key={idx} className="order-line">
                    <span className="order-line__name">
                      <span className="order-line__emoji">{line.product.emoji}</span>
                      {line.product.name}
                    </span>
                    <span className="order-line__size">{line.size}</span>
                    <span className="order-line__qty">
                      <input
                        className="rb-input rb-input--qty rb-input--inline"
                        type="number"
                        min={1}
                        value={line.qty}
                        onChange={e => onQtyChange(idx, Math.max(1, parseInt(e.target.value) || 1))}
                        aria-label={`Quantity for line ${idx + 1}`}
                      />
                    </span>
                    <span className="order-line__unit">{fmt(line.unitPrice)}</span>
                    <span className="order-line__disc">
                      {line.discountPct > 0
                        ? <span className="disc-chip">−{fmt(Math.round(discAmt))}</span>
                        : <span className="disc-chip disc-chip--none">—</span>
                      }
                    </span>
                    <span className="order-line__total">{fmt(Math.round(lineSubtotal - discAmt))}</span>
                    <button
                      className="btn-remove"
                      onClick={() => onRemove(idx)}
                      aria-label={`Remove ${line.product.name}`}
                    >✕</button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Summary Sidebar */}
      <aside className="order-summary">
        <h3 className="order-summary__title">Order Summary</h3>

        <DiscountBanner totalQty={totalQty} />

        <div className="summary-lines">
          <div className="summary-row">
            <span>Total units</span>
            <strong>{totalQty.toLocaleString()}</strong>
          </div>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{fmt(subtotal)}</span>
          </div>
          {totalDiscount > 0 && (
            <div className="summary-row summary-row--discount">
              <span>Bulk discount</span>
              <span>−{fmt(Math.round(totalDiscount))}</span>
            </div>
          )}
          <div className="summary-row summary-row--total">
            <span>Grand Total</span>
            <strong>{fmt(Math.round(grandTotal))}</strong>
          </div>
        </div>

        <button
          className="btn-submit"
          disabled={!canSubmit || submitting}
          onClick={onSubmit}
          aria-disabled={!canSubmit || submitting}
        >
          {submitting ? 'Placing Order…' : 'Place Bulk Order →'}
        </button>

        {!canSubmit && lines.length > 0 && (
          <p className="submit-hint">Fill in retailer information to continue.</p>
        )}
      </aside>
    </div>
  );
}

function InventoryPanel({ products }: { products: Product[] }) {
  const [search, setSearch] = useState('');
  const lowStock = products.filter(p => p.lowStock);
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="inventory-panel">
      {lowStock.length > 0 && (
        <div className="alert-banner" role="alert" aria-live="polite">
          <span className="alert-banner__icon">⚠️</span>
          <span><strong>{lowStock.length} product{lowStock.length > 1 ? 's' : ''}</strong> {lowStock.length > 1 ? 'are' : 'is'} running low: {lowStock.map(p => p.name).join(', ')}</span>
        </div>
      )}

      <div className="inventory-toolbar">
        <input
          className="rb-input"
          placeholder="Search inventory…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className="inventory-count">{products.length} SKUs</span>
      </div>

      <div className="inventory-table" role="table" aria-label="Inventory levels">
        <div className="inventory-table__head" role="row">
          <span role="columnheader">Product</span>
          <span role="columnheader">Category</span>
          <span role="columnheader">Unit Price</span>
          <span role="columnheader">Stock</span>
          <span role="columnheader">Threshold</span>
          <span role="columnheader">Status</span>
        </div>
        {filtered.map(p => {
          const pct = Math.min(100, (p.stockQuantity / Math.max(1, p.lowStockThreshold * 5)) * 100);
          return (
            <div key={p.id} className="inventory-row" role="row">
              <span className="inv-name" role="cell">
                <span aria-hidden="true">{p.emoji}</span> {p.name}
              </span>
              <span role="cell">{p.category}</span>
              <span role="cell">{fmt(p.price)}</span>
              <span role="cell">
                <div className="stock-bar" aria-label={`${p.stockQuantity} units`}>
                  <div
                    className={`stock-bar__fill ${p.lowStock ? 'stock-bar__fill--low' : ''}`}
                    style={{ width: `${pct}%` }}
                  />
                  <span className="stock-bar__label">{p.stockQuantity}</span>
                </div>
              </span>
              <span role="cell">{p.lowStockThreshold}</span>
              <span role="cell">
                <span className={`inv-status ${p.lowStock ? 'inv-status--low' : 'inv-status--ok'}`}>
                  {p.lowStock ? 'Low' : 'OK'}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderHistory({ orders }: { orders: PastOrder[] }) {
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');

  const filtered = orders.filter(o => statusFilter === 'ALL' || o.status === statusFilter);

  const totalRevenue = orders
    .filter(o => o.status === 'DELIVERED')
    .reduce((s, o) => s + o.total, 0);

  const totalSaved = orders
    .filter(o => o.status === 'DELIVERED')
    .reduce((s, o) => s + o.discount, 0);

  return (
    <div className="order-history">
      <div className="history-metrics">
        <div className="history-metric">
          <span className="history-metric__label">Total Spend</span>
          <span className="history-metric__value">{fmt(totalRevenue)}</span>
        </div>
        <div className="history-metric">
          <span className="history-metric__label">Total Saved</span>
          <span className="history-metric__value history-metric__value--green">{fmt(totalSaved)}</span>
        </div>
        <div className="history-metric">
          <span className="history-metric__label">Orders Placed</span>
          <span className="history-metric__value">{orders.length}</span>
        </div>
      </div>

      <div className="history-filters">
        {(['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const).map(s => (
          <button
            key={s}
            className={`filter-btn ${statusFilter === s ? 'filter-btn--active' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'ALL' ? 'All' : STATUS_META[s as OrderStatus]?.label ?? s}
          </button>
        ))}
      </div>

      <div className="history-list">
        {filtered.length === 0 && <div className="empty-state">No orders match this filter.</div>}
        {filtered.map(o => (
          <div key={o.id} className="history-card">
            <div className="history-card__head">
              <span className="history-card__ref">{o.ref}</span>
              <span className={`status-pill ${STATUS_META[o.status].cls}`}>
                {STATUS_META[o.status].label}
              </span>
            </div>
            <div className="history-card__meta">
              <span>{o.date}</span>
              <span>{o.items} line items</span>
            </div>
            <div className="history-card__financials">
              <span className="hc-label">Subtotal</span>
              <span>{fmt(o.subtotal)}</span>
              {o.discount > 0 && (
                <>
                  <span className="hc-label hc-label--discount">Bulk Discount</span>
                  <span className="hc-discount">−{fmt(o.discount)}</span>
                </>
              )}
              <span className="hc-label hc-label--total">Total Paid</span>
              <span className="hc-total">{fmt(o.total)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RetailerBulkOrderPage() {
  const [tab, setTab] = useState<Tab>('order');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<PastOrder[]>([]);
  const [lines, setLines] = useState<BulkLineItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  // Form fields for bulk order
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');

  const token = authService.getToken();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

  // Fetch products from API
  useEffect(() => {
    fetch(`${apiBaseUrl}/api/products`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        return r.json();
      })
      .then(data => {
        console.log('Products fetched:', data);
        // Handle both array and wrapped response format
        const products = Array.isArray(data) ? data : (data.data || []);
        setProducts(products);
      })
      .catch(err => {
        console.error('Failed to fetch products:', err);
        setToast('Failed to load products. Please refresh the page.');
      });
  }, [apiBaseUrl]);

  // Fetch past bulk orders for this retailer
  useEffect(() => {
    if (!token) return;
    fetch(`${apiBaseUrl}/api/bulk-orders/my`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        return r.json();
      })
      .then(data => {
        console.log('Bulk orders fetched:', data);
        // Backend returns ApiResponse{ success: bool, data: [], message: string }
        const bulkOrderResponses = data.data || [];
        // Map BulkOrderResponse to PastOrder interface
        const orders: PastOrder[] = bulkOrderResponses.map((bo: any) => ({
          id: bo.id,
          ref: bo.ref,
          date: bo.createdAt ? new Date(bo.createdAt).toLocaleDateString() : '',
          items: bo.itemCount || 0,
          subtotal: bo.subtotal || 0,
          discount: bo.discountAmount || 0,
          total: bo.total || 0,
          status: bo.status as OrderStatus,
        }));
        setOrders(orders);
      })
      .catch(err => {
        console.error('Failed to fetch bulk orders:', err);
        setToast('Failed to load order history.');
      });
  }, [token, apiBaseUrl]);

  // auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const addLine = useCallback((product: Product, size: string, qty: number) => {
    setLines(prev => {
      const idx = prev.findIndex(l => l.product.id === product.id && l.size === size);
      if (idx >= 0) {
        const updated = [...prev];
        const newQty = updated[idx].qty + qty;
        const disc = getDiscount(newQty);
        updated[idx] = { ...updated[idx], qty: newQty, discountPct: disc.pct };
        return updated;
      }
      const disc = getDiscount(qty);
      return [...prev, { product, size, qty, unitPrice: product.price, discountPct: disc.pct }];
    });
    setToast(`${product.name} (${size} × ${qty}) added to order`);
  }, []);

  const removeLine = useCallback((idx: number) => {
    setLines(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const changeQty = useCallback((idx: number, qty: number) => {
    setLines(prev => {
      const updated = [...prev];
      const disc = getDiscount(qty);
      updated[idx] = { ...updated[idx], qty, discountPct: disc.pct };
      return updated;
    });
  }, []);

const handleSubmit = useCallback(async () => {
  setSubmitting(true);
  try {
    const res = await fetch(`${apiBaseUrl}/api/bulk-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        companyName,
        contactPerson,
        contactEmail,
        deliveryAddress,
        notes,
        items: lines.map(l => ({
          productId: l.product.id,
          size: l.size,
          quantity: l.qty,
          unitPrice: l.unitPrice,
        })),
      }),
    });
    if (!res.ok) throw new Error('Order failed');
    setLines([]);
    setCompanyName('');
    setContactPerson('');
    setContactEmail('');
    setDeliveryAddress('');
    setNotes('');
    setToast('Bulk order placed successfully!');
    setTab('history');
    
    // Refetch bulk orders to show the newly created order
    const ordersRes = await fetch(`${apiBaseUrl}/api/bulk-orders/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (ordersRes.ok) {
      const ordersData = await ordersRes.json();
      const bulkOrderResponses = ordersData.data || [];
      const updatedOrders: PastOrder[] = bulkOrderResponses.map((bo: any) => ({
        id: bo.id,
        ref: bo.ref,
        date: bo.createdAt ? new Date(bo.createdAt).toLocaleDateString() : '',
        items: bo.itemCount || 0,
        subtotal: bo.subtotal || 0,
        discount: bo.discountAmount || 0,
        total: bo.total || 0,
        status: bo.status as OrderStatus,
      }));
      setOrders(updatedOrders);
    }
  } catch (err) {
    setToast('Failed to place order. Please try again.');
  } finally {
    setSubmitting(false);
  }
}, [lines, companyName, contactPerson, contactEmail, deliveryAddress, notes, token, apiBaseUrl]);

  const totalQty = lines.reduce((s, l) => s + l.qty, 0);

  return (
    <main className="rb-page">
      {/* Toast */}
      {toast && (
        <div className="rb-toast" role="status" aria-live="polite">
          <span className="rb-toast__icon">✓</span>
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="rb-header">
        <div className="rb-container">
          <div className="rb-header__label">Retailer Portal</div>
          <h1 className="rb-header__title">Bulk Order Centre</h1>
          <p className="rb-header__sub">
            Manage wholesale purchases with tiered discounts, real-time inventory visibility, and full order tracking.
          </p>
        </div>
      </header>

      {/* Tabs */}
      <nav className="rb-tabs" role="tablist" aria-label="Retailer portal sections">
        <div className="rb-container rb-tabs__inner">
          <button
            role="tab"
            aria-selected={tab === 'order'}
            className={`rb-tab ${tab === 'order' ? 'rb-tab--active' : ''}`}
            onClick={() => setTab('order')}
          >
            <span className="rb-tab__icon">📦</span>
            New Bulk Order
            {totalQty > 0 && <span className="rb-tab__badge">{totalQty}</span>}
          </button>
          <button
            role="tab"
            aria-selected={tab === 'inventory'}
            className={`rb-tab ${tab === 'inventory' ? 'rb-tab--active' : ''}`}
            onClick={() => setTab('inventory')}
          >
            <span className="rb-tab__icon">🗃</span>
            Inventory
            {products.filter(p => p.lowStock).length > 0 && (
              <span className="rb-tab__badge rb-tab__badge--warn">
                {products.filter(p => p.lowStock).length}
              </span>
            )}
          </button>
          <button
            role="tab"
            aria-selected={tab === 'history'}
            className={`rb-tab ${tab === 'history' ? 'rb-tab--active' : ''}`}
            onClick={() => setTab('history')}
          >
            <span className="rb-tab__icon">📋</span>
            Order History
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="rb-container rb-content">
        {tab === 'order' && (
          <>
            <OrderBuilder
              lines={lines}
              onRemove={removeLine}
              onQtyChange={changeQty}
              onSubmit={handleSubmit}
              submitting={submitting}
              companyName={companyName}
              setCompanyName={setCompanyName}
              contactPerson={contactPerson}
              setContactPerson={setContactPerson}
              contactEmail={contactEmail}
              setContactEmail={setContactEmail}
              deliveryAddress={deliveryAddress}
              setDeliveryAddress={setDeliveryAddress}
              notes={notes}
              setNotes={setNotes}
            />
            <div className="rb-divider" />
            <div className="rb-section-label">Product Catalogue</div>
            <ProductSelector products={products} onAdd={addLine} />
          </>
        )}
        {tab === 'inventory' && <InventoryPanel products={products} />}
        {tab === 'history' && <OrderHistory orders={orders} />}
      </div>
    </main>
  );
}