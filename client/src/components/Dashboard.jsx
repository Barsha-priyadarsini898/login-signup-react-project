import React, { useState } from 'react';
import {
  User,
  Mail,
  ShieldCheck,
  Calendar,
  Key,
  Database,
  Send,
  LogOut,
  Edit2,
  Check,
  Copy,
  CheckCircle,
  ExternalLink,
  Activity,
  Layers,
} from 'lucide-react';
import { authApi } from '../services/api';

export default function Dashboard({
  user,
  onUserUpdate,
  onLogout,
  dbStatus,
  onOpenMailDrawer,
  onOpenDbModal,
  addToast,
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user.fullName || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [isSendingTestMail, setIsSendingTestMail] = useState(false);

  const token = localStorage.getItem('auth_token') || 'eyJhbGciOi...';
  const isSupabaseLive = dbStatus?.mode === 'supabase_live';

  // Get user initials
  const initials = (user.fullName || 'User')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Save Name
  const handleSaveName = async () => {
    if (!nameInput.trim()) {
      addToast({
        type: 'warning',
        title: 'Invalid Name',
        message: 'Name cannot be blank.',
      });
      return;
    }

    setIsSavingName(true);
    try {
      const res = await authApi.updateProfile({ fullName: nameInput });
      onUserUpdate(res.user);
      setIsEditingName(false);
      addToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your name has been updated successfully.',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Could not update name.',
      });
    } finally {
      setIsSavingName(false);
    }
  };

  // Copy JWT
  const handleCopyToken = () => {
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
    addToast({
      type: 'info',
      title: 'Token Copied',
      message: 'JWT Bearer token copied to clipboard.',
    });
  };

  // Dispatch self test reset email
  const handleSendTestEmail = async () => {
    setIsSendingTestMail(true);
    try {
      const res = await authApi.forgotPassword(user.email);
      addToast({
        type: 'success',
        title: 'Nodemailer Dispatched',
        message: 'Security test email sent! Open the Mail Drawer to view it.',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Failed',
        message: err.message,
      });
    } finally {
      setIsSendingTestMail(false);
    }
  };

  // Format date
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  return (
    <div className="dashboard-grid">
      {/* Left Column: User Profile Card */}
      <div className="glass-card profile-card">
        <div className="avatar-wrapper">
          <div className="avatar-circle">{initials}</div>
          {user.isVerified && (
            <div className="verified-badge" title="Email Verified">
              <ShieldCheck size={15} />
            </div>
          )}
        </div>

        {/* Name with inline edit */}
        {isEditingName ? (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', width: '100%' }}>
            <input
              type="text"
              className="form-input"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              autoFocus
              style={{ padding: '0.5rem' }}
            />
            <button
              className="btn-primary"
              onClick={handleSaveName}
              disabled={isSavingName}
              style={{ width: 'auto', padding: '0.5rem 0.75rem' }}
            >
              <Check size={16} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 className="profile-name">{user.fullName}</h2>
            <button
              className="btn-ghost"
              onClick={() => setIsEditingName(true)}
              style={{ padding: '4px', color: 'var(--text-muted)' }}
              title="Edit Name"
            >
              <Edit2 size={14} />
            </button>
          </div>
        )}

        <div className="profile-email">{user.email}</div>

        {/* Verification Status Pill */}
        <div style={{ marginBottom: '1.25rem' }}>
          {user.isVerified ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--emerald)',
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              <ShieldCheck size={13} />
              <span>Email Verified</span>
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--amber)',
                background: 'rgba(245, 158, 11, 0.1)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
              }}
            >
              <span>Pending Verification</span>
            </span>
          )}
        </div>

        {/* Stats Row */}
        <div className="profile-stats-row">
          <div className="stat-item">
            <div className="stat-label">Member Since</div>
            <div className="stat-value">{memberSince}</div>
          </div>
          <div className="stat-item" style={{ borderLeft: '1px solid var(--border-subtle)' }}>
            <div className="stat-label">Role</div>
            <div className="stat-value">Authenticated</div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          className="btn-secondary"
          onClick={onLogout}
          style={{ width: '100%', borderColor: 'rgba(244, 63, 94, 0.3)', color: '#fda4af' }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Right Column: Details & Integrations */}
      <div className="dashboard-main">
        {/* Supabase Status Card */}
        <div className="glass-card section-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="section-title">
                <Database size={18} color={isSupabaseLive ? '#10b981' : '#f59e0b'} />
                <span>Database Status: {isSupabaseLive ? 'Supabase PostgreSQL' : 'Local Fallback'}</span>
              </div>
              <p className="section-desc">
                {isSupabaseLive
                  ? 'Your account records and credentials are saved in Supabase database.'
                  : 'Currently running on local persistent datastore. Connect your Supabase project with one click!'}
              </p>
            </div>
            <button className="btn-secondary" onClick={onOpenDbModal} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
              <span>Configure</span>
              <ExternalLink size={13} />
            </button>
          </div>

          <div className="info-row">
            <span className="info-label">Current Mode</span>
            <span className="info-value">
              <span className={`status-indicator-dot ${isSupabaseLive ? 'online' : 'warning'}`}></span>
              {dbStatus?.mode || 'local_storage'}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">User UUID</span>
            <span className="info-value" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
              {user.id}
            </span>
          </div>
        </div>

        {/* Nodemailer Email Services Card */}
        <div className="glass-card section-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="section-title">
                <Mail size={18} color="#818cf8" />
                <span>Nodemailer Dispatched Mails</span>
              </div>
              <p className="section-desc">
                Nodemailer powers all one-time passwords, verification codes, and security notices.
              </p>
            </div>
            <button className="btn-secondary" onClick={onOpenMailDrawer} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
              <span>View Mail Drawer</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              className="btn-primary"
              onClick={handleSendTestEmail}
              disabled={isSendingTestMail}
              style={{
                width: 'auto',
                fontSize: '0.85rem',
                padding: '0.65rem 1.1rem',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                boxShadow: 'none',
              }}
            >
              <Send size={14} />
              <span>{isSendingTestMail ? 'Dispatching...' : 'Dispatch Test Security Email'}</span>
            </button>
          </div>
        </div>

        {/* Active Session & JWT Token Card */}
        <div className="glass-card section-box">
          <div className="section-title">
            <Key size={18} color="#06b6d4" />
            <span>Active Session Token (JWT)</span>
          </div>
          <p className="section-desc">
            Stateless JSON Web Token signed with HMAC-SHA256 for secure API requests.
          </p>

          <div
            style={{
              background: '#0a0f1d',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              color: '#94a3b8',
              wordBreak: 'break-all',
              gap: '1rem',
            }}
          >
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {token.substring(0, 48)}...
            </div>
            <button
              className="btn-ghost"
              onClick={handleCopyToken}
              style={{ flexShrink: 0, padding: '4px 8px', color: copiedToken ? 'var(--emerald)' : 'var(--text-primary)' }}
            >
              {copiedToken ? <CheckCircle size={15} /> : <Copy size={15} />}
              <span>{copiedToken ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
