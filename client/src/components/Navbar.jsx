import React from 'react';
import { Shield, Database, Mail, LogOut, User } from 'lucide-react';

export default function Navbar({
  user,
  dbStatus,
  unreadEmailsCount,
  onOpenMailDrawer,
  onOpenDbModal,
  onLogout,
}) {
  const isSupabaseLive = dbStatus?.mode === 'supabase_live';

  return (
    <nav className="navbar">
      {/* Brand */}
      <a href="#" className="brand" onClick={(e) => { e.preventDefault(); }}>
        <div className="brand-icon-wrapper">
          <Shield size={22} />
        </div>
        <span>
          Auth<span className="brand-gradient">Sphere</span>
        </span>
      </a>

      {/* Nav Actions */}
      <div className="nav-actions">
        {/* Database Status Pill */}
        <button
          className="status-pill"
          onClick={onOpenDbModal}
          title="Click to view Supabase configuration"
          style={{ cursor: 'pointer' }}
        >
          <Database size={15} color={isSupabaseLive ? '#10b981' : '#f59e0b'} />
          <span className={`status-indicator-dot ${isSupabaseLive ? 'online' : 'warning'}`}></span>
          <span>{isSupabaseLive ? 'Supabase Live' : 'Local Fallback DB'}</span>
        </button>

        {/* Nodemailer Live Inbox Pill */}
        <button
          className="status-pill"
          onClick={onOpenMailDrawer}
          title="Open Nodemailer Sent Mails & Preview URLs"
          style={{ cursor: 'pointer' }}
        >
          <Mail size={15} color="#818cf8" />
          <span>Mail Drawer</span>
          {unreadEmailsCount > 0 && (
            <span
              style={{
                background: 'linear-gradient(135deg, #6366f1, #d946ef)',
                color: '#fff',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '999px',
                marginLeft: '2px',
              }}
            >
              {unreadEmailsCount}
            </span>
          )}
        </button>

        {/* User profile or sign out */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                display: 'none',
              }}
              className="user-greeting"
            >
              Hi, {user.fullName?.split(' ')[0]}
            </span>
            <button
              className="btn-ghost"
              onClick={onLogout}
              title="Sign Out"
              style={{ color: '#fda4af' }}
            >
              <LogOut size={16} />
              <span style={{ fontSize: '0.85rem' }}>Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
