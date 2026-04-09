import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import Toast from './Toast';
import type { Product } from '../types';
import './ProductModal.css';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
  layoutId: string;
}

export default function ProductModal({ product, onClose, layoutId }: ProductModalProps) {
  const { addItem } = useCart();
  const { addItem: addToWishlist } = useWishlist();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

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

  return (
    <motion.div 
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="modal-content-card"
        layoutId={layoutId} // Morph from the card
        onClick={(e) => e.stopPropagation()} // Prevent click from closing
      >
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          ✕
        </button>

        <div className="modal-img-container">
          {product.imageUrl ? (
            <motion.img 
              layoutId={`img-${product.id}`}
              src={product.imageUrl} 
              alt={product.name}
              className="modal-img"
            />
          ) : (
            <motion.div layoutId={`img-${product.id}`} aria-hidden="true">{product.emoji}</motion.div>
          )}
        </div>

        <div className="modal-info">
          <div style={{ fontSize: '0.65rem', letterSpacing: '3px', color: 'var(--accent)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            {product.category}
          </div>
          <motion.h1 
            layoutId={`name-${product.id}`}
            style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '0.5rem' }}
          >
            {product.name}
          </motion.h1>
          <div style={{ fontSize: '1.4rem', color: 'var(--accent)', marginBottom: '1.5rem', fontWeight: 500 }}>
            Rs {product.price.toLocaleString()}
          </div>
          <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginBottom: '2rem', fontSize: '0.95rem' }}>
            {product.desc || `Premium ${product.category.toLowerCase()} perfect for any occasion.`}
          </p>

          <div style={{ fontSize: '0.7rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.8rem' }}>
            Select Size
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '2rem' }}>
            {product.sizes.map((size) => (
              <button
                key={size}
                className={`size-btn${selectedSize === size ? ' size-btn--selected' : ''}`}
                onClick={() => setSelectedSize(size)}
                style={{
                  width: '44px', height: '44px', border: '1px solid var(--border)', background: selectedSize === size ? 'rgba(255,255,255,0.05)' : 'none',
                  color: selectedSize === size ? 'var(--accent)' : 'var(--text)', borderColor: selectedSize === size ? 'var(--accent)' : 'var(--border)',
                  cursor: 'pointer', borderRadius: '4px'
                }}
              >
                {size}
              </button>
            ))}
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem', padding: '0.8rem' }} onClick={handleAddToCart}>
            Add to Cart →
          </button>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={handleAddToWishlist}>♡ Wishlist</button>
            <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => setToast('Share coming soon')}>⤢ Share</button>
          </div>
        </div>
      </motion.div>

      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </motion.div>
  );
}
