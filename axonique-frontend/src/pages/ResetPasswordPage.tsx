import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ResetPasswordPage.css';
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

const ResetPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        newPassword: '',
        confirmNewPassword: '',
        securityQuestion1: '',
        securityAnswer1: '',
        securityQuestion2: '',
        securityAnswer2: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'success' as 'success' | 'error'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validate = () => {
        if (formData.newPassword !== formData.confirmNewPassword) {
            setModal({
                isOpen: true,
                title: 'Error',
                message: 'Passwords do not match',
                type: 'error'
            });
            return false;
        }
        if (formData.securityQuestion1 === formData.securityQuestion2) {
            setModal({
                isOpen: true,
                title: 'Error',
                message: 'Please select two different security questions',
                type: 'error'
            });
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            const response = await fetch('http://localhost:8080/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.text();

            if (response.ok) {
                setModal({
                    isOpen: true,
                    title: 'Success',
                    message: data,
                    type: 'success'
                });
                setTimeout(() => {
                    navigate('/signin');
                }, 2000);
            } else {
                let errorMessage = 'Failed to reset password. Please check your details.';
                try {
                    // Try to see if there's a more specific message, but fallback to generic
                    if (data) errorMessage = data;
                } catch (e) { }

                setModal({
                    isOpen: true,
                    title: 'Error',
                    message: errorMessage,
                    type: 'error'
                });
            }
        } catch (error) {
            setModal({
                isOpen: true,
                title: 'Error',
                message: 'Network error. Please try again later.',
                type: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="reset-password-page">
            <div className="reset-password-container">
                <div className="reset-password-card">
                    <div className="reset-password-header">
                        <h1>Reset Password</h1>
                        <p>Verify identity to update your password</p>
                    </div>

                    <form onSubmit={handleSubmit} className="reset-password-form">
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="name@example.com"
                            />
                        </div>

                        <div className="form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                required
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                name="confirmNewPassword"
                                value={formData.confirmNewPassword}
                                onChange={handleChange}
                                required
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="security-section">
                            <h3>Security Verification</h3>
                            <p className="security-help">Answer 2 of your security questions correctly.</p>

                            <div className="form-group">
                                <select
                                    name="securityQuestion1"
                                    value={formData.securityQuestion1}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Question 1</option>
                                    {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                                </select>
                                <input
                                    type="text"
                                    name="securityAnswer1"
                                    value={formData.securityAnswer1}
                                    onChange={handleChange}
                                    required
                                    placeholder="Answer 1"
                                    style={{ marginTop: '0.5rem' }}
                                />
                            </div>

                            <div className="form-group">
                                <select
                                    name="securityQuestion2"
                                    value={formData.securityQuestion2}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Question 2</option>
                                    {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                                </select>
                                <input
                                    type="text"
                                    name="securityAnswer2"
                                    value={formData.securityAnswer2}
                                    onChange={handleChange}
                                    required
                                    placeholder="Answer 2"
                                    style={{ marginTop: '0.5rem' }}
                                />
                            </div>
                        </div>

                        <button type="submit" className="reset-password-btn" disabled={isSubmitting}>
                            {isSubmitting ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                </div>
            </div>

            <Modal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                title={modal.title}
                message={modal.message}
                type={modal.type}
            />
        </div>
    );
};

export default ResetPasswordPage;
