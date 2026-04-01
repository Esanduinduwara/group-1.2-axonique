// Shared Toast notification component

import { useEffect, useState } from 'react';
import './Toast.css';

interface ToastProps {
  message: string;
  onDone: () => void;
}

export default function Toast({ message, onDone }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 2500);
    return () => clearTimeout(timer);
  }, [message, onDone]);

  if (!message) return null;

  return (
    <div className={`toast${visible ? ' toast--show' : ''}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
