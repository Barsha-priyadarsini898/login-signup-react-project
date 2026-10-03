import React, { useState } from 'react';
import { KeyRound, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Loader2, ExternalLink, Sparkles } from 'lucide-react';
import { authApi } from '../services/api';

export default function ForgotPassword({
  initialEmail = '',
  onBackToSignIn,
  onResetComplete,
  addToast,
}) {
  const [step, setStep] = useState(1); // 1 = request reset, 2 = enter otp & new password
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [devOtp, setDevOtp] = useState(null);

  // Step 1: Request Reset Code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!email) {
      addToast({
        type: 'warning',
        title: 'Email Required',
        message: 'Please enter your account email address.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      if (res.previewUrl) setPreviewUrl(res.previewUrl);
      if (res.devOtp) setDevOtp(res.devOtp);

      addToast({
        type: 'success',
        title: 'Instructions Sent',
        message: res.message || 'Check your email for the reset code.',
      });

      setStep(2);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Request Failed',
        message: err.message || 'Failed to dispatch reset instructions.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!otp || !newPassword || !confirmPassword) {
      addToast({
        type: 'warning',
        title: 'Missing Fields',
        message: 'Please provide the reset code and your new password.',
      });
      return;
    }

    if (newPassword.length < 6) {
      addToast({
        type: 'error',
        title: 'Password Too Short',
        message: 'New password must be at least 6 characters long.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast({
        type: 'error',
        title: 'Passwords Mismatch',
        message: 'Confirm password does not match.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.resetPassword({
        email,
        otp,
        newPassword,
      });

      addToast({
        type: 'success',
        title: 'Password Updated!',
        message: res.message || 'You can now sign in with your new password.',
      });

      onResetComplete();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Reset Failed',
        message: err.message || 'Invalid or expired reset code.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-card-container">
      <div className="glass-card" style={{ padding: '2.5rem 2rem' }}>
        <div className="auth-header">
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              color: 'var(--rose)',
            }}
          >
            <KeyRound size={28} />
          </div>
          <h1 className="auth-title">
            {step === 1 ? 'Forgot Password?' : 'Reset Password'}
          </h1>
          <p className="auth-subtitle">
            {step === 1
              ? 'Enter your email address to receive a 6-digit recovery code'
              : 'Enter the 6-digit code sent to your email and your new password'}
          </p>
        </div>

        {step === 1 ? (
          /* Step 1 Form */
          <form onSubmit={handleRequestCode}>
            <div className="form-group">
              <label className="form-label" htmlFor="forgot-email">
                Account Email
              </label>
              <div className="input-wrapper">
                <span className="input-icon-left">
                  <Mail size={18} />
                </span>
                <input
                  id="forgot-email"
                  type="email"
                  className="form-input has-left-icon"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
              style={{
                background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                marginTop: '1.5rem',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="live-pulse" />
                  <span>Sending Reset Code...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Code</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Step 2 Form */
          <form onSubmit={handleResetPassword}>
            {/* Dev OTP Helper */}
            {devOtp && (
              <div
                style={{
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                }}
              >
                <span style={{ color: '#fecdd3' }}>
                  <Sparkles size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Reset Code: <strong style={{ color: '#fff' }}>{devOtp}</strong>
                </span>
                <button
                  type="button"
                  className="demo-fill-btn"
                  onClick={() => setOtp(devOtp)}
                  style={{ background: 'rgba(244, 63, 94, 0.3)', borderColor: 'rgba(244, 63, 94, 0.5)' }}
                >
                  Fill Code
                </button>
              </div>
            )}

            {previewUrl && (
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.85rem',
                    color: '#fb7185',
                    textDecoration: 'none',
                    background: 'rgba(244, 63, 94, 0.1)',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                  }}
                >
                  <span>Preview Nodemailer Message</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            )}

            {/* OTP Input */}
            <div className="form-group">
              <label className="form-label" htmlFor="reset-otp">
                6-Digit Reset Code
              </label>
              <input
                id="reset-otp"
                type="text"
                maxLength={6}
                className="form-input"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem', fontWeight: 700 }}
                required
              />
            </div>

            {/* New Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="new-password">
                New Password
              </label>
              <div className="input-wrapper">
                <span className="input-icon-left">
                  <Lock size={18} />
                </span>
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input has-left-icon has-right-icon"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="confirm-new-password">
                Confirm New Password
              </label>
              <div className="input-wrapper">
                <span className="input-icon-left">
                  <Lock size={18} />
                </span>
                <input
                  id="confirm-new-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input has-left-icon"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
              style={{
                background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                marginTop: '1.5rem',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="live-pulse" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Set New Password</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Back Link */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={onBackToSignIn}
          >
            <ArrowLeft size={15} />
            <span>Back to Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
}
