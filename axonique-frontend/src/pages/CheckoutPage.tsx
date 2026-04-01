import { useState } from 'react';
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

  const shipping = subtotal >= 10000 ? 0 : 350;
  const total = subtotal + shipping;

  if (items.length === 0) {
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
      alert(`Order placed successfully. Order ID: ${data?.data?.id ?? 'N/A'}`);
      navigate('/');
    } catch (error) {
      console.error(error);
      alert('Checkout failed. Please try again.');
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

          <div className="checkout-layout">
            <form className="checkout-form" onSubmit={handleSubmit}>
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
              <button className="btn btn-primary btn-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Placing Order...' : 'Place Order →'}
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
