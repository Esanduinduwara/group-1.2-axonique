import { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { authService } from '../services/authService';
import type { Order } from '../types';
import './OrderManagementPage.css';

const API = '' + (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080') + '';
const PAGE_SIZE = 10;

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#888',
  CONFIRMED: '#3498db',
  SHIPPED: '#f39c12',
  DELIVERED: '#27ae60',
  CANCELLED: '#e74c3c',
};

type Status = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export default function OrderManagementPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [flashRow, setFlashRow] = useState<number | null>(null);

  const headers = { ...authService.getAuthHeader(), 'Content-Type': 'application/json' };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchOrders = useCallback((q = '') => {
    setLoading(true);
    const url = q ? `${API}/api/orders?search=${encodeURIComponent(q)}` : `${API}/api/orders`;
    fetch(url, { headers })
      .then(r => r.json())
      .then(d => setOrders(d.data || []))
      .catch(() => showToast('Failed to load orders', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchOrders(); }, []);

  useEffect(() => {
    const t = setTimeout(() => { fetchOrders(search); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // FIXED: Added .toUpperCase() and secondary state sync for the Detail Modal
  const updateStatus = async (orderId: number, status: Status) => {
    try {
      const normalizedStatus = status.toUpperCase() as Status;
      const res = await fetch(`${API}/api/orders/${orderId}/status?status=${normalizedStatus}`, {
        method: 'PATCH', 
        headers,
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Update the main list
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: normalizedStatus } : o));
        
        // Update the modal if it's currently showing the edited order
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, status: normalizedStatus } : null);
        }

        setFlashRow(orderId);
        setTimeout(() => setFlashRow(null), 1200);
        showToast('Order status updated');
      } else {
        showToast(data.message || 'Failed to update status', 'error');
      }
    } catch { 
      showToast('Network error', 'error'); 
    }
  };

  const paged = orders.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));

  const openDetail = (order: Order) => {
    fetch(`${API}/api/orders/${order.id}`, { headers })
      .then(r => r.json())
      .then(d => setSelectedOrder(d.data));
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        {toast && <div className={`admin-toast admin-toast--${toastType}`}>{toast}</div>}

        {selectedOrder && (
          <div className="om-modal-overlay" onClick={() => setSelectedOrder(null)}>
            <div className="om-modal" onClick={e => e.stopPropagation()}>
              <div className="om-modal__header">
                <h2>Order #{selectedOrder.id}</h2>
                <button className="om-modal__close" onClick={() => setSelectedOrder(null)}>✕</button>
              </div>
              <div className="om-modal__body">
                <div className="om-detail-grid">
                  <div><span className="om-detail-label">Customer</span><span>{selectedOrder.customerName}</span></div>
                  <div><span className="om-detail-label">Email</span><span>{selectedOrder.customerEmail}</span></div>
                  <div><span className="om-detail-label">Address</span><span>{selectedOrder.deliveryAddress}</span></div>
                  <div><span className="om-detail-label">Status</span>
                    <span className="om-status-pill" style={{ background: `${STATUS_COLORS[selectedOrder.status]}22`, color: STATUS_COLORS[selectedOrder.status] }}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div><span className="om-detail-label">Subtotal</span><span>LKR {selectedOrder.subtotal?.toLocaleString()}</span></div>
                  <div><span className="om-detail-label">Shipping</span><span>LKR {selectedOrder.shippingFee?.toLocaleString()}</span></div>
                  <div><span className="om-detail-label">Total</span><span className="om-total">LKR {selectedOrder.total?.toLocaleString()}</span></div>
                  <div><span className="om-detail-label">Date</span><span>{new Date(selectedOrder.createdAt).toLocaleDateString()}</span></div>
                </div>
                <h3 className="om-items-title">Items</h3>
                <table className="admin-table om-items-table">
                  <thead><tr><th>Product</th><th>Category</th><th>Size</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
                  <tbody>
                    {selectedOrder.items?.map(item => (
                      <tr key={item.id}>
                        <td>{item.productName}</td>
                        <td className="text-muted">{item.productCategory}</td>
                        <td>{item.selectedSize}</td>
                        <td>{item.quantity}</td>
                        <td>LKR {item.unitPrice?.toLocaleString()}</td>
                        <td>LKR {item.lineTotal?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="admin-content">
          <h1 className="admin-page-title">Order Management</h1>
          <p className="admin-page-subtitle">View, search and update all customer orders</p>

          <div className="om-toolbar">
            <input
              className="inv-search"
              type="text"
              placeholder="Search by customer name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="skeleton skeleton-table" style={{ height: 300 }} />
          ) : (
            <div className="table-card">
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Email</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map(o => (
                      <tr
                        key={o.id}
                        className={`om-row ${flashRow === o.id ? 'om-row--flash' : ''}`}
                        onClick={() => openDetail(o)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td><span className="om-id">#{o.id}</span></td>
                        <td>{o.customerName}</td>
                        <td className="text-muted">{o.customerEmail}</td>
                        <td className="text-muted">{new Date(o.createdAt).toLocaleDateString()}</td>
                        <td>LKR {o.total.toLocaleString()}</td>
                        <td>
                          <span className="om-status-pill" style={{ background: `${STATUS_COLORS[o.status]}22`, color: STATUS_COLORS[o.status], border: `1px solid ${STATUS_COLORS[o.status]}44` }}>
                            {o.status}
                          </span>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <select
                            className="role-select"
                            value={o.status}
                            onChange={e => updateStatus(o.id, e.target.value as Status)}
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="SHIPPED">SHIPPED</option>
                            <option value="DELIVERED">DELIVERED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {paged.length === 0 && (
                      <tr><td colSpan={7} className="table-empty">No orders found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span>Page {page + 1} of {totalPages} ({orders.length} orders)</span>
                <button disabled={(page + 1) * PAGE_SIZE >= orders.length} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}