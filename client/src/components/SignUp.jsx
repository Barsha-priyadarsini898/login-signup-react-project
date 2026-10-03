import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, ShieldCheck, Loader2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { authApi } from '../services/api';

export default function SignUp({
  onRegistrationSuccess,
  onSwitchToSignIn,
  addToast,
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate password strength
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'None', class: '' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) return { score: 1, label: 'Weak', class: 'weak' };
    if (score <= 3) return { score: 2, label: 'Medium', class: 'medium' };
    return { score: 3, label: 'Strong', class: 'strong' };
  };

  const strength = getPasswordStrength(password);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  // Quick fill random user
  const handleRandomFill = () => {
    const randomId = Math.floor(100 + Math.random() * 900);
    setFullName(`Sarah Connor`);
    setEmail(`sarah.connor${randomId}@example.com`);
    setPassword(`Skynet@Secure${randomId}`);
    setConfirmPassword(`Skynet@Secure${randomId}`);
    addToast({
      type: 'info',
      title: 'Demo Filled',
      message: 'New credentials generated. Click "Create Account" to dispatch your OTP email!',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullName || !email || !password || !confirmPassword) {
      addToast({
        type: 'warning',
        title: 'Missing Fields',
        message: 'Please complete all required fields.',
      });
      return;
    }

    if (password.length < 6) {
      addToast({
        type: 'error',
        title: 'Password Too Short',
        message: 'Password must be at least 6 characters.',
      });
      return;
    }

    if (password !== confirmPassword) {
      addToast({
        type: 'error',
        title: 'Passwords Do Not Match',
        message: 'Please ensure both password fields match.',
      });
      return;
    }

    if (!agreeTerms) {
      addToast({
        type: 'warning',
        title: 'Terms Required',
        message: 'Please accept the Terms of Service to continue.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.register({
        fullName,
        email,
        password,
      });

      // Confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#8b5cf6', '#d946ef', '#10b981'],
        });
      } catch (err) {
        // ignore confetti errors
      }

      addToast({
        type: 'success',
        title: 'Account Created!',
        message: res.message || 'Verification code sent to your email.',
      });

      onRegistrationSuccess(email, res.previewUrl, res.devOtp);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Registration Failed',
        message: err.message || 'Could not create account.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-card-container">
      <div className="glass-card" style={{ padding: '2.5rem 2rem' }}>
        <div className="auth-header">
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join AuthSphere with secure OTP email verification</p>
        </div>

        <form onSubmit={handleSubmit} id="sign-up-form">
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-name">
              Full Name
            </label>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <User size={18} />
              </span>
              <input
                id="signup-name"
                type="text"
                className="form-input has-left-icon"
                placeholder="e.g. Sarah Connor"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">
              Email Address
            </label>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <Mail size={18} />
              </span>
              <input
                id="signup-email"
                type="email"
                className="form-input has-left-icon"
                placeholder="sarah@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">
              Password
            </label>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <Lock size={18} />
              </span>
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input has-left-icon has-right-icon"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
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

            {/* Password strength meter */}
            {password && (
              <div style={{ marginTop: '0.5rem' }}>
                <div className="strength-meter">
                  <div className={`strength-bar ${strength.score >= 1 ? strength.class : ''}`} />
                  <div className={`strength-bar ${strength.score >= 2 ? strength.class : ''}`} />
                  <div className={`strength-bar ${strength.score >= 3 ? strength.class : ''}`} />
                </div>
                <div className="strength-text">
                  <span>Strength: <strong>{strength.label}</strong></span>
                  <span>Use 6+ chars, numbers & symbols</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-confirm-password">
              Confirm Password
            </label>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <ShieldCheck size={18} />
              </span>
              <input
                id="signup-confirm-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input has-left-icon has-right-icon"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              {passwordsMatch && (
                <span className="input-icon-right" style={{ color: 'var(--emerald)', cursor: 'default' }}>
                  <CheckCircle2 size={18} />
                </span>
              )}
            </div>
          </div>

          {/* Terms checkbox */}
          <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                style={{ accentColor: 'var(--primary)', marginTop: '3px', cursor: 'pointer' }}
              />
              <span>
                I agree to the <span style={{ color: 'var(--primary)' }}>Terms of Service</span> and{' '}
                <span style={{ color: 'var(--primary)' }}>Privacy Policy</span>.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="signup-submit-btn"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="live-pulse" />
                <span>Creating Account & Sending OTP...</span>
              </>
            ) : (
              <>
                <span>Create Secure Account</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Demo Quick Fill */}
        <div className="demo-bar">
          <div className="demo-bar-text">
            <span>⚡ Need quick sample inputs?</span>
          </div>
          <button
            type="button"
            className="demo-fill-btn"
            onClick={handleRandomFill}
          >
            <Sparkles size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Fill Sample User
          </button>
        </div>

        {/* Bottom Switcher */}
        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <button
            type="button"
            className="label-link"
            onClick={onSwitchToSignIn}
            style={{ fontWeight: 600, background: 'none', border: 'none', fontSize: '0.9rem' }}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
