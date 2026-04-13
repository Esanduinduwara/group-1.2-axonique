import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import './AdminSidebar.css';

interface AdminSidebarProps {
  title?: string;
}

export default function AdminSidebar({ title = 'Admin Panel' }: AdminSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = authService.getRole();
  const isAdmin = role === 'ADMIN' || role === 'ROLE_ADMIN';

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  const navLinks = [
    { label: '📦 Orders', path: '/admin/orders', roles: ['ADMIN', 'STAFF'] },
    { label: '📦 Bulk', path: '/admin/bulk-orders', roles: ['ADMIN', 'STAFF'] },
    { label: '👕 Inventory', path: '/admin/inventory', roles: ['ADMIN', 'STAFF'] },
    { label: '🛍️ Products', path: '/admin/products', roles: ['ADMIN', 'STAFF'] },
    { label: '👤 Staff Hub', path: '/staff/dashboard', roles: ['ADMIN', 'STAFF'] },
  ];

  const visibleLinks = navLinks.filter(link =>
    role && link.roles.includes(role)
  );

  const adminOnlyLinks = isAdmin
    ? [
      { label: '📊 Dashboard', path: '/admin/dashboard' },
      { label: '🎨 Brand Profile', path: '/admin/brand' },
    ]
    : [];

  const SidebarContent = () => (
    <div className="admin-sidebar__inner">
      <div className="admin-sidebar__brand">
        <span className="admin-sidebar__logo">AXO</span>
        <span className="admin-sidebar__title">{title}</span>
      </div>

      <nav className="admin-sidebar__nav" aria-label="Admin navigation">
        {adminOnlyLinks.map(link => (
          <button
            key={link.path}
            className={`admin-sidebar__link ${location.pathname === link.path ? 'active' : ''}`}
            onClick={() => { navigate(link.path); setMobileOpen(false); }}
          >
            {link.label}
          </button>
        ))}
        {visibleLinks.map(link => (
          <button
            key={link.path}
            className={`admin-sidebar__link ${location.pathname === link.path ? 'active' : ''}`}
            onClick={() => { navigate(link.path); setMobileOpen(false); }}
          >
            {link.label}
          </button>
        ))}
      </nav>

      <div className="admin-sidebar__footer">
        <button
          className="admin-sidebar__link admin-sidebar__link--muted"
          onClick={() => navigate('/')}
        >
          ← Back to Store
        </button>
        <button
          className="admin-sidebar__logout"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="admin-sidebar__hamburger"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {/* Desktop sidebar */}
      <aside className="admin-sidebar admin-sidebar--desktop">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="admin-sidebar__overlay" onClick={() => setMobileOpen(false)}>
          <aside className="admin-sidebar admin-sidebar--mobile" onClick={e => e.stopPropagation()}>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
