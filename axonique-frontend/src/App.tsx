import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

import HomePage from './pages/HomePage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CatalogPage from './pages/CatalogPage';
import ProductPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import ShippingPolicyPage from './pages/ShippingPolicyPage';
import RefundPolicyPage from './pages/RefundPolicyPage';
import TermsPage from './pages/TermsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import RetailerBulkOrderPage from './pages/RetailerBulkOrderPage';

// Admin/Staff Pages
import AdminDashboardPage from './pages/AdminDashboardPage';
import InventoryPage from './pages/InventoryPage';
import StaffDashboardPage from './pages/StaffDashboardPage';
import OrderManagementPage from './pages/OrderManagementPage';
import ProductManagementPage from './pages/ProductManagementPage';
import BrandProfilePage from './pages/BrandProfilePage';
import StaffSignInPage from './pages/StaffSignInPage';
import WishlistPage from './pages/WishlistPage';
import ContactPage from './pages/ContactPage';
import BulkOrderManagementPage from './pages/BulkOrderManagementPage';

export default function App() {
  return (
    <CartProvider>
      <WishlistProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes with Navbar + Footer */}
            <Route
              path="/*"
              element={
                <>
                  <Navbar />
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/signin" element={<SignInPage />} />
                    <Route path="/staff/signin" element={<StaffSignInPage />} />
                    <Route path="/signup" element={<SignUpPage />} />
                    <Route path="/verify-email" element={<EmailVerificationPage />} />
                    <Route path="/change-password" element={<ChangePasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/catalog" element={<CatalogPage />} />
                    <Route path="/catalog/collection/:collectionId" element={<CatalogPage />} />
                    <Route path="/product/:id" element={<ProductPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/retailer/bulk-order" element={
                      <ErrorBoundary>
                        <ProtectedRoute requiredRoles={['RETAILER', 'ADMIN']}>
                          <RetailerBulkOrderPage />
                        </ProtectedRoute>
                      </ErrorBoundary>
                    } />
                    <Route path="/wishlist" element={<WishlistPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/shipping" element={<ShippingPolicyPage />} />
                    <Route path="/refund" element={<RefundPolicyPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/privacy" element={<PrivacyPolicyPage />} />
                    <Route path="*" element={<HomePage />} />
                  </Routes>
                  <Footer />
                </>
              }
            />

            {/* Admin-only routes (no Navbar/Footer) */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRoles={['ADMIN']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/inventory"
              element={
                <ProtectedRoute requiredRoles={['ADMIN', 'STAFF']}>
                  <InventoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute requiredRoles={['ADMIN', 'STAFF']}>
                  <OrderManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/bulk-orders"
              element={
                <ProtectedRoute requiredRoles={['ADMIN', 'STAFF']}>
                  <BulkOrderManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute requiredRoles={['ADMIN', 'STAFF']}>
                  <ProductManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/brand"
              element={
                <ProtectedRoute requiredRoles={['ADMIN']}>
                  <BrandProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Staff routes */}
            <Route
              path="/staff/dashboard"
              element={
                <ProtectedRoute requiredRoles={['ADMIN', 'STAFF']}>
                  <StaffDashboardPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </WishlistProvider>
    </CartProvider>
  );
}
