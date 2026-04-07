import React, { useState } from 'react';
import '../pages/EmailVerificationPage.css';

interface EmailVerificationInputProps {
  onVerificationComplete: (code: string) => void;
  onResendCode: () => void;
  isLoading?: boolean;
  resendTimer?: number;
}

/**
 * Reusable Email Verification Input Component
 * Can be used in modals or as part of other workflows
 */
const EmailVerificationInput: React.FC<EmailVerificationInputProps> = ({
  onVerificationComplete,
  onResendCode,
  isLoading = false,
  resendTimer = 0
}) => {
  const [verificationCode, setVerificationCode] = useState('');

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(value);

    if (value.length === 6) {
      onVerificationComplete(value);
    }
  };

  const handleResend = () => {
    setVerificationCode('');
    onResendCode();
  };

  return (
    <div className="verification-input-component">
      <div className="form-group">
        <label>Verification Code</label>
        <div className="code-input-container">
          <input
            type="text"
            placeholder="000000"
            value={verificationCode}
            onChange={handleCodeChange}
            maxLength={6}
            className="code-input"
            disabled={isLoading}
            autoFocus
          />
          <div className="code-counter">
            {verificationCode.length}/6
          </div>
        </div>
        <p className="help-text">Enter the 6-digit code from your email</p>
      </div>

      <div className="resend-section">
        <p className="resend-text">Didn't receive the code?</p>
        <button
          type="button"
          className="resend-button"
          onClick={handleResend}
          disabled={resendTimer > 0 || isLoading}
        >
          {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
        </button>
      </div>
    </div>
  );
};

export default EmailVerificationInput;
