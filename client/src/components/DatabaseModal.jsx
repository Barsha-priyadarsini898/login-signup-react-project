import React, { useState } from 'react';
import { X, Database, Copy, Check, ExternalLink, ShieldCheck, Terminal, CheckCircle2 } from 'lucide-react';

const SQL_SCHEMA = `-- Supabase SQL Schema for AuthSphere
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_otp TEXT,
    otp_expires_at TIMESTAMPTZ,
    reset_token TEXT,
    reset_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast email searches
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow backend API access" ON public.users FOR ALL USING (true) WITH CHECK (true);`;

export default function DatabaseModal({ isOpen, onClose, dbStatus, addToast }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isSupabaseLive = dbStatus?.mode === 'supabase_live';

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast({
      type: 'success',
      title: 'SQL Copied',
      message: 'Supabase table schema copied to clipboard.',
    });
  };

  return (
    <div className="drawer-backdrop" onClick={onClose} style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div
        className="glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90%',
          maxWidth: '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2rem',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          className="btn-ghost"
          onClick={onClose}
          style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', padding: '6px' }}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: isSupabaseLive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: isSupabaseLive ? 'var(--emerald)' : 'var(--amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Database size={22} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
              Database & Supabase Integration
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Live PostgreSQL database management
            </p>
          </div>
        </div>

        {/* Current Connection Status Box */}
        <div
          style={{
            background: 'rgba(10, 15, 26, 0.8)',
            border: `1px solid ${isSupabaseLive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
              Connection Status
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: isSupabaseLive ? 'var(--emerald)' : 'var(--amber)',
              }}
            >
              <span className={`status-indicator-dot ${isSupabaseLive ? 'online' : 'warning'}`}></span>
              {isSupabaseLive ? 'Connected to Supabase' : 'Local Fallback Storage Active'}
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {dbStatus?.message || 'Database configured.'}
          </div>
        </div>

        {/* Step-by-step Setup Guide */}
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          Connect Your Supabase Project (3 Easy Steps)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.2)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              1
            </div>
            <div>
              Create a free project at{' '}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}
              >
                supabase.com <ExternalLink size={12} style={{ display: 'inline' }} />
              </a>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.2)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              2
            </div>
            <div>
              Add your <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> into{' '}
              <span style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>server/.env</span>.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.2)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              3
            </div>
            <div>
              Open the Supabase <strong>SQL Editor</strong>, paste and run the table schema below:
            </div>
          </div>
        </div>

        {/* SQL Schema Code Snippet */}
        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              schema.sql (PostgreSQL)
            </span>
            <button
              className="btn-ghost"
              onClick={handleCopySql}
              style={{ padding: '4px 10px', fontSize: '0.8rem', color: copied ? 'var(--emerald)' : 'var(--text-primary)' }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy SQL Script'}</span>
            </button>
          </div>
          <pre className="code-block" style={{ maxHeight: '180px' }}>
            <code>{SQL_SCHEMA}</code>
          </pre>
        </div>

        {/* Modal Action */}
        <button
          className="btn-primary"
          onClick={onClose}
          style={{ width: '100%' }}
        >
          Got It
        </button>
      </div>
    </div>
  );
}
