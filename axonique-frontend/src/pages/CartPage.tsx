import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { decodeEmoji } from '../utils/decodeEmoji';
import './CartPage.css';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, changeQty, subtotal } = useCart();

  const getDiscountedPrice = (product: any) => {
    if (
      product?.discountActive &&
      product?.discountPercentage != null &&
      Number(product.discountPercentage) > 0
    ) {
      return product.price - (product.price * Number(product.discountPercentage)) / 100;
    }
    return product.price;
  };

  const originalSubtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.qty,
    0
  );

  const discountedSubtotal = items.reduce(
    (sum, item) => sum + getDiscountedPrice(item.product) * item.qty,
    0
  );

  const itemDiscountTotal = originalSubtotal - discountedSubtotal;

  const shipping = discountedSubtotal >= 10000 ? 0 : 350;
  const total = discountedSubtotal + shipping;

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
            <div role="list" aria-label="Cart items">
              {items.map((item) => {
                const discountedPrice = getDiscountedPrice(item.product);
                const hasDiscount = discountedPrice < item.product.price;
                const lineTotal = discountedPrice * item.qty;

                return (
                  <div
                    key={`${item.product.id}-${item.size}`}
                    className="cart-item"
                    role="listitem"
                  >
                    <div className="cart-item__img" aria-hidden="true">
                      {item.product.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        decodeEmoji(item.product.emoji)
                      )}
                    </div>

                    <div className="cart-item__info">
                      <div className="cart-item__name">{item.product.name}</div>
                      <div className="cart-item__meta">
                        Size: {item.size} · {item.product.category}
                      </div>

                      <div className="cart-item__price">
                        {hasDiscount ? (
                          <>
                            <span
                              style={{
                                textDecoration: 'line-through',
                                opacity: 0.7,
                                marginRight: 8,
                              }}
                            >
                              Rs {item.product.price.toLocaleString()}
                            </span>
                            <span style={{ color: '#15803d', fontWeight: 600 }}>
                              Rs {discountedPrice.toLocaleString()}
                            </span>
                          </>
                        ) : (
                          <>Rs {item.product.price.toLocaleString()}</>
                        )}
                      </div>

                      {hasDiscount && (
                        <div style={{ fontSize: '0.9rem', color: '#15803d', marginTop: 4 }}>
                          {item.product.discountPercentage}% item discount applied
                        </div>
                      )}

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

                    <div
                      className="cart-item__line-total"
                      aria-label={`Line total: Rs ${lineTotal.toLocaleString()}`}
                    >
                      Rs {lineTotal.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="cart-summary" aria-label="Order summary">
              <h2 className="cart-summary__title">Order Summary</h2>

              <div className="summary-row">
                <span>Original Subtotal</span>
                <span>Rs {originalSubtotal.toLocaleString()}</span>
              </div>

              <div className="summary-row">
                <span>Item Discounts</span>
                <span>- Rs {itemDiscountTotal.toLocaleString()}</span>
              </div>

              <div className="summary-row">
                <span>Subtotal</span>
                <span>Rs {discountedSubtotal.toLocaleString()}</span>
              </div>

              <div className="summary-row">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `Rs ${shipping.toLocaleString()}`}</span>
              </div>

              {shipping > 0 && (
                <p className="summary-hint">
                  Add Rs {(10000 - discountedSubtotal).toLocaleString()} more for free shipping
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