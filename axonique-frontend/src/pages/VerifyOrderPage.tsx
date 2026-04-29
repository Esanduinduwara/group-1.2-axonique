import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './VerifyOrderPage.css';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

type VerifyState = 'loading' | 'success' | 'error';

export default function VerifyOrderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);
  const [state, setState] = useState<VerifyState>('loading');
  const [message, setMessage] = useState('Validating verification link...');

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('Verification link is invalid or missing.');
      return;
    }

    fetch(`${API}/api/orders/verify?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Verification link is invalid or has expired.');
        }
        setState('success');
        setMessage(`Order purchase successful! Thank you for your order. Your order ID is #${data?.data?.id ?? 'N/A'}.`);
      })
      .catch((err: Error) => {
        setState('error');
        setMessage(err.message || 'This verification link is invalid or has expired. Please request a new verification email.');
      });
  }, [token]);

  return (
    <main className="verify-order-page">
      <section className="verify-order-card">
        <h1 className="verify-order-title">Order Verification</h1>
        <p className={`verify-order-message ${state === 'success' ? 'success' : state === 'error' ? 'error' : ''}`}>
          {message}
        </p>

        <div className="verify-order-actions">
          <button type="button" onClick={() => navigate('/')}>
            Continue to Store
          </button>
        </div>
      </section>
    </main>
  );
}
