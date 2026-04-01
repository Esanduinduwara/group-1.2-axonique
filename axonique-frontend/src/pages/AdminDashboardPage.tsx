import { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { authService } from '../services/authService';
import type { DashboardMetrics, UserSummary } from '../types';
import './AdminDashboardPage.css';

const API = '' + (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080') + '';


export default function AdminDashboardPage() {
  const role = authService.getRole();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const headers = { ...authService.getAuthHeader(), 'Content-Type': 'application/json' };

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/admin/dashboard/metrics`, { headers }).then(r => r.json()),
      fetch(`${API}/api/admin/users`, { headers }).then(r => r.json()),
    ]).then(([metricsData, usersData]) => {
      setMetrics(metricsData.data);
      setUsers(usersData.data || []);
    }).catch(() => showToast('Failed to load dashboard data', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 3000);
  };

  const handleRoleChange = async (userId: number, role: string) => {
    try {
      const res = await fetch(`${API}/api/admin/users/${userId}/role?role=${role}`, {
        method: 'PUT', headers,
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
        showToast('Role updated successfully');
      } else {
        showToast('Failed to update role', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      const res = await fetch(`${API}/api/admin/users/${userId}`, {
        method: 'DELETE', headers,
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        showToast('User deleted successfully');
      } else {
        showToast(data.message || 'Failed to delete user', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  // Chart helpers
  const last6Months = metrics?.revenueByMonth?.slice(0, 6).reverse() ?? [];
  const maxRevenue = Math.max(...last6Months.map(m => m.revenue), 1);

  const statusColors: Record<string, string> = {
    PENDING: '#888', PROCESSING: '#3498db', SHIPPED: '#f39c12', DELIVERED: '#27ae60',
  };
  const statusEntries = Object.entries(metrics?.ordersByStatus ?? {});
  const totalOrders = statusEntries.reduce((s, [, v]) => s + v, 0);
  let cumulativeAngle = 0;
  const conicParts = statusEntries.map(([status, count]) => {
    const pct = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
    const part = `${statusColors[status] ?? '#555'} ${cumulativeAngle}% ${cumulativeAngle + pct}%`;
    cumulativeAngle += pct;
    return part;
  }).join(', ');

  const pagedUsers = users.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        {/* Toast */}
        {toast && <div className={`admin-toast admin-toast--${toastType}`}>{toast}</div>}

        <div className="admin-content">
          <h1 className="admin-page-title">Admin Dashboard</h1>
          <p className="admin-page-subtitle">Command center — full platform visibility</p>

          {loading ? (
            <div className="admin-skeleton-grid">
              {[1, 2, 3, 4].map(i => <div key={i} className="skeleton skeleton-card" />)}
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-icon">💰</div>
                  {role === 'ADMIN' && (
                    <>
                      <div className="kpi-value">LKR {metrics?.totalRevenue?.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</div>
                      <div className="kpi-label">Total Revenue</div>
                    </>
                  )}
                  {role === 'STAFF' && (
                    <>
                      <div className="kpi-value">***</div>
                      <div className="kpi-label">Revenue (Hidden)</div>
                    </>
                  )}
                </div>
                <div className="kpi-card">
                  <div className="kpi-icon">📦</div>
                  <div className="kpi-value">{metrics?.totalOrders}</div>
                  <div className="kpi-label">Total Orders</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-icon">🛍️</div>
                  <div className="kpi-value">{metrics?.totalProducts}</div>
                  <div className="kpi-label">Total Products</div>
                </div>
                <div className="kpi-card kpi-card--profit">
                  <div className="kpi-icon">📈</div>
                  {role === 'ADMIN' && (
                    <>
                      <div className="kpi-value">LKR {metrics?.estimatedProfit?.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</div>
                      <div className="kpi-label">Estimated Profit</div>
                    </>
                  )}
                  {role === 'STAFF' && (
                    <>
                      <div className="kpi-value">***</div>
                      <div className="kpi-label">Profit (Hidden)</div>
                    </>
                  )}
                </div>
              </div>

              <div className="charts-row">
                {/* Bar Chart */}
                {role === 'ADMIN' && (
                  <div className="chart-card">
                    <h2 className="chart-title">Revenue vs Cost (Last 6 Months)</h2>
                    {last6Months.length === 0 ? (
                      <p className="chart-empty">No data available</p>
                    ) : (
                      <div className="bar-chart">
                        {last6Months.map((m) => {
                          const cost = m.revenue * 0.6;
                          const revH = (m.revenue / maxRevenue) * 100;
                          const costH = (cost / maxRevenue) * 100;
                          return (
                            <div key={m.month} className="bar-group">
                              <div className="bars">
                                <div className="bar bar--revenue" style={{ height: `${revH}%` }} title={`Revenue: ${m.revenue}`} />
                                <div className="bar bar--cost" style={{ height: `${costH}%` }} title={`Cost: ${cost.toFixed(0)}`} />
                              </div>
                              <div className="bar-label">{m.month.slice(5)}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="chart-legend">
                      <span className="legend-dot" style={{ background: '#fff' }} /> Revenue
                      <span className="legend-dot" style={{ background: '#555', marginLeft: '1rem' }} /> Cost
                    </div>
                  </div>
                )}

                {/* Doughnut Chart */}
                <div className="chart-card">
                  <h2 className="chart-title">Orders by Status</h2>
                  {totalOrders === 0 ? (
                    <p className="chart-empty">No orders yet</p>
                  ) : (
                    <>
                      <div
                        className="doughnut"
                        style={{ background: `conic-gradient(${conicParts})` }}
                        aria-label="Orders by status chart"
                      />
                      <div className="doughnut-legend">
                        {statusEntries.map(([status, count]) => (
                          <div key={status} className="legend-item">
                            <span className="legend-dot" style={{ background: statusColors[status] }} />
                            <span>{status}</span>
                            <span className="legend-count">{count}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Users Table */}
              {role === 'ADMIN' && (
                <div className="table-card">
                  <h2 className="chart-title">User Management</h2>
                  <div className="table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Username</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedUsers.map(u => (
                          <tr key={u.id}>
                            <td>{u.username}</td>
                            <td className="text-muted">{u.email}</td>
                            <td>
                              <select
                                className="role-select"
                                value={u.role}
                                onChange={e => handleRoleChange(u.id, e.target.value)}
                              >
                                <option value="CUSTOMER">CUSTOMER</option>
                                <option value="STAFF">STAFF</option>
                                <option value="ADMIN">ADMIN</option>
                              </select>
                            </td>
                            <td>
                              <span className={`status-badge ${u.enabled ? 'status-badge--active' : 'status-badge--disabled'}`}>
                                {u.enabled ? 'Active' : 'Disabled'}
                              </span>
                            </td>
                            <td>
                              <button
                                className="pm-action-btn pm-action-btn--danger"
                                onClick={() => handleDeleteUser(u.id)}
                                disabled={authService.getUser()?.username === u.username}
                              >
                                🗑️ Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="pagination">
                    <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
                    <span>Page {page + 1} of {Math.max(1, Math.ceil(users.length / pageSize))}</span>
                    <button disabled={(page + 1) * pageSize >= users.length} onClick={() => setPage(p => p + 1)}>Next →</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
