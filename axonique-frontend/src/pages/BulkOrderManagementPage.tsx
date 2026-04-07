import { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { authService } from '../services/authService';
import './OrderManagementPage.css';

const API = '' + (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080') + '';
const PAGE_SIZE = 10;

const BULK_STATUS_COLORS: Record<string, string> = {
  PENDING: '#888',
  CONFIRMED: '#3498db',
  SHIPPED: '#f39c12',
  DELIVERED: '#27ae60',
  CANCELLED: '#e74c3c',
};

type BulkStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

interface BulkOrderItem {
  id: number;
  productId: number;
  productName: string;
  selectedSize: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface BulkOrder {
  id: number;
  ref: string;
  companyName: string;
  contactPerson: string;
  contactEmail: string;
  deliveryAddress: string;
  notes: string;
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  total: number;
  status: BulkStatus;
  createdAt: string;
  updatedAt: string;
  items: BulkOrderItem[];
}

export default function BulkOrderManagementPage() {
  const [bulkOrders, setBulkOrders] = useState<BulkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [selectedBulkOrder, setSelectedBulkOrder] = useState<BulkOrder | null>(null);
  const [flashRow, setFlashRow] = useState<number | null>(null);

  const headers = { ...authService.getAuthHeader(), 'Content-Type': 'application/json' };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchBulkOrders = useCallback((q = '') => {
    setLoading(true);
    const url = `${API}/api/bulk-orders/all`;
    console.log('Fetching from:', url, 'Headers:', headers);
    fetch(url, { headers })
      .then(r => {
        console.log('Response status:', r.status);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        console.log('Response data:', d);
        const orders = Array.isArray(d.data) ? d.data : (d.data ? [d.data] : []);
        console.log('Parsed orders:', orders);
        if (q) {
          const filtered = orders.filter((o: BulkOrder) =>
            o.ref.toLowerCase().includes(q.toLowerCase()) ||
            o.companyName.toLowerCase().includes(q.toLowerCase()) ||
            o.contactEmail.toLowerCase().includes(q.toLowerCase())
          );
          setBulkOrders(filtered);
        } else {
          setBulkOrders(orders);
        }
      })
      .catch((err) => {
        console.error('Failed to load bulk orders:', err);
        showToast('Failed to load bulk orders', 'error');
        setBulkOrders([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchBulkOrders(); }, []);

  useEffect(() => {
    const t = setTimeout(() => { fetchBulkOrders(search); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const updateStatus = async (orderId: number, status: BulkStatus) => {
    try {
      const normalizedStatus = status.toUpperCase() as BulkStatus;
      const res = await fetch(`${API}/api/bulk-orders/${orderId}/status?status=${normalizedStatus}`, {
        method: 'PATCH', 
        headers,
      });
      console.log('Update status response:', res.status);
      const data = await res.json();
      console.log('Update response data:', data);
      if (data.success) {
        setFlashRow(orderId);
        setTimeout(() => setFlashRow(null), 500);
        fetchBulkOrders(search);
        showToast('Status updated successfully');
      } else {
        showToast(data.message || 'Failed to update status', 'error');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Network error', 'error');
    }
  };

  const openDetail = (order: BulkOrder) => {
    console.log('Opening detail for order:', order.id);
    fetch(`${API}/api/bulk-orders/${order.id}`, { headers })
      .then(r => {
        console.log('Detail fetch response:', r.status);
        return r.json();
      })
      .then(d => {
        console.log('Detail data:', d);
        setSelectedBulkOrder(d.data);
      })
      .catch(err => console.error('Error fetching detail:', err));
  };

  const paged = bulkOrders.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(bulkOrders.length / PAGE_SIZE);

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        {toast && <div className={`admin-toast admin-toast--${toastType}`}>{toast}</div>}

        {selectedBulkOrder && (
          <div className="om-modal-overlay" onClick={() => setSelectedBulkOrder(null)}>
            <div className="om-modal" onClick={e => e.stopPropagation()}>
              <div className="om-modal__header">
                <h2>Bulk Order #{selectedBulkOrder.ref}</h2>
                <button className="om-modal__close" onClick={() => setSelectedBulkOrder(null)}>✕</button>
              </div>
              <div className="om-modal__body">
                <div className="om-detail-grid">
                  <div><span className="om-detail-label">Company</span><span>{selectedBulkOrder.companyName}</span></div>
                  <div><span className="om-detail-label">Contact Person</span><span>{selectedBulkOrder.contactPerson}</span></div>
                  <div><span className="om-detail-label">Email</span><span>{selectedBulkOrder.contactEmail}</span></div>
                  <div><span className="om-detail-label">Delivery Address</span><span>{selectedBulkOrder.deliveryAddress}</span></div>
                  <div><span className="om-detail-label">Items</span><span>{selectedBulkOrder.itemCount} items</span></div>
                  <div><span className="om-detail-label">Subtotal</span><span>LKR {selectedBulkOrder.subtotal.toLocaleString()}</span></div>
                  <div><span className="om-detail-label">Discount</span><span>LKR {selectedBulkOrder.discountAmount.toLocaleString()}</span></div>
                  <div><span className="om-detail-label">Total</span><span>LKR {selectedBulkOrder.total.toLocaleString()}</span></div>
                  <div><span className="om-detail-label">Status</span><span>{selectedBulkOrder.status}</span></div>
                  <div><span className="om-detail-label">Created</span><span>{new Date(selectedBulkOrder.createdAt).toLocaleDateString()}</span></div>
                </div>

                {selectedBulkOrder.notes && (
                  <div className="om-detail-section">
                    <h4>Notes</h4>
                    <p>{selectedBulkOrder.notes}</p>
                  </div>
                )}

                {selectedBulkOrder.items && selectedBulkOrder.items.length > 0 && (
                  <div className="om-detail-section">
                    <h4>Order Items</h4>
                    <table className="om-items-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Size</th>
                          <th>Qty</th>
                          <th>Unit Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBulkOrder.items.map(item => (
                          <tr key={item.id}>
                            <td>{item.productName}</td>
                            <td>{item.selectedSize}</td>
                            <td>{item.quantity}</td>
                            <td>LKR {item.unitPrice.toLocaleString()}</td>
                            <td>LKR {item.lineTotal.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="admin-content">
          <h1 className="admin-page-title">Bulk Order Management</h1>
          <p className="admin-page-subtitle">View, search and update all bulk customer orders</p>

          <div className="om-toolbar">
            <input
              className="inv-search"
              type="text"
              placeholder="Search by reference, company name or email..."
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
                      <th>Reference</th>
                      <th>Company</th>
                      <th>Contact</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map(order => (
                      <tr key={order.id} className={flashRow === order.id ? 'table-row--flash' : ''}>
                        <td className="text-mono">{order.ref}</td>
                        <td>{order.companyName}</td>
                        <td className="text-muted">{order.contactPerson}</td>
                        <td>{order.itemCount}</td>
                        <td>LKR {order.total.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</td>
                        <td>
                          <select
                            className="om-status-select"
                            value={order.status}
                            onChange={e => updateStatus(order.id, e.target.value as BulkStatus)}
                            style={{
                              borderBottomColor: BULK_STATUS_COLORS[order.status] ?? '#555',
                            }}
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="SHIPPED">SHIPPED</option>
                            <option value="DELIVERED">DELIVERED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </td>
                        <td className="text-muted">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="om-action-btn om-action-btn--info"
                            onClick={() => openDetail(order)}
                          >
                            👁️ View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span>Page {page + 1} of {Math.max(1, totalPages)}</span>
                <button disabled={(page + 1) * PAGE_SIZE >= bulkOrders.length} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
