import { useState, useEffect } from 'react';
import './CursorGlow.css';

export default function CursorGlow() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      className="cursor-glow"
      style={{
        background: `radial-gradient(150px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 255, 255, 0.1), transparent)`
      }}
    />
  );
}
