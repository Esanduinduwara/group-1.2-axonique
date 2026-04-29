import { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { authService } from '../services/authService';
import type { DashboardMetrics, UserSummary } from '../types';
import './AdminDashboardPage.css';

const API = '' + (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080') + '';
const HIDDEN_ADMIN_EMAILS = new Set(['admin@axonique.com', 'admin_now@axonique.com']);


export default function AdminDashboardPage() {
  const role = authService.getRole();
  const currentUser = authService.getUser();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [page, setPage] = useState(0);
  const [showAddRetailerModal, setShowAddRetailerModal] = useState(false);
  const [retailerForm, setRetailerForm] = useState({ username: '', email: '', password: '' });
  const [retailerErrors, setRetailerErrors] = useState<Record<string, string>>({});
  const [isSubmittingRetailer, setIsSubmittingRetailer] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({ username: '', email: '', password: '' });
  const [staffErrors, setStaffErrors] = useState<Record<string, string>>({});
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);
  const pageSize = 10;

  const headers = { ...authService.getAuthHeader(), 'Content-Type': 'application/json' };

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/admin/dashboard/metrics`, { headers }).then(r => r.json()),
      fetch(`${API}/api/admin/users`, { headers }).then(r => r.json()),
    ]).then(([metricsData, usersData]) => {
      setMetrics(metricsData.data);
      const safeUsers = (usersData.data || []).filter((u: UserSummary) =>
        u.role !== 'ADMIN' && !HIDDEN_ADMIN_EMAILS.has(u.email.toLowerCase())
      );
      setUsers(safeUsers);
    }).catch(() => showToast('Failed to load dashboard data', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 3000);
  };

  const validateRetailerForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!retailerForm.username) errors.username = 'Username required';
    else if (retailerForm.username.length < 3) errors.username = 'Username too short';
    if (!retailerForm.email) errors.email = 'Email required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(retailerForm.email)) errors.email = 'Invalid email';
    if (!retailerForm.password) errors.password = 'Password required';
    else if (retailerForm.password.length < 6) errors.password = 'Password too short';
    
    setRetailerErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStaffForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!staffForm.username) errors.username = 'Username required';
    else if (staffForm.username.length < 3) errors.username = 'Username too short';
    if (!staffForm.email) errors.email = 'Email required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(staffForm.email)) errors.email = 'Invalid email';
    if (!staffForm.password) errors.password = 'Password required';
    else if (staffForm.password.length < 6) errors.password = 'Password too short';
    
    setStaffErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddRetailer = async () => {
    if (!validateRetailerForm()) return;
    
    setIsSubmittingRetailer(true);
    try {
      const res = await fetch(`${API}/api/admin/retailers`, {
        method: 'POST',
        headers,
        body: JSON.stringify(retailerForm),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        setUsers(prev => [...prev, data.data]);
        setShowAddRetailerModal(false);
        setRetailerForm({ username: '', email: '', password: '' });
        setRetailerErrors({});
        showToast('Retailer created successfully');
      } else {
        showToast(data.message || 'Failed to create retailer', 'error');
      }
    } catch (err) {
      console.error('Error creating retailer:', err);
      showToast('Network error', 'error');
    } finally {
      setIsSubmittingRetailer(false);
    }
  };

  const handleAddStaff = async () => {
    if (!validateStaffForm()) return;
    
    setIsSubmittingStaff(true);
    try {
      const res = await fetch(`${API}/api/admin/staff`, {
        method: 'POST',
        headers,
        body: JSON.stringify(staffForm),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        setUsers(prev => [...prev, data.data]);
        setShowAddStaffModal(false);
        setStaffForm({ username: '', email: '', password: '' });
        setStaffErrors({});
        showToast('Staff member created successfully');
      } else {
        showToast(data.message || 'Failed to create staff member', 'error');
      }
    } catch (err) {
      console.error('Error creating staff:', err);
      showToast('Network error', 'error');
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  const handleRoleChange = async (userId: number, role: string) => {
    if (role === 'ADMIN') {
      showToast('Promoting users to ADMIN is restricted by policy', 'error');
      return;
    }

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
    PENDING_VERIFICATION: '#8e44ad',
    PENDING: '#888',
    CONFIRMED: '#3498db',
    PROCESSING: '#3498db',
    SHIPPED: '#f39c12',
    DELIVERED: '#27ae60',
    CANCELLED: '#e74c3c',
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
  const isCurrentSessionUser = (user: UserSummary) =>
    !!currentUser && (
      currentUser.username.toLowerCase() === user.username.toLowerCase()
      || currentUser.email.toLowerCase() === user.email.toLowerCase()
    );

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
                
                {/* Bulk Orders KPIs */}
                <div className="kpi-card">
                  <div className="kpi-icon">📊</div>
                  <div className="kpi-value">{metrics?.totalBulkOrders || 0}</div>
                  <div className="kpi-label">Bulk Orders</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-icon">💳</div>
                  {role === 'ADMIN' && (
                    <>
                      <div className="kpi-value">LKR {metrics?.totalBulkRevenue?.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</div>
                      <div className="kpi-label">Bulk Revenue</div>
                    </>
                  )}
                  {role === 'STAFF' && (
                    <>
                      <div className="kpi-value">***</div>
                      <div className="kpi-label">Bulk Revenue (Hidden)</div>
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
                
                {/* Bulk Orders Chart */}
                <div className="chart-card">
                  <h2 className="chart-title">Bulk Orders by Status</h2>
                  {!metrics?.totalBulkOrders || metrics.totalBulkOrders === 0 ? (
                    <p className="chart-empty">No bulk orders yet</p>
                  ) : (
                    <>
                      {(() => {
                        const bulkStatusEntries = Object.entries(metrics?.bulkOrdersByStatus ?? {});
                        const totalBulkOrders = bulkStatusEntries.reduce((s, [, v]) => s + v, 0);
                        let cumulativeAngle = 0;
                        const bulkConicParts = bulkStatusEntries.map(([status, count]) => {
                          const pct = totalBulkOrders > 0 ? (count / totalBulkOrders) * 100 : 0;
                          const part = `${statusColors[status] ?? '#555'} ${cumulativeAngle}% ${cumulativeAngle + pct}%`;
                          cumulativeAngle += pct;
                          return part;
                        }).join(', ');
                        
                        return (
                          <>
                            <div
                              className="doughnut"
                              style={{ background: `conic-gradient(${bulkConicParts})` }}
                              aria-label="Bulk orders by status chart"
                            />
                            <div className="doughnut-legend">
                              {bulkStatusEntries.map(([status, count]) => (
                                <div key={`bulk-${status}`} className="legend-item">
                                  <span className="legend-dot" style={{ background: statusColors[status] }} />
                                  <span>{status}</span>
                                  <span className="legend-count">{count}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        );
                      })()}
                    </>
                  )}
                </div>
              </div>

              {/* Users Table */}
              {role === 'ADMIN' && (
                <div className="table-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 className="chart-title">User Management</h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="pm-action-btn pm-action-btn--primary"
                        onClick={() => setShowAddStaffModal(true)}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                      >
                        + Add Staff
                      </button>
                      <button
                        className="pm-action-btn pm-action-btn--primary"
                        onClick={() => setShowAddRetailerModal(true)}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                      >
                        + Add Retailer
                      </button>
                    </div>
                  </div>
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
                              <div style={{ display: 'grid', gap: '0.35rem' }}>
                                <select
                                  className="role-select"
                                  value={u.role}
                                  onChange={e => handleRoleChange(u.id, e.target.value)}
                                  disabled={isCurrentSessionUser(u)}
                                  title={isCurrentSessionUser(u) ? 'You cannot change your own role' : 'Change role'}
                                >
                                  <option value="CUSTOMER">CUSTOMER</option>
                                  <option value="STAFF">STAFF</option>
                                  <option value="RETAILER">RETAILER</option>
                                  <option value="ADMIN" disabled>
                                    ADMIN (restricted)
                                  </option>
                                </select>
                                <small className="text-muted" title="Backend policy restriction">
                                  ADMIN promotion is blocked by backend policy.
                                </small>
                              </div>
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
                                disabled={isCurrentSessionUser(u)}
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

          {/* Add Retailer Modal */}
          {showAddRetailerModal && (
            <div className="om-modal-overlay" onClick={() => setShowAddRetailerModal(false)}>
              <div className="om-modal" onClick={e => e.stopPropagation()}>
                <div className="om-modal__header">
                  <h2>Add New Retailer</h2>
                  <button className="om-modal__close" onClick={() => setShowAddRetailerModal(false)}>✕</button>
                </div>
                <div className="om-modal__body">
                  <form onSubmit={(e) => { e.preventDefault(); handleAddRetailer(); }}>
                    <div className="form-group">
                      <label htmlFor="username">Username</label>
                      <input
                        id="username"
                        type="text"
                        className="form-control"
                        value={retailerForm.username}
                        onChange={e => setRetailerForm({ ...retailerForm, username: e.target.value })}
                        placeholder="Enter username"
                        disabled={isSubmittingRetailer}
                      />
                      {retailerErrors.username && <span className="error-message">{retailerErrors.username}</span>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <input
                        id="email"
                        type="email"
                        className="form-control"
                        value={retailerForm.email}
                        onChange={e => setRetailerForm({ ...retailerForm, email: e.target.value })}
                        placeholder="Enter email"
                        disabled={isSubmittingRetailer}
                      />
                      {retailerErrors.email && <span className="error-message">{retailerErrors.email}</span>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="password">Password</label>
                      <input
                        id="password"
                        type="password"
                        className="form-control"
                        value={retailerForm.password}
                        onChange={e => setRetailerForm({ ...retailerForm, password: e.target.value })}
                        placeholder="Enter password"
                        disabled={isSubmittingRetailer}
                      />
                      {retailerErrors.password && <span className="error-message">{retailerErrors.password}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                      <button
                        type="submit"
                        className="pm-action-btn pm-action-btn--primary"
                        disabled={isSubmittingRetailer}
                      >
                        {isSubmittingRetailer ? 'Creating...' : 'Create Retailer'}
                      </button>
                      <button
                        type="button"
                        className="pm-action-btn"
                        onClick={() => setShowAddRetailerModal(false)}
                        disabled={isSubmittingRetailer}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Add Staff Modal */}
          {showAddStaffModal && (
            <div className="om-modal-overlay" onClick={() => setShowAddStaffModal(false)}>
              <div className="om-modal" onClick={e => e.stopPropagation()}>
                <div className="om-modal__header">
                  <h2>Add New Staff Member</h2>
                  <button className="om-modal__close" onClick={() => setShowAddStaffModal(false)}>✕</button>
                </div>
                <div className="om-modal__body">
                  <form onSubmit={(e) => { e.preventDefault(); handleAddStaff(); }}>
                    <div className="form-group">
                      <label htmlFor="staff-username">Username</label>
                      <input
                        id="staff-username"
                        type="text"
                        className="form-control"
                        value={staffForm.username}
                        onChange={e => setStaffForm({ ...staffForm, username: e.target.value })}
                        placeholder="Enter username"
                        disabled={isSubmittingStaff}
                      />
                      {staffErrors.username && <span className="error-message">{staffErrors.username}</span>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="staff-email">Email</label>
                      <input
                        id="staff-email"
                        type="email"
                        className="form-control"
                        value={staffForm.email}
                        onChange={e => setStaffForm({ ...staffForm, email: e.target.value })}
                        placeholder="Enter email"
                        disabled={isSubmittingStaff}
                      />
                      {staffErrors.email && <span className="error-message">{staffErrors.email}</span>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="staff-password">Password</label>
                      <input
                        id="staff-password"
                        type="password"
                        className="form-control"
                        value={staffForm.password}
                        onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}
                        placeholder="Enter password"
                        disabled={isSubmittingStaff}
                      />
                      {staffErrors.password && <span className="error-message">{staffErrors.password}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                      <button
                        type="submit"
                        className="pm-action-btn pm-action-btn--primary"
                        disabled={isSubmittingStaff}
                      >
                        {isSubmittingStaff ? 'Creating...' : 'Create Staff'}
                      </button>
                      <button
                        type="button"
                        className="pm-action-btn"
                        onClick={() => setShowAddStaffModal(false)}
                        disabled={isSubmittingStaff}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
