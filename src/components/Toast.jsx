import { useEffect, useState } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: { bg: '#0d9488', icon: '✓' },
    error: { bg: '#dc2626', icon: '✕' },
    info: { bg: '#2563eb', icon: 'ℹ' },
  };

  const { bg, icon } = colors[type] || colors.success;

  return (
    <div style={{
      position: 'fixed', bottom: 32, right: 32, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 12,
      background: bg, color: '#fff', padding: '14px 20px',
      borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      fontSize: 14, fontWeight: 500, minWidth: 240,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      opacity: visible ? 1 : 0,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      fontFamily: 'inherit',
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: '50%',
        background: 'rgba(255,255,255,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, flexShrink: 0,
      }}>
        {icon}
      </span>
      {message}
    </div>
  );
}