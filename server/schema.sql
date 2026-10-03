-- ========================================================
-- Supabase SQL Schema for User Authentication
-- Run this in the Supabase SQL Editor:
-- Project Dashboard -> SQL Editor -> New query -> Paste & Run
-- ========================================================

-- 1. Create the users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_otp TEXT,
    otp_expires_at TIMESTAMPTZ,
    reset_token TEXT,
    reset_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Create Policy allowing the service role / backend API to manage users
-- Since the Node.js/Express backend handles authentication logic, hashing, and token issuance,
-- we allow backend operations using the Anon key or Service key.
CREATE POLICY "Allow backend API access" 
ON public.users 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 5. Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_users_updated_at ON public.users;
CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
