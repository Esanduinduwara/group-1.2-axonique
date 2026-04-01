import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChangePasswordPage.css';
import Modal from '../components/Modal';
import { authService } from '../services/authService';

export default function ChangePasswordPage() {
    const navigate = useNavigate();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [securityQuestions, setSecurityQuestions] = useState<string[]>([]);
    const [selectedQuestion, setSelectedQuestion] = useState('');
    const [securityAnswer, setSecurityAnswer] = useState('');
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

    useEffect(() => {
        if (!authService.isAuthenticated()) {
            setModal({
                isOpen: true,
                title: 'Authentication Required',
                message: 'Please sign in to change your password.',
                type: 'error'
            });
            setTimeout(() => {
                navigate('/signin');
            }, 2000);
        } else {
            // Fetch security questions
            fetchQuestions();
        }
    }, [navigate]);

    const fetchQuestions = async () => {
        try {
            const authHeader = authService.getAuthHeader();
            const response = await fetch('http://localhost:8080/api/auth/questions', {
                headers: {
                    ...authHeader as any
                }
            });
            if (response.ok) {
                const data = await response.json();
                setSecurityQuestions(data);
            }
        } catch (error) {
            console.error('Failed to fetch security questions', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmNewPassword) {
            setModal({
                isOpen: true,
                title: 'Validation Error',
                message: 'New passwords do not match.',
                type: 'error'
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const headers = new Headers();
            headers.append('Content-Type', 'application/json');
            const authHeader = authService.getAuthHeader();
            if (authHeader.Authorization) {
                headers.append('Authorization', authHeader.Authorization);
            }

            const response = await fetch('http://localhost:8080/api/auth/change-password', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    confirmNewPassword,
                    securityQuestion: selectedQuestion,
                    securityAnswer
                }),
            });

            const data = await response.text();

            if (response.ok) {
                setModal({
                    isOpen: true,
                    title: 'Success',
                    message: 'Your password has been changed successfully. Please sign in again with your new password.',
                    type: 'success'
                });

                // Logout and redirect to signin
                authService.logout();
                setTimeout(() => {
                    navigate('/signin');
                }, 3000);
            } else {
                setModal({
                    isOpen: true,
                    title: 'Update Failed',
                    message: data || 'Failed to change password. Please check your current password.',
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
        if (modal.type === 'success' || modal.title === 'Authentication Required') {
            navigate('/signin');
        }
    };

    return (
        <div className="page change-password-page">
            <div className="container change-password-container">
                <h1 className="section-title">Change Password</h1>
                <p className="change-password-subtitle">Keep your account secure.</p>

                <form className="change-password-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="currentPassword">Current Password</label>
                        <input
                            type="password"
                            id="currentPassword"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="newPassword">New Password</label>
                        <input
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmNewPassword">Confirm New Password</label>
                        <input
                            type="password"
                            id="confirmNewPassword"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="security-verification-section">
                        <h3 className="section-subtitle">Security Verification</h3>
                        <p className="section-help">Choose 1 of your security questions to verify identity.</p>

                        <div className="form-group">
                            <select
                                value={selectedQuestion}
                                onChange={(e) => setSelectedQuestion(e.target.value)}
                                required
                                className="security-select"
                            >
                                <option value="">Select a Question</option>
                                {securityQuestions.map(q => <option key={q} value={q}>{q}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <input
                                type="text"
                                value={securityAnswer}
                                onChange={(e) => setSecurityAnswer(e.target.value)}
                                required
                                placeholder="Enter your answer"
                            />
                        </div>
                    </div>

                    <button type="submit" className="change-password-btn" disabled={isSubmitting}>
                        {isSubmitting ? 'Updating...' : 'Change Password'}
                    </button>

                    <button
                        type="button"
                        className="cancel-btn"
                        onClick={() => navigate(-1)}
                    >
                        Cancel
                    </button>
                </form>
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
