// SCRUM-18 — Shopping Cart UI
// Cart items with quantity controls, remove button, and order summary

import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CartPage.css';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, changeQty, subtotal } = useCart();

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
              <p className="empty-cart__desc">Discover pieces you'll love in our collection</p>
              <button className="btn btn-primary" onClick={() => navigate('/catalog')}>
                Shop Now →
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section>
        <div className="container">
          <div className="section-header">
            <div className="section-label">Review</div>
            <h1 className="section-title">Your Cart</h1>
          </div>

          <div className="cart-layout">
            {/* ----- Items list ----- */}
            <div role="list" aria-label="Cart items">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.size}`}
                  className="cart-item"
                  role="listitem"
                >
                  {/* Thumbnail */}
                  <div className="cart-item__img" aria-hidden="true">
                    {item.product.emoji}
                  </div>

                  {/* Info */}
                  <div className="cart-item__info">
                    <div className="cart-item__name">{item.product.name}</div>
                    <div className="cart-item__meta">
                      Size: {item.size} · {item.product.category}
                    </div>
                    <div className="cart-item__price">
                      Rs {item.product.price.toLocaleString()}
                    </div>

                    {/* Quantity + Remove */}
                    <div className="qty-control">
                      <button
                        className="qty-btn"
                        onClick={() => changeQty(item.product.id, item.size, -1)}
                        aria-label={`Decrease quantity of ${item.product.name}`}
                      >
                        −
                      </button>
                      <span className="qty-val" aria-label={`Quantity: ${item.qty}`}>
                        {item.qty}
                      </span>
                      <button
                        className="qty-btn"
                        onClick={() => changeQty(item.product.id, item.size, 1)}
                        aria-label={`Increase quantity of ${item.product.name}`}
                      >
                        +
                      </button>
                      <button
                        className="remove-btn"
                        onClick={() => removeItem(item.product.id, item.size)}
                        aria-label={`Remove ${item.product.name} from cart`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Line total */}
                  <div className="cart-item__line-total" aria-label={`Line total: Rs ${(item.product.price * item.qty).toLocaleString()}`}>
                    Rs {(item.product.price * item.qty).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* ----- Order Summary ----- */}
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

              {shipping > 0 && (
                <p className="summary-hint">
                  Add Rs {(10000 - subtotal).toLocaleString()} more for free shipping
                </p>
              )}

              <div className="summary-row summary-row--total">
                <span>Total</span>
                <span>Rs {total.toLocaleString()}</span>
              </div>

              <div className="summary-actions">
                <button className="btn btn-primary btn-full" onClick={() => navigate('/checkout')}>
                  Checkout →
                </button>
                <button
                  className="btn btn-outline btn-sm btn-full"
                  onClick={() => navigate('/catalog')}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
