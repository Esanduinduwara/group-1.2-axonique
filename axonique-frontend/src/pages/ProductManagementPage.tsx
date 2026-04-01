import { useState, useEffect, useRef } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { authService } from '../services/authService';
import type { Product } from '../types';
import './ProductManagementPage.css';

const API = '' + (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080') + '';

const BADGES = ['', 'New', 'Featured', 'Limited'];

interface ProductFormData {
  name: string;
  category: string;
  price: string;
  desc: string;
  imageUrl: string;
  emoji: string;
  badge: string;
  in_stock: boolean;
  stockQuantity: string;
  lowStockThreshold: string;
  sizes: string;
}

const emptyForm = (): ProductFormData => ({
  name: '', category: '', price: '', desc: '', imageUrl: '',
  emoji: '', badge: '', in_stock: true, stockQuantity: '0',
  lowStockThreshold: '5', sizes: 'XS,S,M,L,XL,XXL',
});

export default function ProductManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm());
  const [deleteModal, setDeleteModal] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const imageFileRef = useRef<HTMLInputElement>(null);

  const headers = { ...authService.getAuthHeader(), 'Content-Type': 'application/json' };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 3000);
  };

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/api/products`, { headers }).then(r => r.json()),
      fetch(`${API}/api/products/categories`).then(r => r.json()),
    ]).then(([pData, cData]) => {
      setProducts(pData.data || []);
      setCategories(cData.data || []);
    }).catch(() => showToast('Failed to load products', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = products.filter(p => {
    const s = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(s) || p.category.toLowerCase().includes(s);
    const matchCat = !catFilter || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const setField = (k: keyof ProductFormData, v: string | boolean) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const openAdd = () => { setEditId(null); setForm(emptyForm()); setShowForm(true); };
  const openEdit = (p: Product) => {
    setEditId(p.id);
    setForm({
      name: p.name, category: p.category, price: String(p.price),
      desc: p.desc || '', imageUrl: p.imageUrl || '', emoji: p.emoji || '',
      badge: p.badge || '', in_stock: p.inStock ?? true,
      stockQuantity: String(p.stockQuantity ?? 0),
      lowStockThreshold: String(p.lowStockThreshold ?? 5),
      sizes: p.sizes?.join(',') || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      name: form.name, category: form.category, price: parseFloat(form.price),
      desc: form.desc, imageUrl: form.imageUrl, emoji: form.emoji,
      badge: form.badge || null, in_stock: form.in_stock,
      stockQuantity: parseInt(form.stockQuantity) || 0,
      lowStockThreshold: parseInt(form.lowStockThreshold) || 5,
      sizes: form.sizes.split(',').map(s => s.trim()).filter(Boolean),
    };
    try {
      const url = editId ? `${API}/api/products/${editId}` : `${API}/api/products`;
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success || data.data) {
        showToast(editId ? 'Product updated' : 'Product created');
        setShowForm(false);
        load();
      } else {
        showToast(data.message || 'Save failed', 'error');
      }
    } catch { showToast('Network error', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (p: Product) => {
    try {
      const res = await fetch(`${API}/api/products/${p.id}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (data.success) {
        showToast('Product deleted');
        setDeleteModal(null);
        load();
      } else {
        showToast(data.message || 'Delete failed — product may have linked orders', 'error');
        setDeleteModal(null);
      }
    } catch { showToast('Network error', 'error'); setDeleteModal(null); }
  };

  const toggleStock = async (p: Product) => {
    const updatedPayload = {
      name: p.name, category: p.category, price: p.price,
      desc: p.desc, imageUrl: p.imageUrl, emoji: p.emoji,
      badge: p.badge, in_stock: !p.inStock,
      stockQuantity: p.stockQuantity, lowStockThreshold: p.lowStockThreshold,
      sizes: p.sizes,
    };
    try {
      await fetch(`${API}/api/products/${p.id}`, {
        method: 'PUT', headers, body: JSON.stringify(updatedPayload)
      });
      setProducts(prev => prev.map(pr => pr.id === p.id ? { ...pr, inStock: !p.inStock } : pr));
    } catch { showToast('Toggle failed', 'error'); }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        {toast && <div className={`admin-toast admin-toast--${toastType}`}>{toast}</div>}

        {/* Delete Confirm Modal */}
        {deleteModal && (
          <div className="om-modal-overlay" onClick={() => setDeleteModal(null)}>
            <div className="pm-confirm" onClick={e => e.stopPropagation()}>
              <h3>Delete Product?</h3>
              <p>Are you sure you want to delete <strong>{deleteModal.name}</strong>? This cannot be undone.</p>
              <div className="pm-confirm__actions">
                <button className="pm-btn pm-btn--danger" onClick={() => handleDelete(deleteModal)}>Delete</button>
                <button className="pm-btn pm-btn--ghost" onClick={() => setDeleteModal(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Product Form Panel */}
        {showForm && (
          <div className="pm-panel-overlay" onClick={() => setShowForm(false)}>
            <div className="pm-panel" onClick={e => e.stopPropagation()}>
              <div className="pm-panel__header">
                <h2>{editId ? 'Edit Product' : 'Add New Product'}</h2>
                <button className="om-modal__close" onClick={() => setShowForm(false)}>✕</button>
              </div>
              <form className="pm-form" onSubmit={handleSubmit}>
                <div className="pm-form-grid">
                  <div className="form-group">
                    <label>Name *</label>
                    <input required value={form.name} onChange={e => setField('name', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Category *</label>
                    <input list="category-list" required value={form.category} onChange={e => setField('category', e.target.value)} />
                    <datalist id="category-list">
                      {categories.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                  <div className="form-group">
                    <label>Price (LKR) *</label>
                    <input type="number" min="0" step="0.01" required value={form.price} onChange={e => setField('price', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Badge</label>
                    <select value={form.badge} onChange={e => setField('badge', e.target.value)}>
                      {BADGES.map(b => <option key={b} value={b}>{b || 'None'}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Emoji</label>
                    <input maxLength={2} value={form.emoji} onChange={e => setField('emoji', e.target.value)} placeholder="👕" />
                  </div>
                  <div className="form-group">
                    <label>Stock Quantity</label>
                    <input type="number" min="0" value={form.stockQuantity} onChange={e => setField('stockQuantity', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Low Stock Threshold</label>
                    <input type="number" min="0" value={form.lowStockThreshold} onChange={e => setField('lowStockThreshold', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Sizes (comma-separated)</label>
                    <input value={form.sizes} onChange={e => setField('sizes', e.target.value)} placeholder="XS,S,M,L,XL,XXL" />
                  </div>
                  <div className="form-group pm-form-full">
                    <label>Image URL or File</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        style={{ flex: 1 }}
                        value={form.imageUrl.startsWith('data:') ? '' : form.imageUrl}
                        onChange={e => setField('imageUrl', e.target.value)}
                        placeholder="https://..."
                      />
                      <button
                        type="button"
                        className="pm-btn pm-btn--ghost"
                        style={{ whiteSpace: 'nowrap' }}
                        onClick={() => imageFileRef.current?.click()}
                      >
                        📁 Browse file
                      </button>
                      <input
                        ref={imageFileRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => setField('imageUrl', reader.result as string);
                          reader.readAsDataURL(file);
                          e.target.value = '';
                        }}
                      />
                    </div>
                    {form.imageUrl && (
                      <div style={{ marginTop: 8 }}>
                        <img src={form.imageUrl} alt="preview" style={{ maxHeight: 80, borderRadius: 6, objectFit: 'cover' }}
                          onError={e => (e.currentTarget.style.display = 'none')} />
                      </div>
                    )}
                  </div>
                  <div className="form-group pm-form-full">
                    <label>Description</label>
                    <textarea rows={3} value={form.desc} onChange={e => setField('desc', e.target.value)} />
                  </div>
                  <div className="form-group pm-checkbox-group">
                    <label>
                      <input type="checkbox" checked={form.in_stock} onChange={e => setField('in_stock', e.target.checked)} />
                      In Stock
                    </label>
                  </div>
                </div>
                <div className="pm-form-actions">
                  <button type="submit" className="pm-btn pm-btn--primary" disabled={submitting}>
                    {submitting ? 'Saving...' : (editId ? 'Update Product' : 'Create Product')}
                  </button>
                  <button type="button" className="pm-btn pm-btn--ghost" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="admin-content">
          <div className="pm-header">
            <div>
              <h1 className="admin-page-title">Product Management</h1>
              <p className="admin-page-subtitle">Create, edit and manage the product catalogue</p>
            </div>
            <button className="pm-btn pm-btn--primary" onClick={openAdd}>+ Add Product</button>
          </div>

          <div className="pm-toolbar">
            <input
              className="inv-search"
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="pm-cat-filter"
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="skeleton skeleton-table" style={{ height: 300 }} />
          ) : (
            <div className="table-card">
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Badge</th>
                      <th>In Stock</th>
                      <th>Actions</th>
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
                        <td>LKR {Number(p.price).toLocaleString()}</td>
                        <td className={p.lowStock ? 'text-warning' : ''}>{p.stockQuantity}</td>
                        <td>{p.badge ? <span className="pm-badge-label">{p.badge}</span> : <span className="text-muted">—</span>}</td>
                        <td>
                          <input
                            type="checkbox"
                            className="pm-stock-toggle"
                            checked={p.inStock}
                            onChange={() => toggleStock(p)}
                          />
                        </td>
                        <td>
                          <div className="pm-actions">
                            <button className="pm-action-btn" onClick={() => openEdit(p)}>✏️ Edit</button>
                            <button className="pm-action-btn pm-action-btn--danger" onClick={() => setDeleteModal(p)}>🗑️ Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={7} className="table-empty">No products found</td></tr>
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
