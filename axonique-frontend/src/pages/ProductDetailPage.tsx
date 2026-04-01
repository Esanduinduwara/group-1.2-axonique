// SCRUM-17 — Product Detail Page UI
// Large image, name, price, description, size selection, add-to-cart

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import Toast from '../components/Toast';
import type { Product } from '../types';
import './ProductDetailPage.css';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { addItem: addToWishlist } = useWishlist();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => setProduct(data.data || data))
      .catch((err) => {
        console.error('Failed to fetch product:', err);
        setToast('Failed to load product');
      });
  }, [id]);

  if (!product) {
    return (
      <main className="page">
        <div className="container" style={{ padding: '5rem 2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>Loading...</p>
        </div>
      </main>
    );
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      setToast('Please select a size first');
      return;
    }
    addItem(product, selectedSize);
    setToast(`✓ ${product.name} added to cart`);
  };

  const handleAddToWishlist = () => {
    const added = addToWishlist(product);
    setToast(added ? `✓ ${product.name} added to wishlist` : `${product.name} is already in wishlist`);
  };

  const handleShareComingSoon = () => {
    setToast('Share product option coming soon');
  };

  return (
    <main className="page">
      <div className="detail-page container">
        {/* Back button */}
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
          ← Back
        </button>

        <div className="detail-grid">
          {/* Product image */}
          <div className="detail-img">
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="detail-product-image"
              />
            ) : (
              <div aria-hidden="true" style={{ fontSize: '8rem' }}>
                {product.emoji}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="detail-info">
            <div className="detail-category">{product.category.toUpperCase()}</div>
            <h1 className="detail-name">{product.name}</h1>
            <div className="detail-price">Rs {product.price.toLocaleString()}</div>
            <p className="detail-desc">{product.desc}</p>

            {/* Size selector */}
            <div className="size-label">Select Size</div>
            <div className="size-grid" role="group" aria-label="Size selection">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  className={`size-btn${selectedSize === size ? ' size-btn--selected' : ''}`}
                  onClick={() => setSelectedSize(size)}
                  aria-pressed={selectedSize === size}
                  aria-label={`Size ${size}`}
                >
                  {size}
                </button>
              ))}
            </div>

            {/* Add to cart */}
            <button className="btn btn-primary btn-full" onClick={handleAddToCart}>
              Add to Cart →
            </button>

            {/* Secondary actions */}
            <div className="detail-actions">
              <button className="btn btn-outline btn-sm" onClick={handleAddToWishlist}>♡ Wishlist</button>
              <button className="btn btn-outline btn-sm" onClick={handleShareComingSoon}>⤢ Share</button>
            </div>
          </div>
        </div>
      </div>

      <Toast message={toast} onDone={() => setToast('')} />
    </main>
  );
}
