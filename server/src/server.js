import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import { initMailer } from './config/mailer.js';
import { testSupabaseConnection } from './config/supabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup to allow client access
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
    credentials: true,
  })
);

app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'AuthSphere Authentication API',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      register: 'POST /api/auth/register',
      verifyOtp: 'POST /api/auth/verify-otp',
      resendOtp: 'POST /api/auth/resend-otp',
      login: 'POST /api/auth/login',
      forgotPassword: 'POST /api/auth/forgot-password',
      resetPassword: 'POST /api/auth/reset-password',
      currentUser: 'GET /api/auth/me',
      profile: 'PUT /api/auth/profile',
      status: 'GET /api/auth/status',
      devEmails: 'GET /api/auth/dev/emails',
    },
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected internal error occurred.',
    error: process.env.NODE_ENV === 'production' ? null : err.message,
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`\n======================================================`);
  console.log(`🚀 AuthSphere Server running on: http://localhost:${PORT}`);
  console.log(`======================================================`);

  // Check Supabase status
  const dbStatus = await testSupabaseConnection();
  console.log(`🗄️ Database Mode: ${dbStatus.mode.toUpperCase()}`);
  console.log(`💬 Message: ${dbStatus.message}`);

  // Warm up Nodemailer
  await initMailer();
});
