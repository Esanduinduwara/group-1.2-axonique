// Shared ProductCard component — used in SCRUM-14 (Home) and SCRUM-16 (Catalog)

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '../types';
import { useWishlist } from '../context/WishlistContext';
import ProductModal from './ProductModal';
import { decodeEmoji } from '../utils/decodeEmoji';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useWishlist();
  const [isOpen, setIsOpen] = useState(false);
  const isOutOfStock = !product.inStock || product.stockQuantity <= 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    setIsOpen(true);
  };

  const handleWishlistAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const added = addItem(product);
    window.alert(added ? `✓ ${product.name} added to wishlist` : `${product.name} is already in wishlist`);
  };

  const layoutId = `product-${product.id}`;

  const hasDiscount =
    product.discountActive &&
    product.discountPercentage != null &&
    Number(product.discountPercentage) > 0;

  const discountedPrice = hasDiscount
    ? product.price - (product.price * Number(product.discountPercentage)) / 100
    : product.price;

  return (
    <>
      <motion.div
        className="product-card"
        onClick={() => setIsOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setIsOpen(true)}
        aria-label={`View details for ${product.name}`}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={{
          y: -10,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
        transition={{ duration: 0.3 }}
        layoutId={layoutId}
      >
        <div className="product-card__img">
          {product.badge && (
            <div className="product-card__badge" aria-label={`Badge: ${product.badge}`}>
              {product.badge}
            </div>
          )}
          {isOutOfStock && (
            <div className="product-card__stock-badge" aria-label="Out of stock">
              Out of Stock
            </div>
          )}
          {product.imageUrl ? (
            <motion.img
              layoutId={`img-${product.id}`}
              src={product.imageUrl}
              alt={product.name}
              className="product-card__image"
            />
          ) : (
            <motion.span layoutId={`img-${product.id}`} className="product-card__emoji" aria-hidden="true">
              {decodeEmoji(product.emoji)}
            </motion.span>
          )}
          <div className="product-card__overlay" aria-hidden="true" />
        </div>

        <div className="product-card__info">
          <div className="product-card__category">{product.category}</div>
          <motion.div layoutId={`name-${product.id}`} className="product-card__name">
            {product.name}
          </motion.div>

          {hasDiscount && (
            <div style={{ fontSize: '0.85rem', color: '#15803d', marginTop: 4 }}>
              {product.discountPercentage}% off
            </div>
          )}

          <div className="product-card__footer">
            <div className="product-card__price">
              {hasDiscount ? (
                <>
                  <span style={{ textDecoration: 'line-through', opacity: 0.7, marginRight: 8 }}>
                    Rs {product.price.toLocaleString()}
                  </span>
                  <span style={{ color: '#15803d', fontWeight: 600 }}>
                    Rs {discountedPrice.toLocaleString()}
                  </span>
                </>
              ) : (
                <>Rs {product.price.toLocaleString()}</>
              )}
            </div>

            <div className="product-card__actions">
              <button
                className="btn btn-outline btn-sm"
                onClick={handleWishlistAdd}
                aria-label={`Add ${product.name} to wishlist`}
              >
                ♡
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleQuickAdd}
                aria-label={`View details for ${product.name}`}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? 'Out of Stock' : 'Add →'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <ProductModal
            product={product}
            onClose={() => setIsOpen(false)}
            layoutId={layoutId}
          />
        )}
      </AnimatePresence>
    </>
  );
}