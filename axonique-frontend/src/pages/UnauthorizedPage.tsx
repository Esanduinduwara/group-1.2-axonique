import { useNavigate } from 'react-router-dom';

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <main style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <section style={{ textAlign: 'center', maxWidth: '520px' }}>
        <h1 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>Unauthorized</h1>
        <p style={{ marginBottom: '1.25rem', opacity: 0.8 }}>
          You do not have permission to access this page.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            border: '1px solid #1f1f1f',
            background: 'transparent',
            color: '#1f1f1f',
            padding: '0.65rem 1.1rem',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Back to Home
        </button>
      </section>
    </main>
  );
}
