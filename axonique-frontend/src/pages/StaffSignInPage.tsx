import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignInPage.css'; // Reuse styles
import Modal from '../components/Modal';
import { authService } from '../services/authService';

export default function StaffSignInPage() {
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
      const response = await fetch(''+(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080')+'/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.role !== 'STAFF' && data.role !== 'ADMIN') {
            setModal({
                isOpen: true,
                title: 'Access Denied',
                message: 'This portal is for staff members only.',
                type: 'error'
            });
            return;
        }

        authService.saveAuth(data.token, { 
          username: data.username, 
          email: data.email, 
          role: data.role as 'ADMIN' | 'STAFF' | 'CUSTOMER' 
        });

        setModal({
          isOpen: true,
          title: 'Staff Login Successful',
          message: `Welcome to the Operations Hub, ${data.username}!`,
          type: 'success'
        });
      } else {
        const errorText = await response.text();
        setModal({
          isOpen: true,
          title: 'Login Failed',
          message: errorText || 'Invalid credentials.',
          type: 'error'
        });
      }
    } catch (error) {
      setModal({
        isOpen: true,
        title: 'Connection Error',
        message: 'Could not connect to the staff server.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
    if (modal.type === 'success') {
      const user = authService.getUser();
      if (user?.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/staff/dashboard');
      }
    }
  };

  return (
    <div className="page signin-page staff-signin">
      <div className="container signin-container">
        <h1 className="section-title">Staff Portal</h1>
        <p className="signin-subtitle">Log in to manage operations.</p>

        <form className="signin-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Staff Identifier</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Username or Staff Email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Security Key</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="signin-btn staff-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Authenticating...' : 'Enter Hub →'}
          </button>
        </form>

        <div className="signin-footer">
          <p>
            Issues logging in? Contact System Admin.
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
