import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { supabase, isConfigured } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'users.json');

// Ensure local fallback storage directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
}

/** Helper for local fallback file reading */
function readLocalUsers() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

/** Helper for local fallback file writing */
function writeLocalUsers(users) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing local users store:', err);
  }
}

export const UserModel = {
  /**
   * Find a user by email address
   */
  async findByEmail(email) {
    const normalizedEmail = email.trim().toLowerCase();

    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('email', normalizedEmail)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Supabase findByEmail warning:', error.message);
      }
      if (data) return data;
    }

    // Local fallback store
    const localUsers = readLocalUsers();
    return localUsers.find((u) => u.email.toLowerCase() === normalizedEmail) || null;
  },

  /**
   * Find a user by primary ID (UUID)
   */
  async findById(id) {
    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Supabase findById warning:', error.message);
      }
      if (data) return data;
    }

    const localUsers = readLocalUsers();
    return localUsers.find((u) => u.id === id) || null;
  },

  /**
   * Create a new user record
   */
  async create({ email, passwordHash, fullName, verificationOtp, otpExpiresAt }) {
    const normalizedEmail = email.trim().toLowerCase();
    const newUserRecord = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      password_hash: passwordHash,
      full_name: fullName.trim(),
      is_verified: false,
      verification_otp: verificationOtp,
      otp_expires_at: otpExpiresAt,
      reset_token: null,
      reset_expires_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('users')
        .insert([newUserRecord])
        .select()
        .single();

      if (!error && data) {
        return data;
      }
      console.warn('Supabase insert failed, falling back to local store:', error?.message);
    }

    // Fallback store
    const localUsers = readLocalUsers();
    localUsers.push(newUserRecord);
    writeLocalUsers(localUsers);
    return newUserRecord;
  },

  /**
   * Mark user as verified and clear OTP
   */
  async markVerified(email) {
    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date().toISOString();

    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('users')
        .update({
          is_verified: true,
          verification_otp: null,
          otp_expires_at: null,
          updated_at: now,
        })
        .ilike('email', normalizedEmail)
        .select()
        .single();

      if (!error && data) return data;
    }

    const localUsers = readLocalUsers();
    const user = localUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (user) {
      user.is_verified = true;
      user.verification_otp = null;
      user.otp_expires_at = null;
      user.updated_at = now;
      writeLocalUsers(localUsers);
      return user;
    }
    return null;
  },

  /**
   * Update OTP code and expiry
   */
  async updateOtp(email, newOtp, expiresAt) {
    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date().toISOString();

    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('users')
        .update({
          verification_otp: newOtp,
          otp_expires_at: expiresAt,
          updated_at: now,
        })
        .ilike('email', normalizedEmail)
        .select()
        .single();

      if (!error && data) return data;
    }

    const localUsers = readLocalUsers();
    const user = localUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (user) {
      user.verification_otp = newOtp;
      user.otp_expires_at = expiresAt;
      user.updated_at = now;
      writeLocalUsers(localUsers);
      return user;
    }
    return null;
  },

  /**
   * Store password reset token/OTP
   */
  async setResetToken(email, resetToken, resetOtp, expiresAt) {
    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date().toISOString();

    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('users')
        .update({
          reset_token: resetToken,
          verification_otp: resetOtp, // can also use OTP for reset
          reset_expires_at: expiresAt,
          updated_at: now,
        })
        .ilike('email', normalizedEmail)
        .select()
        .single();

      if (!error && data) return data;
    }

    const localUsers = readLocalUsers();
    const user = localUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (user) {
      user.reset_token = resetToken;
      user.verification_otp = resetOtp;
      user.reset_expires_at = expiresAt;
      user.updated_at = now;
      writeLocalUsers(localUsers);
      return user;
    }
    return null;
  },

  /**
   * Reset password with new hash
   */
  async updatePassword(email, newPasswordHash) {
    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date().toISOString();

    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('users')
        .update({
          password_hash: newPasswordHash,
          reset_token: null,
          reset_expires_at: null,
          verification_otp: null,
          updated_at: now,
        })
        .ilike('email', normalizedEmail)
        .select()
        .single();

      if (!error && data) return data;
    }

    const localUsers = readLocalUsers();
    const user = localUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (user) {
      user.password_hash = newPasswordHash;
      user.reset_token = null;
      user.reset_expires_at = null;
      user.verification_otp = null;
      user.updated_at = now;
      writeLocalUsers(localUsers);
      return user;
    }
    return null;
  },

  /**
   * Update User Profile details
   */
  async updateProfile(id, { fullName }) {
    const now = new Date().toISOString();

    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('users')
        .update({
          full_name: fullName.trim(),
          updated_at: now,
        })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) return data;
    }

    const localUsers = readLocalUsers();
    const user = localUsers.find((u) => u.id === id);
    if (user) {
      user.full_name = fullName.trim();
      user.updated_at = now;
      writeLocalUsers(localUsers);
      return user;
    }
    return null;
  },
};
