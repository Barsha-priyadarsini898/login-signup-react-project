import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserModel } from '../models/userModel.js';
import { testSupabaseConnection } from '../config/supabase.js';
import {
  sendVerificationOtpEmail,
  sendPasswordResetEmail,
  recentSentEmails,
} from '../config/mailer.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_authsphere_modern_2026';

// Helper: Generate 6-digit numeric OTP code
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper: Create JWT token
function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Helper: Format user response (strip hashes & secrets)
function formatUser(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    isVerified: user.is_verified,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user & dispatch verification OTP
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Validation
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, and password.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Check if user already exists
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      if (existing.is_verified) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists. Please log in.',
        });
      }

      // If user exists but is not verified yet, refresh OTP and re-send
      const otpCode = generateOTP();
      const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const newHash = await bcrypt.hash(password, 10);

      await UserModel.updatePassword(email, newHash);
      await UserModel.updateOtp(email, otpCode, otpExpiresAt);
      if (fullName) {
        await UserModel.updateProfile(existing.id, { fullName });
      }

      const mailResult = await sendVerificationOtpEmail({
        toEmail: email,
        fullName: fullName || existing.full_name,
        otpCode,
      });

      return res.status(200).json({
        success: true,
        message: 'Account was pending verification. A fresh verification code has been dispatched to your email!',
        email,
        requiresVerification: true,
        previewUrl: mailResult.previewUrl,
        devOtp: otpCode,
      });
    }

    // Hash password & generate OTP
    const passwordHash = await bcrypt.hash(password, 10);
    const otpCode = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const newUser = await UserModel.create({
      email,
      passwordHash,
      fullName,
      verificationOtp: otpCode,
      otpExpiresAt,
    });

    const mailResult = await sendVerificationOtpEmail({
      toEmail: email,
      fullName,
      otpCode,
    });

    return res.status(201).json({
      success: true,
      message: 'Account created! Please check your email for the 6-digit verification code.',
      email: newUser.email,
      requiresVerification: true,
      previewUrl: mailResult.previewUrl,
      devOtp: otpCode,
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating account.',
      error: err.message,
    });
  }
});

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify 6-digit OTP code & activate account
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and 6-digit verification code.',
      });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found for this email address.',
      });
    }

    if (user.is_verified) {
      const token = createToken(user);
      return res.status(200).json({
        success: true,
        message: 'Your account is already verified! Welcome back.',
        token,
        user: formatUser(user),
      });
    }

    // Check OTP
    if (!user.verification_otp || user.verification_otp.trim() !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please check your email and try again.',
      });
    }

    // Check expiration
    if (user.otp_expires_at && new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.',
      });
    }

    // Mark as verified
    const verifiedUser = await UserModel.markVerified(email);
    const token = createToken(verifiedUser || user);

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully! You are now logged in.',
      token,
      user: formatUser(verifiedUser || user),
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error verifying code.',
      error: err.message,
    });
  }
});

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Generate and resend a new OTP
 */
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.',
      });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'This account is already verified. You can log in directly.',
      });
    }

    const newOtp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await UserModel.updateOtp(email, newOtp, expiresAt);

    const mailResult = await sendVerificationOtpEmail({
      toEmail: email,
      fullName: user.full_name,
      otpCode: newOtp,
    });

    return res.status(200).json({
      success: true,
      message: 'A new 6-digit verification code has been dispatched to your email!',
      previewUrl: mailResult.previewUrl,
      devOtp: newOtp,
    });
  } catch (err) {
    console.error('Resend OTP error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to resend verification code.',
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user credentials & issue JWT
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // If account not verified yet, alert the user and offer OTP verification
    if (!user.is_verified) {
      // Auto-dispatch or reuse OTP
      const otpCode = generateOTP();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await UserModel.updateOtp(email, otpCode, expiresAt);

      const mailResult = await sendVerificationOtpEmail({
        toEmail: email,
        fullName: user.full_name,
        otpCode,
      });

      return res.status(403).json({
        success: false,
        requiresVerification: true,
        message: 'Your email address is not verified yet. We just sent a fresh code to your inbox!',
        email: user.email,
        previewUrl: mailResult.previewUrl,
        devOtp: otpCode,
      });
    }

    const token = createToken(user);

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.full_name}!`,
      token,
      user: formatUser(user),
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.',
    });
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset instructions & OTP
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your account email address.',
      });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      // Do not reveal email existence for security, but indicate instructions sent
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email, reset instructions have been sent.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetOtp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await UserModel.setResetToken(email, resetToken, resetOtp, expiresAt);

    const mailResult = await sendPasswordResetEmail({
      toEmail: email,
      fullName: user.full_name,
      resetToken,
      resetOtp,
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset code has been sent to your email!',
      previewUrl: mailResult.previewUrl,
      resetToken,
      devOtp: resetOtp,
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to process password reset request.',
    });
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using reset token OR OTP
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, resetToken, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    if (!email && !resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Email or reset token is required.',
      });
    }

    let user = null;
    if (email) {
      user = await UserModel.findByEmail(email);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found or invalid request.',
      });
    }

    // Verify token or OTP
    const isTokenMatch = resetToken && user.reset_token === resetToken;
    const isOtpMatch = otp && (user.verification_otp === otp.trim() || user.reset_token === otp.trim());

    if (!isTokenMatch && !isOtpMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token / code.',
      });
    }

    // Check expiration
    if (user.reset_expires_at && new Date() > new Date(user.reset_expires_at)) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token has expired. Please request a new one.',
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await UserModel.updatePassword(user.email, newHash);

    // If account was previously unverified, this also validates ownership
    if (!user.is_verified) {
      await UserModel.markVerified(user.email);
    }

    return res.status(200).json({
      success: true,
      message: 'Your password has been successfully reset! You may now sign in with your new password.',
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password.',
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 */
router.get('/me', requireAuth, async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update profile details (name)
 */
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { fullName } = req.body;
    if (!fullName || fullName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Full name cannot be empty.',
      });
    }

    const updated = await UserModel.updateProfile(req.user.id, { fullName });
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: formatUser(updated),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
    });
  }
});

/**
 * @route   GET /api/auth/status
 * @desc    System health check, Supabase connectivity & mailer status
 */
router.get('/status', async (req, res) => {
  const dbStatus = await testSupabaseConnection();
  return res.status(200).json({
    success: true,
    system: {
      serverTime: new Date().toISOString(),
      database: dbStatus,
      mailer: {
        provider: process.env.SMTP_HOST ? 'Custom SMTP' : 'Ethereal Mail (Zero-Config Test)',
        configured: true,
      },
    },
  });
});

/**
 * @route   GET /api/auth/dev/emails
 * @desc    Get recent outgoing emails for live testing preview
 */
router.get('/dev/emails', (req, res) => {
  return res.status(200).json({
    success: true,
    emails: recentSentEmails,
  });
});

export default router;
