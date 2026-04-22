import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { authService } from '../services/authService';
import type { StaffActivity, Product } from '../types';
import './StaffDashboardPage.css';

const API = ''+(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080')+'';

function timeAgo(dateStr: string | null) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#888', PROCESSING: '#3498db', SHIPPED: '#f39c12', DELIVERED: '#27ae60',
};

export default function StaffDashboardPage() {
  const navigate = useNavigate();
  const [activity, setActivity] = useState<StaffActivity | null>(null);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const headers = authService.getAuthHeader();

  const fetchData = () => {
    Promise.all([
      fetch(`${API}/api/staff/activity`, { headers }).then(r => r.json()),
      fetch(`${API}/api/staff/low-stock`, { headers }).then(r => r.json()),
    ]).then(([actData, lsData]) => {
      setActivity(actData.data);
      setLowStock(lsData.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const pendingCount = activity?.recentOrders?.filter(o => o.status === 'PENDING').length ?? 0;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = activity?.recentOrders?.filter(o => o.createdAt?.startsWith(todayStr)).length ?? 0;

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <main className="admin-main">
          <div className="staff-skeleton-grid">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton skeleton-card" />)}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-content">
          <h1 className="admin-page-title">Staff Operations Hub</h1>
          <p className="admin-page-subtitle">Real-time activity feed and alerts</p>

          {/* Mini KPI */}
          <div className="staff-kpi-row">
            <div className="staff-kpi">
              <div className="staff-kpi__value">{todayCount}</div>
              <div className="staff-kpi__label">Today's Orders</div>
            </div>
            <div className="staff-kpi">
              <div className="staff-kpi__value">{pendingCount}</div>
              <div className="staff-kpi__label">Pending Orders</div>
            </div>
            <div className="staff-kpi staff-kpi--alert">
              <div className="staff-kpi__value">{lowStock.length}</div>
              <div className="staff-kpi__label">Low Stock Items</div>
            </div>
          </div>

          <div className="staff-grid">
            {/* Left column */}
            <div className="staff-col">
              {/* Recent Orders */}
              <div className="staff-card">
                <h2 className="staff-card__title">📦 Recent Orders</h2>
                <div className="staff-feed">
                  {activity?.recentOrders?.length === 0 && (
                    <p className="staff-empty">No recent orders</p>
                  )}
                  {activity?.recentOrders?.map(o => (
                    <div key={o.id} className="staff-feed__item">
                      <div className="staff-feed__left">
                        <span className="staff-feed__id">#{o.id}</span>
                        <span className="staff-feed__name">{o.customerName}</span>
                      </div>
                      <div className="staff-feed__right">
                        <span className="staff-feed__total">LKR {o.total.toLocaleString()}</span>
                        <span className="staff-status-pill" style={{ background: `${STATUS_COLORS[o.status]}22`, color: STATUS_COLORS[o.status], border: `1px solid ${STATUS_COLORS[o.status]}44` }}>
                          {o.status}
                        </span>
                        <span className="staff-feed__time">{timeAgo(o.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Registrations */}
              <div className="staff-card">
                <h2 className="staff-card__title">👋 Recent Registrations</h2>
                <div className="staff-feed">
                  {activity?.recentRegistrations?.length === 0 && (
                    <p className="staff-empty">No recent registrations</p>
                  )}
                  {activity?.recentRegistrations?.map(r => (
                    <div key={r.id} className="staff-feed__item">
                      <div className="staff-feed__left">
                        <span className="staff-feed__name">{r.username}</span>
                        <span className="staff-feed__sub">{r.email}</span>
                      </div>
                      <span className="staff-feed__time">{timeAgo(r.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="staff-col">
              {/* Low Stock Widget */}
              <div className="staff-card">
                <h2 className="staff-card__title">⚠️ Low Stock Alerts</h2>
                {lowStock.length === 0 ? (
                  <p className="staff-empty">All stock levels are healthy ✓</p>
                ) : (
                  <div className="staff-stock-list">
                    {lowStock.map(p => {
                      const pct = p.lowStockThreshold > 0 ? Math.min(100, (p.stockQuantity / p.lowStockThreshold) * 100) : 0;
                      return (
                        <div key={p.id} className="staff-stock-item">
                          <div className="staff-stock-header">
                            <span className="staff-stock-name">{p.name}</span>
                            <span className="staff-stock-count">{p.stockQuantity} left</span>
                          </div>
                          <div className="staff-stock-bar">
                            <div className="staff-stock-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="staff-stock-meta">
                            Threshold: {p.lowStockThreshold} — {p.category}
                          </div>
                        </div>
                      );
                    })}
                    <button className="staff-link-btn" onClick={() => navigate('/admin/inventory')}>
                      Manage Inventory →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
