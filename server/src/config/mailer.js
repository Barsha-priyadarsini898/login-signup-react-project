import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

let transporter = null;
let isEthereal = false;
export const recentSentEmails = [];

/**
 * Initializes the Nodemailer transporter.
 * Uses custom SMTP if provided, else falls back to Ethereal Test Account.
 */
export async function initMailer() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    try {
      transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT || '587', 10),
        secure: SMTP_SECURE === 'true',
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });
      await transporter.verify();
      console.log(`✉️ Nodemailer connected to custom SMTP: ${SMTP_HOST}`);
      isEthereal = false;
      return transporter;
    } catch (err) {
      console.warn('⚠️ Custom SMTP verification failed, falling back to Ethereal test account:', err.message);
    }
  }

  // Create ethereal test account for seamless zero-config testing
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    isEthereal = true;
    console.log(`📬 Nodemailer running with Ethereal Test Account: ${testAccount.user}`);
    return transporter;
  } catch (err) {
    console.warn('⚠️ Could not initialize Ethereal account, using mock logger transporter:', err.message);
    // Fallback stub transporter
    transporter = {
      sendMail: async (options) => {
        const info = {
          messageId: 'mock-' + Date.now(),
          previewUrl: null,
          envelope: { from: options.from, to: options.to },
        };
        console.log(`✉️ [MOCK EMAIL SENT] To: ${options.to} | Subject: ${options.subject}`);
        return info;
      },
      verify: async () => true,
    };
    isEthereal = true;
    return transporter;
  }
}

/**
 * Helper to record dispatched email into dev history
 */
function recordEmail(record) {
  recentSentEmails.unshift({
    id: 'mail_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    ...record,
  });
  if (recentSentEmails.length > 50) {
    recentSentEmails.pop();
  }
}

/**
 * Send 6-Digit Email Verification OTP
 */
export async function sendVerificationOtpEmail({ toEmail, fullName, otpCode }) {
  const mail = await initMailer();
  const from = process.env.SMTP_FROM || '"AuthSphere Security" <security@authsphere.io>';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
      <style>
        body { margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; }
        .wrapper { max-width: 580px; margin: 30px auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%); padding: 36px 32px; text-align: center; }
        .logo-text { font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin: 0; text-transform: uppercase; }
        .tagline { color: #e0e7ff; font-size: 14px; margin-top: 6px; }
        .content { padding: 36px 32px; }
        .greeting { font-size: 20px; font-weight: 600; color: #f8fafc; margin-top: 0; }
        .desc { font-size: 15px; line-height: 1.6; color: #94a3b8; }
        .otp-container { margin: 30px 0; text-align: center; }
        .otp-box { display: inline-block; background: #0f172a; border: 2px dashed #6366f1; border-radius: 12px; padding: 18px 36px; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #818cf8; text-shadow: 0 0 16px rgba(99,102,241,0.4); font-family: 'Courier New', Courier, monospace; }
        .note { font-size: 13px; color: #64748b; text-align: center; margin-top: 8px; }
        .footer { background: #0a0f1d; padding: 24px 32px; text-align: center; border-top: 1px solid #1e293b; font-size: 12px; color: #475569; }
        .footer a { color: #818cf8; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <div class="logo-text">✨ AuthSphere</div>
          <div class="tagline">Next-Generation Secure Authentication</div>
        </div>
        <div class="content">
          <h2 class="greeting">Welcome, ${fullName || 'Adventurer'}! 👋</h2>
          <p class="desc">Thank you for creating an account. To complete your registration and secure your profile, please verify your email address using the one-time passcode below:</p>
          
          <div class="otp-container">
            <div class="otp-box">${otpCode}</div>
            <div class="note">⏳ This code will expire in <strong>15 minutes</strong>.</div>
          </div>

          <p class="desc">If you didn't attempt to sign up on AuthSphere, you can safely ignore this message. No further action is required.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} AuthSphere Inc. Powered by Node.js, Express, Nodemailer & Supabase.
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from,
    to: toEmail,
    subject: `🔐 Your Verification Code: ${otpCode} - AuthSphere`,
    text: `Hello ${fullName},\n\nYour 6-digit verification code is: ${otpCode}\nThis code expires in 15 minutes.\n\nThank you,\nAuthSphere Team`,
    html,
  };

  const info = await mail.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;

  console.log(`📬 [EMAIL DISPATCHED] Verification OTP sent to ${toEmail}`);
  if (previewUrl) {
    console.log(`🔗 [Ethereal Preview]: ${previewUrl}`);
  }

  recordEmail({
    type: 'VERIFICATION_OTP',
    to: toEmail,
    subject: mailOptions.subject,
    otpCode,
    previewUrl: previewUrl || null,
    messageId: info.messageId,
  });

  return { success: true, messageId: info.messageId, previewUrl };
}

/**
 * Send Password Reset OTP & Link Email
 */
export async function sendPasswordResetEmail({ toEmail, fullName, resetToken, resetOtp }) {
  const mail = await initMailer();
  const from = process.env.SMTP_FROM || '"AuthSphere Security" <security@authsphere.io>';
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetLink = `${clientUrl}/#reset-password?token=${resetToken}&email=${encodeURIComponent(toEmail)}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password</title>
      <style>
        body { margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e2e8f0; }
        .wrapper { max-width: 580px; margin: 30px auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #e11d48 0%, #f43f5e 50%, #fb7185 100%); padding: 32px; text-align: center; }
        .logo-text { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
        .content { padding: 36px 32px; }
        .greeting { font-size: 20px; font-weight: 600; color: #f8fafc; margin-top: 0; }
        .desc { font-size: 15px; line-height: 1.6; color: #94a3b8; }
        .btn { display: inline-block; background: #e11d48; color: #ffffff !important; padding: 14px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; margin: 20px 0; }
        .otp-box { display: inline-block; background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 12px 24px; font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #fb7185; }
        .footer { background: #0a0f1d; padding: 20px; text-align: center; border-top: 1px solid #1e293b; font-size: 12px; color: #475569; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <div class="logo-text">🛡️ Password Reset Request</div>
        </div>
        <div class="content">
          <h2 class="greeting">Hi ${fullName || 'there'},</h2>
          <p class="desc">We received a request to reset your password for your AuthSphere account. Use the 6-digit reset code below or click the reset button:</p>
          
          <div style="text-align: center; margin: 24px 0;">
            <div class="otp-box">${resetOtp}</div>
            <p style="font-size: 13px; color: #64748b; margin-top: 8px;">Code expires in 15 minutes</p>
          </div>

          <div style="text-align: center;">
            <a href="${resetLink}" class="btn">Reset My Password &rarr;</a>
          </div>

          <p class="desc" style="font-size: 13px; margin-top: 24px;">If you didn't make this request, someone else may have entered your email by mistake. Your account is still safe, and you don't need to do anything.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} AuthSphere Inc.
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from,
    to: toEmail,
    subject: `🔑 Password Reset Code: ${resetOtp} - AuthSphere`,
    text: `Your password reset code is: ${resetOtp}\nOr reset via: ${resetLink}`,
    html,
  };

  const info = await mail.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;

  console.log(`📬 [EMAIL DISPATCHED] Password reset email sent to ${toEmail}`);
  if (previewUrl) {
    console.log(`🔗 [Ethereal Preview]: ${previewUrl}`);
  }

  recordEmail({
    type: 'PASSWORD_RESET',
    to: toEmail,
    subject: mailOptions.subject,
    otpCode: resetOtp,
    resetToken,
    previewUrl: previewUrl || null,
    messageId: info.messageId,
  });

  return { success: true, messageId: info.messageId, previewUrl };
}
