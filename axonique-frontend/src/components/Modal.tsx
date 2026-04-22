import React from 'react';
import './Modal.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type: 'success' | 'error';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, message, type }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className={`modal-header ${type}`}>
                    <h2>{title}</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div className="modal-footer">
                    <button className={`modal-btn ${type}`} onClick={onClose}>
                        {type === 'success' ? 'Continue' : 'Try Again'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;
