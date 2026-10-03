import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import VerifyOtp from './components/VerifyOtp';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard';
import MailDrawer from './components/MailDrawer';
import DatabaseModal from './components/DatabaseModal';
import ToastContainer from './components/Toast';
import { authApi } from './services/api';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('signin'); // 'signin' | 'signup' | 'verify-otp' | 'forgot-password' | 'dashboard'
  const [pendingEmail, setPendingEmail] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [devOtp, setDevOtp] = useState(null);

  const [dbStatus, setDbStatus] = useState(null);
  const [recentEmails, setRecentEmails] = useState([]);
  const [isMailDrawerOpen, setIsMailDrawerOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Toast manager
  const addToast = ({ type = 'info', title, message }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial authentication check & system status
  useEffect(() => {
    const initApp = async () => {
      try {
        // Fetch DB & Mailer status
        const statusRes = await authApi.getStatus();
        setDbStatus(statusRes.system.database);

        // Fetch recent sent emails
        const emailsRes = await authApi.getDevEmails();
        setRecentEmails(emailsRes.emails || []);

        // Check token session
        const token = localStorage.getItem('auth_token');
        if (token) {
          const meRes = await authApi.getMe();
          if (meRes.user) {
            setUser(meRes.user);
            setView('dashboard');
          }
        }
      } catch (err) {
        console.warn('Initial session check failed or no token present:', err.message);
        localStorage.removeItem('auth_token');
      } finally {
        setIsInitializing(false);
      }
    };

    initApp();

    // Poll recent emails every 8 seconds to keep Nodemailer badge active
    const interval = setInterval(async () => {
      try {
        const emailsRes = await authApi.getDevEmails();
        setRecentEmails(emailsRes.emails || []);
      } catch {}
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleLoginSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    setView('dashboard');
  };

  const handleRequiresVerification = (email, mailPreviewUrl, testOtp) => {
    setPendingEmail(email);
    setPreviewUrl(mailPreviewUrl || null);
    setDevOtp(testOtp || null);
    setView('verify-otp');
  };

  const handleRegistrationSuccess = (email, mailPreviewUrl, testOtp) => {
    setPendingEmail(email);
    setPreviewUrl(mailPreviewUrl || null);
    setDevOtp(testOtp || null);
    setView('verify-otp');
  };

  const handleVerificationSuccess = (verifiedUser) => {
    setUser(verifiedUser);
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setView('signin');
    addToast({
      type: 'info',
      title: 'Signed Out',
      message: 'You have been safely signed out.',
    });
  };

  return (
    <div className="app-layout">
      {/* Animated ambient mesh background */}
      <div className="ambient-background">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <div className="grid-overlay"></div>
      </div>

      {/* Top Navbar */}
      <Navbar
        user={user}
        dbStatus={dbStatus}
        unreadEmailsCount={recentEmails.length}
        onOpenMailDrawer={() => setIsMailDrawerOpen(true)}
        onOpenDbModal={() => setIsDbModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {/* Sign In & Sign Up container with tab bar */}
        {!user && (view === 'signin' || view === 'signup') && (
          <div style={{ width: '100%', maxWidth: '480px' }}>
            {/* View Switcher Tabs */}
            <div className="auth-tabs">
              <button
                className={`auth-tab ${view === 'signin' ? 'active' : ''}`}
                onClick={() => setView('signin')}
              >
                Sign In
              </button>
              <button
                className={`auth-tab ${view === 'signup' ? 'active' : ''}`}
                onClick={() => setView('signup')}
              >
                Create Account
              </button>
            </div>

            {view === 'signin' ? (
              <SignIn
                onSuccess={handleLoginSuccess}
                onSwitchToSignUp={() => setView('signup')}
                onForgotPassword={(email) => {
                  setPendingEmail(email);
                  setView('forgot-password');
                }}
                onRequiresVerification={handleRequiresVerification}
                addToast={addToast}
              />
            ) : (
              <SignUp
                onRegistrationSuccess={handleRegistrationSuccess}
                onSwitchToSignIn={() => setView('signin')}
                addToast={addToast}
              />
            )}
          </div>
        )}

        {/* OTP Verification Screen */}
        {!user && view === 'verify-otp' && (
          <VerifyOtp
            email={pendingEmail}
            initialPreviewUrl={previewUrl}
            initialDevOtp={devOtp}
            onVerificationSuccess={handleVerificationSuccess}
            onBackToSignIn={() => setView('signin')}
            addToast={addToast}
          />
        )}

        {/* Forgot / Reset Password Screen */}
        {!user && view === 'forgot-password' && (
          <ForgotPassword
            initialEmail={pendingEmail}
            onBackToSignIn={() => setView('signin')}
            onResetComplete={() => setView('signin')}
            addToast={addToast}
          />
        )}

        {/* Authenticated Dashboard */}
        {user && view === 'dashboard' && (
          <Dashboard
            user={user}
            onUserUpdate={(updated) => setUser(updated)}
            onLogout={handleLogout}
            dbStatus={dbStatus}
            onOpenMailDrawer={() => setIsMailDrawerOpen(true)}
            onOpenDbModal={() => setIsDbModalOpen(true)}
            addToast={addToast}
          />
        )}
      </main>

      {/* Slide-out Mail Drawer */}
      <MailDrawer
        isOpen={isMailDrawerOpen}
        onClose={() => setIsMailDrawerOpen(false)}
        addToast={addToast}
      />

      {/* Database & Supabase Modal */}
      <DatabaseModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        dbStatus={dbStatus}
        addToast={addToast}
      />

      {/* Floating Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
