import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { authApi } from '../services/api';

export default function SignIn({
  onSuccess,
  onSwitchToSignUp,
  onForgotPassword,
  onRequiresVerification,
  addToast,
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Quick fill demo credentials
  const handleQuickFill = () => {
    setEmail('alex.mercer@example.com');
    setPassword('Password@123');
    addToast({
      type: 'info',
      title: 'Demo Filled',
      message: 'Demo credentials loaded. Click "Sign In" to continue!',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast({
        type: 'warning',
        title: 'Missing Fields',
        message: 'Please enter both your email address and password.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.login({ email, password });
      if (res.token) {
        localStorage.setItem('auth_token', res.token);
      }
      addToast({
        type: 'success',
        title: 'Welcome Back!',
        message: res.message || 'Signed in successfully.',
      });
      onSuccess(res.user);
    } catch (err) {
      // Check if user requires email verification
      if (err.data && err.data.requiresVerification) {
        addToast({
          type: 'warning',
          title: 'Verification Needed',
          message: err.data.message || 'Please verify your email address.',
        });
        onRequiresVerification(email, err.data.previewUrl, err.data.devOtp);
      } else {
        addToast({
          type: 'error',
          title: 'Sign In Failed',
          message: err.message || 'Invalid email or password.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-card-container">
      <div className="glass-card" style={{ padding: '2.5rem 2rem' }}>
        <div className="auth-header">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to manage your secure account and session</p>
        </div>

        <form onSubmit={handleSubmit} id="sign-in-form">
          {/* Email input */}
          <div className="form-group">
            <label className="form-label" htmlFor="signin-email">
              Email Address
            </label>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <Mail size={18} />
              </span>
              <input
                id="signin-email"
                type="email"
                className="form-input has-left-icon"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password input */}
          <div className="form-group">
            <div className="form-label">
              <label htmlFor="signin-password">Password</label>
              <button
                type="button"
                className="label-link"
                onClick={() => onForgotPassword(email)}
                style={{ background: 'none', border: 'none', padding: 0 }}
              >
                Forgot password?
              </button>
            </div>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <Lock size={18} />
              </span>
              <input
                id="signin-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input has-left-icon has-right-icon"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember me & checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              Remember my session
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="signin-submit-btn"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="live-pulse" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to AuthSphere</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Demo Quick Fill Helper */}
        <div className="demo-bar">
          <div className="demo-bar-text">
            <span>⚡ Need a test account?</span>
          </div>
          <button
            type="button"
            className="demo-fill-btn"
            onClick={handleQuickFill}
          >
            <Sparkles size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Quick-Fill Demo
          </button>
        </div>

        {/* Bottom Switcher */}
        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Don't have an account yet?{' '}
          <button
            type="button"
            className="label-link"
            onClick={onSwitchToSignUp}
            style={{ fontWeight: 600, background: 'none', border: 'none', fontSize: '0.9rem' }}
          >
            Create account
          </button>
        </div>
      </div>
    </div>
  );
}
