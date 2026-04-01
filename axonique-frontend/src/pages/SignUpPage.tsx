import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './SignUpPage.css';
import Modal from '../components/Modal';

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "In what city were you born?",
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What is your favorite book?",
  "What is your favorite movie?",
  "What was your first car?",
  "What is your father's middle name?",
  "In what city did your parents meet?",
  "What is the name of your favorite childhood friend?"
];

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    securityQuestion1: '',
    securityAnswer1: '',
    securityQuestion2: '',
    securityAnswer2: '',
    securityQuestion3: '',
    securityAnswer3: ''
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

    if (!formData.securityQuestion1 || !formData.securityAnswer1) newErrors.securityAnswer1 = 'Answer 1 is required';
    if (!formData.securityQuestion2 || !formData.securityAnswer2) newErrors.securityAnswer2 = 'Answer 2 is required';
    if (!formData.securityQuestion3 || !formData.securityAnswer3) newErrors.securityAnswer3 = 'Answer 3 is required';

    const questions = [formData.securityQuestion1, formData.securityQuestion2, formData.securityQuestion3].filter(Boolean);
    if (new Set(questions).size !== 3 && questions.length === 3) {
      newErrors.securityQuestions = 'Please select three different security questions';
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
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.text();

      if (response.ok) {
        setModal({
          isOpen: true,
          title: 'Registration Successful',
          message: data,
          type: 'success'
        });
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          securityQuestion1: '',
          securityAnswer1: '',
          securityQuestion2: '',
          securityAnswer2: '',
          securityQuestion3: '',
          securityAnswer3: ''
        });
      } else {
        setModal({
          isOpen: true,
          title: 'Registration Failed',
          message: data || 'An error occurred. Please try again.',
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

            <div className="security-questions-section">
              <h3>Security Questions</h3>
              <p className="section-help">Choose 3 unique questions for account recovery.</p>

              <div className="form-group">
                <select
                  name="securityQuestion1"
                  value={formData.securityQuestion1}
                  onChange={(e: any) => handleChange(e)}
                  className="security-select"
                >
                  <option value="">Select Question 1</option>
                  {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
                <input
                  type="text"
                  name="securityAnswer1"
                  value={formData.securityAnswer1}
                  onChange={handleChange}
                  placeholder="Answer 1"
                />
              </div>

              <div className="form-group">
                <select
                  name="securityQuestion2"
                  value={formData.securityQuestion2}
                  onChange={(e: any) => handleChange(e)}
                  className="security-select"
                >
                  <option value="">Select Question 2</option>
                  {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
                <input
                  type="text"
                  name="securityAnswer2"
                  value={formData.securityAnswer2}
                  onChange={handleChange}
                  placeholder="Answer 2"
                />
              </div>

              <div className="form-group">
                <select
                  name="securityQuestion3"
                  value={formData.securityQuestion3}
                  onChange={(e: any) => handleChange(e)}
                  className="security-select"
                >
                  <option value="">Select Question 3</option>
                  {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
                <input
                  type="text"
                  name="securityAnswer3"
                  value={formData.securityAnswer3}
                  onChange={handleChange}
                  placeholder="Answer 3"
                />
              </div>

              {errors.securityQuestions && <div className="error-message global-security-error">{errors.securityQuestions}</div>}
              {(errors.securityAnswer1 || errors.securityAnswer2 || errors.securityAnswer3) &&
                <div className="error-message">All security questions must be answered</div>
              }
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
