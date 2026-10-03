const API_BASE_URL = 'http://localhost:5000/api/auth';

/**
 * Standard fetch wrapper with JWT token auto-attachment
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || 'Something went wrong');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.status) throw err;
    const networkError = new Error('Cannot connect to Auth server (http://localhost:5000). Please ensure server is running.');
    networkError.status = 0;
    throw networkError;
  }
}

export const authApi = {
  // Register
  register(userData) {
    return request('/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Verify OTP
  verifyOtp(email, otp) {
    return request('/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  // Resend OTP
  resendOtp(email) {
    return request('/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Login
  login(credentials) {
    return request('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Forgot password
  forgotPassword(email) {
    return request('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Reset password
  resetPassword(payload) {
    return request('/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Current authenticated user
  getMe() {
    return request('/me', { method: 'GET' });
  },

  // Update profile
  updateProfile(data) {
    return request('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // System & Supabase status
  getStatus() {
    return request('/status', { method: 'GET' });
  },

  // Recent dev emails
  getDevEmails() {
    return request('/dev/emails', { method: 'GET' });
  },
};
