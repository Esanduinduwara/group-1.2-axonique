import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './EmailVerificationPage.css';
import Modal from '../components/Modal';

interface VerificationState {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

const EmailVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [verificationCode, setVerificationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [registrationData, setRegistrationData] = useState<VerificationState | null>(null);
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success' as 'success' | 'error'
  });

  // Get registration data from navigation state
  useEffect(() => {
    const state = location.state as VerificationState;
    if (!state || !state.email) {
      navigate('/signup');
      return;
    }
    setRegistrationData(state);
  }, [location, navigate]);

  // Timer for resend code button
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleVerificationCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(value);
  };

  const handleResendCode = async () => {
    if (!registrationData) return;

    try {
      const response = await fetch(`http://localhost:8080/sendMail/${registrationData.email}`, {
        method: 'GET',
      });

      if (response.ok) {
        setModal({
          isOpen: true,
          title: 'Code Sent',
          message: 'A new verification code has been sent to your email.',
          type: 'success'
        });
        setResendTimer(60);
      } else {
        setModal({
          isOpen: true,
          title: 'Error',
          message: 'Failed to resend verification code. Please try again.',
          type: 'error'
        });
      }
    } catch (error) {
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'An error occurred while resending the code.',
        type: 'error'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode) {
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'Please enter the verification code.',
        type: 'error'
      });
      return;
    }

    if (verificationCode.length !== 6) {
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'Verification code must be 6 digits.',
        type: 'error'
      });
      return;
    }

    if (!registrationData) {
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'Registration data is missing.',
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`http://localhost:8080/api/auth/register/${verificationCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: registrationData.username,
          email: registrationData.email,
          password: registrationData.password,
          confirmPassword: registrationData.confirmPassword,
        }),
      });

      const data = await response.text();

      if (response.ok) {
        setModal({
          isOpen: true,
          title: 'Email Verified!',
          message: 'Your account has been created successfully. You can now log in.',
          type: 'success'
        });

        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/signin');
        }, 2000);
      } else {
        setModal({
          isOpen: true,
          title: 'Verification Failed',
          message: data || 'Invalid verification code. Please try again.',
          type: 'error'
        });
      }
    } catch (error) {
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'An error occurred during verification. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!registrationData) {
    return null;
  }

  return (
    <div className="verification-page-container">
      <div className="verification-container">
        <div className="verification-card">
          {/* Header */}
          <div className="verification-header">
            <div className="verification-icon">✓</div>
            <h1>Verify Your Email</h1>
            <p>Check your inbox for the verification code</p>
          </div>

          {/* Email Display */}
          <div className="email-display">
            <p>Verification code sent to:</p>
            <p className="email-text">{registrationData.email}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="verification-form">
            <div className="form-group">
              <label>Verification Code</label>
              <div className="code-input-container">
                <input
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={handleVerificationCodeChange}
                  maxLength={6}
                  className="code-input"
                  disabled={isSubmitting}
                  autoFocus
                />
                <div className="code-counter">
                  {verificationCode.length}/6
                </div>
              </div>
              <p className="help-text">Enter the 6-digit code from your email</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="verify-button"
              disabled={isSubmitting || verificationCode.length !== 6}
            >
              {isSubmitting ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          {/* Resend Code Section */}
          <div className="resend-section">
            <p className="resend-text">Didn't receive the code?</p>
            <button
              type="button"
              className="resend-button"
              onClick={handleResendCode}
              disabled={resendTimer > 0 || isSubmitting}
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
            </button>
          </div>

          {/* Footer Note */}
          <div className="verification-footer">
            <p>
              This code will expire in <span>10 minutes</span>
            </p>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={() => {
          setModal({ ...modal, isOpen: false });
        }}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </div>
  );
};

export default EmailVerificationPage;
