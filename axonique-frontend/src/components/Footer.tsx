// Shared Footer component

import { useNavigate } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="footer">
      {/* Newsletter */}
      <div className="footer__newsletter">
        <h2 className="footer__newsletter-title">Subscribe to our emails</h2>
        <form
          className="footer__newsletter-form"
          onSubmit={(e) => {
            e.preventDefault();
            (e.target as HTMLFormElement).reset();
            alert('✓ Successfully subscribed!');
          }}
        >
          <input type="email" placeholder="Email" required aria-label="Email for newsletter" />
          <button type="submit" aria-label="Subscribe">→</button>
        </form>
      </div>

      {/* Bottom bar */}
      <div className="footer__bottom">
        <p>© 2026, <strong>AXO</strong></p>
        <nav className="footer__links" aria-label="Footer navigation">
          <button onClick={() => navigate('/contact')}>Contact</button>
          <button onClick={() => navigate('/privacy')}>Privacy policy</button>
          <button onClick={() => navigate('/shipping')}>Shipping policy</button>
          <button onClick={() => navigate('/refund')}>Refund policy</button>
          <button onClick={() => navigate('/terms')}>Terms of service</button>
        </nav>
      </div>
    </footer>
  );
}
