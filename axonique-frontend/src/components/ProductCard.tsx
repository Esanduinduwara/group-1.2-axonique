// Shared ProductCard component — used in SCRUM-14 (Home) and SCRUM-16 (Catalog)

import { useNavigate } from 'react-router-dom';
import type { Product } from '../types';
import { useWishlist } from '../context/WishlistContext';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const { addItem } = useWishlist();

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/product/${product.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWishlistAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const added = addItem(product);
    window.alert(added ? `✓ ${product.name} added to wishlist` : `${product.name} is already in wishlist`);
  };

  const handleViewDetails = () => {
    navigate(`/product/${product.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="product-card" onClick={handleViewDetails} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleViewDetails()}
      aria-label={`View details for ${product.name}`}
    >
      <div className="product-card__img">
        {product.badge && (
          <div className="product-card__badge" aria-label={`Badge: ${product.badge}`}>
            {product.badge}
          </div>
        )}
                {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="product-card__image"
          />
        ) : (
        <span className="product-card__emoji" aria-hidden="true">
          {product.emoji}
        </span>
        )}
        <div className="product-card__overlay" aria-hidden="true" />
      </div>

      <div className="product-card__info">
        <div className="product-card__category">{product.category}</div>
        <div className="product-card__name">{product.name}</div>
        <div className="product-card__footer">
          <div className="product-card__price">Rs {product.price.toLocaleString()}</div>
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
            >
              Add →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
