import React, { useState, useEffect } from 'react';
import { X, Mail, ExternalLink, Copy, Check, RefreshCw, Sparkles, Inbox } from 'lucide-react';
import { authApi } from '../services/api';

export default function MailDrawer({ isOpen, onClose, addToast }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await authApi.getDevEmails();
      setEmails(res.emails || []);
    } catch (err) {
      console.warn('Could not fetch emails:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmails();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyOtp = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    addToast({
      type: 'info',
      title: 'Code Copied',
      message: `Code ${code} copied to clipboard!`,
    });
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(12, 16, 26, 0.95)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Mail size={18} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                Nodemailer Dispatched Mails
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Live preview of verification & reset emails
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="btn-ghost"
              onClick={fetchEmails}
              disabled={loading}
              title="Refresh inbox"
              style={{ padding: '6px' }}
            >
              <RefreshCw size={16} className={loading ? 'live-pulse' : ''} />
            </button>
            <button className="btn-ghost" onClick={onClose} style={{ padding: '6px' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
          {emails.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
              <Inbox size={42} style={{ marginBottom: '1rem', opacity: 0.4 }} />
              <p style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                No emails dispatched yet
              </p>
              <p style={{ fontSize: '0.8rem', maxWidth: '280px', margin: '0.5rem auto 0' }}>
                Register a new account or trigger a password reset to see Nodemailer deliver emails in real time!
              </p>
            </div>
          ) : (
            emails.map((mail) => (
              <div key={mail.id} className="email-card">
                <div className="email-header-line">
                  <span
                    className={`email-tag ${
                      mail.type === 'PASSWORD_RESET' ? 'reset' : 'verification'
                    }`}
                  >
                    {mail.type === 'PASSWORD_RESET' ? 'Password Reset' : 'OTP Verification'}
                  </span>
                  <span className="email-time">
                    {new Date(mail.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <div className="email-to">
                  To: <strong>{mail.to}</strong>
                </div>

                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {mail.subject}
                </div>

                {/* Highlighted OTP Code */}
                {mail.otpCode && (
                  <div className="email-otp-highlight">
                    <div>
                      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        Passcode / OTP
                      </span>
                      <div className="email-otp-digits">{mail.otpCode}</div>
                    </div>
                    <button
                      className="demo-fill-btn"
                      onClick={() => handleCopyOtp(mail.id, mail.otpCode)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {copiedId === mail.id ? <Check size={13} color="var(--emerald)" /> : <Copy size={13} />}
                      <span>{copiedId === mail.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}

                {/* Ethereal Mail Link */}
                {mail.previewUrl && (
                  <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                    <a
                      href={mail.previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.78rem',
                        color: 'var(--primary)',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                    >
                      <span>Open Rendered HTML Email</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'rgba(12, 16, 26, 0.95)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>Powered by Nodemailer & Ethereal</span>
          <span style={{ color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="status-indicator-dot online"></span> Active
          </span>
        </div>
      </div>
    </div>
  );
}
