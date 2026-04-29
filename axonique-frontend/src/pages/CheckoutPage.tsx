import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CheckoutPage.css';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [pendingVerification, setPendingVerification] = useState<{ orderId: number | null; email: string } | null>(null);
  const [latestProducts, setLatestProducts] = useState<Record<number, { inStock: boolean; stockQuantity: number }>>({});

  const shipping = subtotal >= 10000 ? 0 : 350;
  const total = subtotal + shipping;

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/products`)
      .then((res) => res.json())
      .then((data) => {
        const list = (data.data || data) as Array<{ id: number; inStock: boolean; stockQuantity: number }>;
        const map: Record<number, { inStock: boolean; stockQuantity: number }> = {};
        list.forEach((p) => {
          map[p.id] = { inStock: p.inStock, stockQuantity: p.stockQuantity };
        });
        setLatestProducts(map);
      })
      .catch(() => {
        // Keep optimistic UI if stock refresh fails; backend still validates.
      });
  }, []);

  const outOfStockItems = useMemo(
    () =>
      items.filter((item) => {
        const latest = latestProducts[item.product.id];
        const inStock = latest ? latest.inStock : item.product.inStock;
        const stockQty = latest ? latest.stockQuantity : item.product.stockQuantity;
        return !inStock || stockQty <= 0;
      }),
    [items, latestProducts]
  );

  const cannotPlaceOrder = outOfStockItems.length > 0;

  if (items.length === 0 && !pendingVerification) {
    return (
      <main className="page">
        <section>
          <div className="container">
            <div className="empty-cart" aria-label="Empty cart">
              <div className="empty-cart__icon">🛒</div>
              <h2 className="empty-cart__title">Your cart is empty</h2>
              <p className="empty-cart__desc">Add items before checkout</p>
              <button className="btn btn-primary" onClick={() => navigate('/catalog')}>
                Shop Now →
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (items.length === 0 && pendingVerification) {
    return (
      <main className="page">
        <section>
          <div className="container">
            <div className="empty-cart" aria-label="Order pending verification">
              <div className="empty-cart__icon">📧</div>
              <h2 className="empty-cart__title">Please verify your order via email</h2>
              <p className="empty-cart__desc">
                We sent a verification link to <strong>{pendingVerification.email}</strong>.
                {pendingVerification.orderId ? ` Order ID: #${pendingVerification.orderId}.` : ''}
              </p>
              <button className="btn" onClick={() => navigate('/')}>
                Back to Home
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (cannotPlaceOrder) {
      setNotice('Cannot place order because the product is out of stock');
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await fetch(''+(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080')+'/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail,
          deliveryAddress,
          items: items.map((item) => ({
            productId: item.product.id,
            size: item.size,
            quantity: item.qty,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to place order');
      }

      clearCart();
      setPendingVerification({ orderId: data?.data?.id ?? null, email: customerEmail });
      setNotice(`Please verify your order via email to complete your purchase.`);
    } catch (error) {
      console.error(error);
      setNotice('We could not place your order right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page">
      <section>
        <div className="container">
          <div className="section-header">
            <div className="section-label">Checkout</div>
            <h1 className="section-title">Delivery Details</h1>
          </div>
          {notice && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.75rem 0.9rem',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.03)',
                color: '#f1f1f1',
              }}
            >
              {notice}
            </div>
          )}

          <div className="checkout-layout">
            <form className="checkout-form" onSubmit={handleSubmit}>
              {cannotPlaceOrder && (
                <div
                  style={{
                    marginBottom: '1rem',
                    padding: '0.75rem 0.9rem',
                    border: '1px solid rgba(231, 76, 60, 0.5)',
                    borderRadius: '10px',
                    background: 'rgba(231, 76, 60, 0.08)',
                    color: '#ffb3b3',
                  }}
                >
                  Cannot place order because the product is out of stock.
                  {outOfStockItems.length > 0 && (
                    <div style={{ marginTop: '0.5rem', color: '#f1f1f1' }}>
                      {outOfStockItems.map((item) => item.product.name).join(', ')}
                    </div>
                  )}
                </div>
              )}
              <input
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="checkout-input"
                placeholder="Full name"
              />
              <input
                required
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="checkout-input"
                placeholder="Email"
              />
              <textarea
                required
                rows={5}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="checkout-input checkout-textarea"
                placeholder="Delivery address"
              />
              <button className="btn btn-primary btn-full" type="submit" disabled={isSubmitting || cannotPlaceOrder}>
                {cannotPlaceOrder ? 'Cannot Place Order' : isSubmitting ? 'Placing Order...' : 'Place Order →'}
              </button>
            </form>

            <div className="cart-summary" aria-label="Order summary">
              <h2 className="cart-summary__title">Order Summary</h2>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>Rs {subtotal.toLocaleString()}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `Rs ${shipping.toLocaleString()}`}</span>
              </div>
              <div className="summary-row summary-row--total">
                <span>Total</span>
                <span>Rs {total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
