import React, { useState, useRef, useEffect } from 'react';
import { MailCheck, ArrowRight, RotateCw, ExternalLink, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { authApi } from '../services/api';

export default function VerifyOtp({
  email,
  initialPreviewUrl,
  initialDevOtp,
  onVerificationSuccess,
  onBackToSignIn,
  addToast,
}) {
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [previewUrl, setPreviewUrl] = useState(initialPreviewUrl || null);
  const [currentDevOtp, setCurrentDevOtp] = useState(initialDevOtp || null);

  const inputRefs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Handle single digit change
  const handleChange = (index, value) => {
    // Only accept numeric characters
    const cleanValue = value.replace(/\D/g, '');
    if (!cleanValue && value !== '') return;

    const newDigits = [...otpDigits];
    newDigits[index] = cleanValue.slice(-1); // Take latest char
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (cleanValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 digits entered
    const fullOtp = newDigits.join('');
    if (fullOtp.length === 6) {
      verifyCode(fullOtp);
    }
  };

  // Handle Backspace navigation
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  // Handle Paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (pasted.length >= 6) {
      const newDigits = pasted.slice(0, 6).split('');
      setOtpDigits(newDigits);
      inputRefs.current[5]?.focus();
      verifyCode(pasted.slice(0, 6));
    }
  };

  // 1-Click quick fill from test OTP
  const handleDevOtpClick = (code) => {
    if (!code) return;
    const digits = code.toString().split('');
    setOtpDigits(digits);
    verifyCode(code);
  };

  // Verify Code
  const verifyCode = async (codeToVerify) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length < 6) {
      addToast({
        type: 'warning',
        title: 'Incomplete Code',
        message: 'Please enter all 6 digits of your verification code.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.verifyOtp(email, code);
      if (res.token) {
        localStorage.setItem('auth_token', res.token);
      }

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10b981', '#6366f1', '#8b5cf6', '#d946ef'],
        });
      } catch (err) {}

      addToast({
        type: 'success',
        title: 'Email Verified!',
        message: res.message || 'Account activated successfully.',
      });

      onVerificationSuccess(res.user);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Verification Failed',
        message: err.message || 'Invalid or expired code. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    try {
      const res = await authApi.resendOtp(email);
      setCountdown(60);
      setOtpDigits(['', '', '', '', '', '']);
      if (res.previewUrl) setPreviewUrl(res.previewUrl);
      if (res.devOtp) setCurrentDevOtp(res.devOtp);

      addToast({
        type: 'info',
        title: 'New Code Dispatched',
        message: res.message || 'Check your inbox for the fresh OTP.',
      });
      inputRefs.current[0]?.focus();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Resend Failed',
        message: err.message || 'Could not resend OTP.',
      });
    } finally {
      setResending(false);
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
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              color: 'var(--primary)',
            }}
          >
            <MailCheck size={28} />
          </div>
          <h1 className="auth-title">Verify Your Email</h1>
          <p className="auth-subtitle">
            We sent a 6-digit confirmation code via Nodemailer to:
            <br />
            <strong style={{ color: '#e2e8f0', wordBreak: 'break-all' }}>{email}</strong>
          </p>
        </div>

        {/* 6-Digit OTP Box Row */}
        <div className="otp-inputs-row" onPaste={handlePaste}>
          {otpDigits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              className="otp-box-input"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              autoFocus={index === 0}
            />
          ))}
        </div>

        {/* Dev OTP Helper Pill */}
        {currentDevOtp && (
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.85rem',
            }}
          >
            <span style={{ color: '#c7d2fe' }}>
              <Sparkles size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Test Mode OTP: <strong style={{ color: '#fff', letterSpacing: '1px' }}>{currentDevOtp}</strong>
            </span>
            <button
              type="button"
              className="demo-fill-btn"
              onClick={() => handleDevOtpClick(currentDevOtp)}
            >
              Auto-Fill
            </button>
          </div>
        )}

        {/* Ethereal Mail Preview Link */}
        {previewUrl && (
          <div
            style={{
              marginBottom: '1.25rem',
              textAlign: 'center',
            }}
          >
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                color: '#818cf8',
                textDecoration: 'none',
                background: 'rgba(129, 140, 248, 0.1)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(129, 140, 248, 0.25)',
              }}
            >
              <span>View Dispatched Email in Ethereal</span>
              <ExternalLink size={13} />
            </a>
          </div>
        )}

        {/* Verify Button */}
        <button
          type="button"
          id="verify-otp-btn"
          className="btn-primary"
          disabled={isLoading || otpDigits.join('').length < 6}
          onClick={() => verifyCode()}
          style={{ marginBottom: '1.25rem' }}
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="live-pulse" />
              <span>Verifying Code...</span>
            </>
          ) : (
            <>
              <span>Verify & Continue</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>

        {/* Resend & Back controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={onBackToSignIn}
            style={{ paddingLeft: 0 }}
          >
            <ArrowLeft size={15} />
            <span>Back to Sign In</span>
          </button>

          <button
            type="button"
            className="btn-ghost"
            onClick={handleResend}
            disabled={countdown > 0 || resending}
            style={{
              opacity: countdown > 0 ? 0.6 : 1,
              cursor: countdown > 0 ? 'not-allowed' : 'pointer',
              color: countdown > 0 ? 'var(--text-muted)' : 'var(--primary)',
            }}
          >
            <RotateCw size={14} className={resending ? 'live-pulse' : ''} />
            <span>{countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
