import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './SignInPage.css';
import Modal from '../components/Modal';
import { authService } from '../services/authService';

export default function SignInPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error'
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        authService.saveAuth(data.token, {
          username: data.username,
          email: data.email,
          role: (data.role || 'CUSTOMER') as 'ADMIN' | 'STAFF' | 'CUSTOMER',
        });

        setModal({
          isOpen: true,
          title: 'Login Successful',
          message: `Welcome back, ${data.username}!`,
          type: 'success'
        });
      } else {
        const errorText = await response.text();
        setModal({
          isOpen: true,
          title: 'Login Failed',
          message: errorText || 'Invalid username or password.',
          type: 'error'
        });
      }
    } catch (error) {
      setModal({
        isOpen: true,
        title: 'Connection Error',
        message: 'Could not connect to the server. Please try again later.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
    if (modal.type === 'success') {
      navigate('/');
    }
  };

  return (
    <div className="page signin-page">
      <div className="container signin-container">
        <h1 className="section-title">Log In</h1>
        <p className="signin-subtitle">Welcome back to AXO.</p>

        <form className="signin-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username or Email</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Your username or email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="signin-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="signin-footer">
          <p>
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
          <p className="reset-password-link">
            Joined AXO? <Link to="/reset-password">Reset Password</Link>
          </p>
        </div>
      </div>

      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </div>
  );
}
