// SCRUM-14 — Homepage Layout
// Hero section, featured products, collections, and why-us

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import Toast from '../components/Toast';
import type { Product } from '../types';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const [toast, setToast] = useState('');
  const [products, setProducts] = useState<Product[]>([]);

  // Fetch products from API
  useEffect(() => {
    fetch('http://localhost:8080/api/products')
      .then((res) => res.json())
      .then((data) => setProducts(data.data || data))
      .catch((err) => {
        console.error('Failed to fetch products:', err);
        setToast('Failed to load products');
      });
  }, []);

  const newest = products.filter((p) =>
    p.name.includes('Timeless Tee') || p.name.includes('Timeless Hoodie') || p.name.includes('Timeless Cap') ||p.name.includes('Impossible Tee') || p.name.includes('Impossible Hoodie') || p.name.includes('Impossible Cap')
  );
  const featured = products.filter((p) =>
    p.name.includes('Phantom Tee') || p.name.includes('Xenonix Tee') || p.name.includes('Phantom Hoodie') || p.name.includes('Xenonix Hoodie') || p.name.includes('Phantom Cap') || p.name.includes('Xenonix Cap')
  );

  return (
    <main className="page">
      {/* ---- Hero ---- */}
      <div className="hero">
        <div className="hero__images" aria-hidden="true">
          <img
            className="hero__image hero__image--left"
            src="https://res.cloudinary.com/dimdro5dm/image/upload/v1772432348/Screenshot_2026-03-02_at_11.48.41_vkiqq6.png"
            alt=""
          />
          <img
            className="hero__image hero__image--right"
            src="https://res.cloudinary.com/dimdro5dm/image/upload/v1772361719/MPPxAXO_9721.jpg_1_zjtm6g.jpg"
            alt=""
          />
        </div>
        <div className="hero__content">
          <div className="hero__tag">
            Our New{' '}
            <button
              className="hero__tag-link"
              type="button"
              onClick={() => navigate('/catalog/collection/ascension')}
            >
              Ascension
            </button>{' '}
            Collection is out
          </div>
          <h1 className="hero__title">
            AXO
          </h1>
          <p className="hero__desc">
            Experience a seamless and personalized way to order your AXO apparel. From selecting
            your style to final delivery, we've designed every step to be simple, transparent, and
            customer-focused. Your style. Your order. Made easy.
          </p>
          <div className="hero__cta">
            <button className="btn btn-primary" onClick={() => navigate('/catalog')}>
              Shop Collection →
            </button>
          </div>
        </div>
      </div>

      {/* ---- Newest Arrivals ---- */}
      <section>
        <div className="container">
          <div className="section-header">
            <div className="section-label">Latest Drops</div>
            <h2 className="section-title">Newest Arrivals</h2>
          </div>
          <div className="product-grid">
            {newest.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ---- Featured Collection ---- */}
      <section>
        <div className="container">
          <div className="section-header">
            <div className="section-label">Handpicked</div>
            <h2 className="section-title">Featured Collection</h2>
          </div>
          <div className="product-grid">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ---- Collections ---- */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-label">Shop By</div>
            <h2 className="section-title">Collections</h2>
          </div>
          <div className="collections-grid">
            <div className="collection-card" onClick={() => navigate('/catalog/collection/ascension')} role="button" tabIndex={0}>
              <div className="collection-card__image">
                <img src="https://res.cloudinary.com/dimdro5dm/image/upload/v1772361719/MPPxAXO_9721.jpg_1_zjtm6g.jpg" alt="Ascension Collection" />
              </div>
              <h3 className="collection-card__title">Ascension</h3>
              <p className="collection-card__desc">Elevate your style with premium pieces</p>
            </div>
            <div className="collection-card" onClick={() => navigate('/catalog/collection/night-crawler')} role="button" tabIndex={0}>
              <div className="collection-card__image">
                <img src="https://res.cloudinary.com/dimdro5dm/image/upload/v1772361709/DSC08858_bzwbc5.png" alt="Night Crawler Collection" />
              </div>
              <h3 className="collection-card__title">Night Crawler</h3>
              <p className="collection-card__desc">Dark and bold streetwear essentials</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Why AXO ---- */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="section-label">Our Promise</div>
          <h2 className="section-title" style={{ marginBottom: '3rem' }}>Why AXO?</h2>
          <div className="why-grid">
            <div>
              <div className="why-item__icon">🌿</div>
              <h3 className="why-item__title">Sustainable</h3>
              <p className="why-item__desc">Ethically sourced materials from certified suppliers</p>
            </div>
            <div>
              <div className="why-item__icon">✦</div>
              <h3 className="why-item__title">Premium Quality</h3>
              <p className="why-item__desc">Crafted to last through every season and trend</p>
            </div>
          </div>
        </div>
      </section>

      <Toast message={toast} onDone={() => setToast('')} />
    </main>
  );
}
