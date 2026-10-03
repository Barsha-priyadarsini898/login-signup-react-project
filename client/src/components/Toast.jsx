import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function ToastContainer({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        let Icon = Info;
        let iconColor = 'var(--cyan)';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          iconColor = 'var(--emerald)';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          iconColor = 'var(--rose)';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          iconColor = 'var(--amber)';
        }

        return (
          <div key={toast.id} className={`toast ${toast.type || 'info'}`}>
            <Icon size={20} color={iconColor} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              {toast.title && (
                <div style={{ fontWeight: 600, marginBottom: '2px', color: '#f8fafc' }}>
                  {toast.title}
                </div>
              )}
              <div style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>{toast.message}</div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
