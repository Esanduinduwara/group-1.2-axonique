import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ResetPasswordPage.css';
import Modal from '../components/Modal';

const ResetPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        newPassword: '',
        confirmNewPassword: ''
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
