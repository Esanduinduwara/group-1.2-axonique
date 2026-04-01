import { useState, useEffect, useRef } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { authService } from '../services/authService';
import type { Product } from '../types';
import './InventoryPage.css';

const API = ''+(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080')+'';

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const headers = { ...authService.getAuthHeader(), 'Content-Type': 'application/json' };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    fetch(`${API}/api/admin/inventory`, { headers })
      .then(r => r.json())
      .then(d => {
        setProducts(d.data || []);
        setFiltered(d.data || []);
      })
      .catch(() => showToast('Failed to load inventory', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const s = search.toLowerCase();
    setFiltered(products.filter(p =>
      p.name.toLowerCase().includes(s) || p.category.toLowerCase().includes(s)
    ));
  }, [search, products]);

  useEffect(() => {
    if (editingId !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId]);

  const lowStockCount = products.filter(p => p.lowStock).length;

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditValue(String(p.stockQuantity));
  };

  const commitEdit = async (productId: number) => {
    const qty = parseInt(editValue);
    if (isNaN(qty) || qty < 0) {
      showToast('Invalid quantity', 'error');
      setEditingId(null);
      return;
    }
    try {
      const res = await fetch(`${API}/api/admin/inventory/${productId}/stock?quantity=${qty}`, {
        method: 'PATCH', headers,
      });
      const data = await res.json();
      if (data.success) {
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, stockQuantity: qty, lowStock: qty <= p.lowStockThreshold } : p));
        showToast('Stock updated');
      } else {
        showToast('Update failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
    setEditingId(null);
  };

  const getStatusBadge = (p: Product) => {
    if (p.stockQuantity === 0) return <span className="inv-badge inv-badge--out">Out of Stock</span>;
    if (p.lowStock) return <span className="inv-badge inv-badge--low">Low Stock</span>;
    return <span className="inv-badge inv-badge--ok">In Stock</span>;
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        {toast && <div className={`admin-toast admin-toast--${toastType}`}>{toast}</div>}
        <div className="admin-content">
          <h1 className="admin-page-title">Inventory Management</h1>
          <p className="admin-page-subtitle">Track and update your product stock levels</p>

          {lowStockCount > 0 && (
            <div className="inv-alert">
              ⚠️ <strong>{lowStockCount} product{lowStockCount > 1 ? 's are' : ' is'}</strong> running low on stock
            </div>
          )}

          <div className="inv-toolbar">
            <input
              className="inv-search"
              type="text"
              placeholder="Search by product name or category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="skeleton skeleton-table" />
          ) : (
            <div className="table-card">
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock Qty</th>
                      <th>Threshold</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div className="inv-product">
                            {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="inv-thumb" />}
                            <span>{p.name}</span>
                          </div>
                        </td>
                        <td><span className="category-badge">{p.category}</span></td>
                        <td>LKR {p.price.toLocaleString()}</td>
                        <td>
                          {editingId === p.id ? (
                            <input
                              ref={inputRef}
                              className="inv-qty-input"
                              type="number"
                              value={editValue}
                              min={0}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={() => commitEdit(p.id)}
                              onKeyDown={e => e.key === 'Enter' && commitEdit(p.id)}
                            />
                          ) : (
                            <button
                              className={`inv-qty-btn ${p.lowStock ? 'inv-qty-btn--low' : ''}`}
                              onClick={() => startEdit(p)}
                              title="Click to edit"
                            >
                              {p.stockQuantity}
                            </button>
                          )}
                        </td>
                        <td className="text-muted">{p.lowStockThreshold}</td>
                        <td>{getStatusBadge(p)}</td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={6} className="table-empty">No products found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
