/*
  # QuantumSafe Database Schema Migration

  1. New Tables
    - `user_points` - User point balances and tracking
    - `scan_results` - Asset scan results and vulnerabilities  
    - `referrals` - User referral tracking and rewards
    - `user_profiles` - Extended user profile information

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Proper foreign key constraints to auth.users

  3. Performance
    - Add indexes for frequently queried columns
    - Optimize for user-specific data access patterns
*/

-- Drop existing policies if they exist to avoid conflicts
DO $$ 
BEGIN
  -- Drop user_points policies
  DROP POLICY IF EXISTS "Users can read own points" ON user_points;
  DROP POLICY IF EXISTS "Users can update own points" ON user_points;
  
  -- Drop scan_results policies  
  DROP POLICY IF EXISTS "Users can read own scan results" ON scan_results;
  DROP POLICY IF EXISTS "Users can insert own scan results" ON scan_results;
  
  -- Drop referrals policies
  DROP POLICY IF EXISTS "Users can read referrals they made or received" ON referrals;
  DROP POLICY IF EXISTS "Users can insert referrals" ON referrals;
  
  -- Drop user_profiles policies
  DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
EXCEPTION
  WHEN undefined_object THEN
    NULL; -- Ignore if policies don't exist
END $$;

-- User points table
CREATE TABLE IF NOT EXISTS user_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  points integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_points_user_id_key' 
    AND table_name = 'user_points'
  ) THEN
    ALTER TABLE user_points ADD CONSTRAINT user_points_user_id_key UNIQUE(user_id);
  END IF;
END $$;

-- Scan results table
CREATE TABLE IF NOT EXISTS scan_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type text NOT NULL,
  asset_address text NOT NULL,
  quantum_risk text NOT NULL,
  vulnerabilities jsonb DEFAULT '[]'::jsonb,
  scanned_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  new_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  referrer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  points_awarded integer DEFAULT 10,
  created_at timestamptz DEFAULT now()
);

-- Add unique constraint for referrals if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'referrals_new_user_id_key' 
    AND table_name = 'referrals'
  ) THEN
    ALTER TABLE referrals ADD CONSTRAINT referrals_new_user_id_key UNIQUE(new_user_id);
  END IF;
END $$;

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address text,
  twitter_handle text,
  total_scans integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint for user_profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_profiles_user_id_key' 
    AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_key UNIQUE(user_id);
  END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create fresh policies for user_points
CREATE POLICY "Users can read own points"
  ON user_points
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own points"
  ON user_points
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create fresh policies for scan_results
CREATE POLICY "Users can read own scan results"
  ON scan_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scan results"
  ON scan_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create fresh policies for referrals
CREATE POLICY "Users can read referrals they made or received"
  ON referrals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = new_user_id OR auth.uid() = referrer_id);

CREATE POLICY "Users can insert referrals"
  ON referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = new_user_id);

-- Create fresh policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create performance indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_results_user_id ON scan_results(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);