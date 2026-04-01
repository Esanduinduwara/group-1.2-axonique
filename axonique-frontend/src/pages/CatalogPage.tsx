// SCRUM-16 — Product Listing Page (Catalog / Shop Page)
// All products in a grid with category filters and sort controls

import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import Toast from '../components/Toast';
import type { Product } from '../types';
import './CatalogPage.css';

type SortOption = 'featured' | 'new-to-old' | 'old-to-new' | 'low-to-high' | 'high-to-low';
type AvailFilter = 'all' | 'in-stock' | 'out-of-stock';

const SORT_LABELS: Record<SortOption, string> = {
  featured: 'Featured',
  'new-to-old': 'New to Old',
  'old-to-new': 'Old to New',
  'low-to-high': 'Price: Low to High',
  'high-to-low': 'Price: High to Low',
};

const COLLECTION_FILTERS: Record<string, string[]> = {
  ascension: ['Timeless', 'Impossible'],
  'night-crawler': ['Phantom', 'Xenonix'],
};

export default function CatalogPage() {
  const navigate = useNavigate();
  const { collectionId } = useParams();
  const [toast, setToast] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [availFilter, setAvailFilter] = useState<AvailFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Fetch products from API
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/products`)
      .then((res) => res.json())
      .then((data) => setProducts(data.data || data))
      .catch((err) => {
        console.error('Failed to fetch products:', err);
        setToast('Failed to load products');
      });
  }, []);

  // Close dropdowns on outside click
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];
  const collectionKeywords = collectionId ? COLLECTION_FILTERS[collectionId] : undefined;

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (collectionKeywords) {
      list = list.filter((p) =>
        collectionKeywords.some((keyword) => p.name.includes(keyword))
      );
    }

    list = categoryFilter === 'All'
      ? list
      : list.filter((p) => p.category === categoryFilter);

    // Availability (all products treated as in-stock)
    if (availFilter === 'out-of-stock') list = [];

    // Sort
    switch (sortBy) {
      case 'low-to-high': list.sort((a, b) => a.price - b.price); break;
      case 'high-to-low': list.sort((a, b) => b.price - a.price); break;
      case 'new-to-old': list.reverse(); break;
      case 'old-to-new': list.sort((a, b) => a.id - b.id); break;
    }
    return list;
  }, [products, collectionKeywords, categoryFilter, availFilter, sortBy]);

  const hasActiveFilters = availFilter !== 'all';

  const toggleMenu = (id: string) =>
    setOpenMenu((prev) => (prev === id ? null : id));

  return (
    <main className="page">
      <section>
        <div className="container">
          <div className="section-header">
            <div className="section-label">{collectionKeywords ? 'Collection' : 'Browse All'}</div>
            <h2 className="section-title">
              {collectionKeywords ? `${collectionKeywords.join(' + ')} Collection` : 'Products'}
            </h2>
          </div>

          {/* Category chips */}
          <div className="filter-bar" role="group" aria-label="Filter by category">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`filter-chip${categoryFilter === cat ? ' filter-chip--active' : ''}`}
                onClick={() => setCategoryFilter(cat)}
                aria-pressed={categoryFilter === cat}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Filter & Sort bar */}
          <div className="filter-sort-bar" ref={barRef}>
            <div className="filter-sort-left">
              {/* Availability dropdown */}
              <div className={`dropdown-menu${openMenu === 'avail' ? ' dropdown-menu--open' : ''}`}>
                <button className="dropdown-btn" onClick={() => toggleMenu('avail')}>
                  Availability
                </button>
                <div className="dropdown-content">
                  {(['all', 'in-stock', 'out-of-stock'] as AvailFilter[]).map((val) => (
                    <button
                      key={val}
                      className={`dropdown-option${availFilter === val ? ' dropdown-option--active' : ''}`}
                      onClick={() => { setAvailFilter(val); setOpenMenu(null); }}
                    >
                      {{ all: 'All Items', 'in-stock': 'In Stock', 'out-of-stock': 'Out of Stock' }[val]}
                      {availFilter === val && <span aria-hidden="true">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sort dropdown */}
            <div className="filter-sort-left" style={{ marginLeft: 'auto' }}>
              <div className={`dropdown-menu${openMenu === 'sort' ? ' dropdown-menu--open' : ''}`}>
                <button className="dropdown-btn" onClick={() => toggleMenu('sort')}>
                  {SORT_LABELS[sortBy]}
                </button>
                <div className="dropdown-content">
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((val) => (
                    <button
                      key={val}
                      className={`dropdown-option${sortBy === val ? ' dropdown-option--active' : ''}`}
                      onClick={() => { setSortBy(val); setOpenMenu(null); }}
                    >
                      {SORT_LABELS[val]}
                      {sortBy === val && <span aria-hidden="true">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
              <span className="product-count" aria-live="polite">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Active filter tags */}
          {hasActiveFilters && (
            <div className="active-filters" aria-label="Active filters">
              <span className="filter-tag">
                Availability: {availFilter === 'in-stock' ? 'In Stock' : 'Out of Stock'}
                <button className="filter-tag__remove" onClick={() => setAvailFilter('all')} aria-label="Remove availability filter">×</button>
              </span>
              <button className="remove-all-btn" onClick={() => setAvailFilter('all')}>
                Remove all
              </button>
            </div>
          )}

          {/* Product grid */}
          {filteredProducts.length > 0 ? (
            <div className="product-grid" role="list" aria-label="Product listing">
              {filteredProducts.map((p) => (
                <div key={p.id} role="listitem">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          ) : (
            <div className="catalog-empty" aria-live="polite">
              <p>No products match your filters.</p>
              <button className="btn btn-outline btn-sm" onClick={() => { setCategoryFilter('All'); setAvailFilter('all'); }}>
                Clear Filters
              </button>
            </div>
          )}

          <div className="catalog-wishlist-cta">
            <button className="btn btn-outline" onClick={() => navigate('/wishlist')}>
              Go to Wishlist →
            </button>
          </div>
        </div>
      </section>

      <Toast message={toast} onDone={() => setToast('')} />
    </main>
  );
}
