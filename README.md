# ✨ AuthSphere — User Authentication Web Application

An enterprise-grade, modern User Authentication Web Application built with **React.js (Vite)**, **Node.js**, **Express.js**, **Nodemailer**, and **Supabase (PostgreSQL)**.

---

## 🌟 Features

- **🎨 Modern Aesthetic**: Dark luxury design system with glowing mesh gradients, glassmorphism, smooth micro-interactions, and accessible controls.
- **🔐 Secure Registration**: Full user registration with real-time password strength meter and confirm password validation.
- **✉️ Email Verification via Nodemailer**:
  - Automatically generates 6-digit numeric OTP codes.
  - Sends responsive HTML emails with branded styling, security advice, and 15-minute expiration.
  - Built-in **Zero-Config Ethereal Email** test inbox with 1-click preview links.
  - Interactive in-app **Mail Drawer** to inspect dispatched emails and 1-click copy/fill OTPs in development!
- **🔑 JWT Session Authentication**: Stateless JSON Web Token authentication with Bearer header middleware.
- **🗄️ Supabase PostgreSQL Database**:
  - Real-time user persistence using `@supabase/supabase-js`.
  - Intelligent automatic local fallback datastore when Supabase credentials are pending, so the app is always functional right out of the box.
  - Included `schema.sql` for 1-click table creation and Row Level Security (RLS) setup in Supabase.
- **🔄 Password Recovery Flow**: Forgot password request -> 6-digit reset code via Nodemailer -> reset password screen with strength validation.
- **👤 Authenticated Dashboard**:
  - User initials avatar with online verified badge.
  - Full Name inline editing (`PUT /api/auth/profile`).
  - Active JWT Token inspector with 1-click copy.
  - Database status pill & configuration modal.
  - Dispatch self-test security emails on demand.

---

## 📁 Project Architecture

```
login page/
├── client/                     # React.js (Vite) Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Header with live DB & Nodemailer indicators
│   │   │   ├── SignIn.jsx          # Sign-in form with demo quick-fill
│   │   │   ├── SignUp.jsx          # Registration with password strength meter
│   │   │   ├── VerifyOtp.jsx       # 6-box OTP input with auto-tabbing & timer
│   │   │   ├── ForgotPassword.jsx  # Recovery request & password reset
│   │   │   ├── Dashboard.jsx       # User dashboard, profile & JWT token viewer
│   │   │   ├── MailDrawer.jsx      # Slide-out Nodemailer inbox viewer
│   │   │   ├── DatabaseModal.jsx   # Supabase status & schema copy helper
│   │   │   └── Toast.jsx           # Floating notification toasts
│   │   ├── services/
│   │   │   └── api.js              # Fetch client wrapper with JWT handling
│   │   ├── App.jsx                 # Application controller & state machine
│   │   ├── App.css                 # Supplementary component styles
│   │   └── index.css               # Core design system & CSS variables
│   ├── index.html
│   └── package.json
│
├── server/                     # Node.js & Express Backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── supabase.js         # Supabase client & connectivity tests
│   │   │   └── mailer.js           # Nodemailer transporter & HTML templates
│   │   ├── middleware/
│   │   │   └── authMiddleware.js   # JWT verification middleware
│   │   ├── models/
│   │   │   └── userModel.js        # Supabase user repository & local fallback
│   │   ├── routes/
│   │   │   └── authRoutes.js       # Register, OTP, Login, Reset, Profile APIs
│   │   └── server.js               # Express application entrypoint
│   ├── schema.sql                  # Supabase PostgreSQL database schema
│   ├── .env.example
│   ├── .env
│   └── package.json
│
├── package.json                # Root package.json with concurrent dev runner
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Start Both Frontend & Backend
Run the following command from the project root:
```bash
npm run dev
```

This will concurrently launch:
- **Express Backend API**: `http://localhost:5000`
- **React Frontend**: `http://localhost:5173`

Open **`http://localhost:5173`** in your browser.

---

## 🛠️ Configuration & Credentials

### Supabase Setup (Optional / Ready for Production)
The app runs automatically in zero-config mode using local persistent storage. To connect to your Supabase PostgreSQL database:

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard and run the queries inside [`server/schema.sql`](file:///c:/Users/somya/OneDrive/Desktop/login%20page/server/schema.sql).
3. Copy your project URL and Anon Public Key from **Project Settings -> API**.
4. Update `server/.env`:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
5. Restart the server or click the **Database Status Pill** in the top navbar to verify the live connection!

### Nodemailer / SMTP Setup
By default, the server initializes an **Ethereal Test Mailer** on startup. Dispatched emails generate preview URLs and appear directly in the in-app **Mail Drawer** (click "Mail Drawer" in the top navbar).

To use a custom SMTP provider (Gmail, SendGrid, Mailtrap, Resend, etc.), update `server/.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="AuthSphere Security <no-reply@authsphere.io>"
```

---

## 🧪 Available API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register user & dispatch 6-digit OTP email |
| `POST` | `/api/auth/verify-otp` | Validate OTP code & activate user account |
| `POST` | `/api/auth/resend-otp` | Regenerate and re-send verification OTP |
| `POST` | `/api/auth/login` | Authenticate credentials & return JWT |
| `POST` | `/api/auth/forgot-password` | Generate reset token/OTP and email user |
| `POST` | `/api/auth/reset-password` | Update password with verified reset code |
| `GET` | `/api/auth/me` | Fetch authenticated user info (`Bearer <token>`) |
| `PUT` | `/api/auth/profile` | Update profile information (`Bearer <token>`) |
| `GET` | `/api/auth/status` | Supabase & Nodemailer system connectivity |
| `GET` | `/api/auth/dev/emails` | Dev inbox inspection list |
