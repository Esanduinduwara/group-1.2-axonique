import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './SignUpPage.css';
import Modal from '../components/Modal';

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.username) newErrors.username = 'Username is required';
    else if (formData.username.length < 3) newErrors.username = 'Username too short';

    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 chars';

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // First, send verification code to email
      const emailResponse = await fetch(`http://localhost:8080/sendMail/${formData.email}`, {
        method: 'GET',
      });

      if (emailResponse.ok) {
        // Navigate to email verification page with form data
        navigate('/verify-email', {
          state: {
            email: formData.email,
            username: formData.username,
            password: formData.password,
            confirmPassword: formData.confirmPassword
          }
        });
      } else {
        setModal({
          isOpen: true,
          title: 'Email Error',
          message: 'Failed to send verification code. Please try again.',
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
  };

  return (
    <div className="signup-page-container">
      <div className="signup-container">
        <div className="signup-card">
          <header className="signup-header">
            <h1>AxoNique</h1>
            <p>Create your account</p>
          </header>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                aria-invalid={errors.username ? 'true' : 'false'}
              />
              <div className="error-message">{errors.username}</div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                aria-invalid={errors.email ? 'true' : 'false'}
              />
              <div className="error-message">{errors.email}</div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                aria-invalid={errors.password ? 'true' : 'false'}
              />
              <div className="error-message">{errors.password}</div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Verify your password"
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
              />
              <div className="error-message">{errors.confirmPassword}</div>
            </div>

            <button
              type="submit"
              className="signup-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registering...' : 'Sign Up'}
            </button>
          </form>

          <p className="signup-footer" style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
            Already have an account? <Link to="/signin" style={{ color: 'var(--accent)', fontWeight: '600', textDecoration: 'none' }}>Sign in</Link>
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
};

export default SignUpPage;
