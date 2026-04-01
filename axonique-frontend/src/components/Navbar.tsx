// SCRUM-15 — Navigation Bar
// Global navigation menu visible on all pages

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { authService } from '../services/authService';
import Modal from './Modal';
import './Navbar.css';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error'
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart();
  const profileRef = useRef<HTMLDivElement>(null);

  // Use state for authentication to ensure reactive updates
  const [user, setUser] = useState(authService.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());

  const links = [
    { label: 'Home', path: '/' },
    { label: 'Catalog', path: '/catalog' },
    { label: 'Wishlist', path: '/wishlist' },
    { label: 'Contact', path: '/contact' },
  ];

  // Update auth state whenever the location changes
  useEffect(() => {
    setUser(authService.getUser());
    setIsAuthenticated(authService.isAuthenticated());
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const handleNav = (path: string) => {
    navigate(path);
    setMenuOpen(false);
    setProfileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    authService.logout();
    setProfileOpen(false);

    // Immediate state update
    setUser(null);
    setIsAuthenticated(false);

    setModal({
      isOpen: true,
      title: 'Logged Out',
      message: 'You have been successfully logged out. See you soon!',
      type: 'success'
    });
  };

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
    navigate('/');
  };

  return (
    <>
      <nav className="navbar" aria-label="Main navigation">
        {/* Logo */}
        <button className="navbar__logo" onClick={() => handleNav('/')} aria-label="AXO — Go to homepage">
          <img
            className="navbar__logo-image"
            src="https://res.cloudinary.com/dimdro5dm/image/upload/v1772429380/Whisk_609d914e87483a88410498009f0cb04bdr_fohtih.png"
            alt="AXO logo"
          />
        </button>

        {/* Desktop Links */}
        <ul className="navbar__links" role="list">
          {links.map((link) => (
            <li key={link.path}>
              <button
                className={`navbar__link${isActive(link.path) ? ' navbar__link--active' : ''}`}
                onClick={() => handleNav(link.path)}
                aria-current={isActive(link.path) ? 'page' : undefined}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Right Actions */}
        <div className="navbar__actions">
          {/* Profile Dropdown */}
          <div className="navbar__profile-container" ref={profileRef}>
            <button
              className={`navbar__profile-trigger ${profileOpen ? 'active' : ''}`}
              onClick={() => setProfileOpen(!profileOpen)}
              aria-label="Account menu"
            >
              👤 Profile
            </button>

            {profileOpen && (
              <div className="navbar__dropdown">
                {isAuthenticated && user && (
                  <div className="navbar__dropdown-header">
                    <span className="navbar__dropdown-user">Hi, {user.username}</span>
                  </div>
                )}
                <div className="navbar__dropdown-links">
                  {!isAuthenticated ? (
                    <>
                      <button onClick={() => handleNav('/signup')}>Sign up</button>
                      <button onClick={() => handleNav('/signin')}>Log in</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleNav('/change-password')}>Change Password</button>
                      <button className="logout" onClick={handleLogout}>Log out</button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            className="navbar__cart"
            onClick={() => handleNav('/cart')}
            aria-label={`Cart, ${totalItems} item${totalItems !== 1 ? 's' : ''}`}
          >
            🛒 Cart
            <span className="navbar__cart-badge" aria-hidden="true">
              {totalItems}
            </span>
          </button>

          {/* Hamburger (mobile) */}
          <button
            className="navbar__hamburger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      <div
        id="mobile-menu"
        className={`navbar__mobile-menu${menuOpen ? ' navbar__mobile-menu--open' : ''}`}
        aria-hidden={!menuOpen}
      >
        {links.map((link) => (
          <button
            key={link.path}
            className={`navbar__mobile-link${isActive(link.path) ? ' navbar__mobile-link--active' : ''}`}
            onClick={() => handleNav(link.path)}
          >
            {link.label}
          </button>
        ))}
        <button className="navbar__mobile-link" onClick={() => handleNav('/cart')}>
          Cart ({totalItems})
        </button>

        <div className="navbar__mobile-auth">
          {isAuthenticated && user && (
            <div className="navbar__mobile-user">Hi, {user.username}</div>
          )}

          {!isAuthenticated ? (
            <>
              <button className="navbar__mobile-link" onClick={() => handleNav('/signup')}>Sign up</button>
              <button className="navbar__mobile-link" onClick={() => handleNav('/signin')}>Log in</button>
            </>
          ) : (
            <>
              <button className="navbar__mobile-link" onClick={() => handleNav('/change-password')}>Change Password</button>
              <button className="navbar__mobile-link logout" onClick={handleLogout}>Log out</button>
            </>
          )}
        </div>
      </div>
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </>
  );
}
