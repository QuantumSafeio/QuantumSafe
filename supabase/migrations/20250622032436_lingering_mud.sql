/*
  # Enhanced Points and Referral System

  1. New Tables
    - `points_transactions` - Detailed tracking of all point changes
    - `social_media_stats` - Social media engagement statistics
    - `ambassador_tiers` - Ambassador program tier definitions
    - `user_achievements` - User achievement tracking

  2. Enhanced Existing Tables
    - Add new columns to `user_points` for categorized points
    - Add new columns to `referrals` for commission tracking

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for data access
    - Create performance indexes

  4. Functions
    - `calculate_ambassador_tier()` - Automatically calculate user tier
    - `award_points()` - Award points with proper tracking
    - `process_referral_commission()` - Handle referral commissions
*/

-- Points transactions table for detailed tracking
CREATE TABLE IF NOT EXISTS points_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  points_change numeric(10,2) NOT NULL,
  source text NOT NULL DEFAULT 'general',
  platform text, -- twitter, telegram, youtube, linkedin, referral, scan
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Social media statistics tracking
CREATE TABLE IF NOT EXISTS social_media_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text NOT NULL, -- twitter, telegram, youtube, linkedin
  posts_count integer DEFAULT 0,
  engagement_count integer DEFAULT 0,
  total_points numeric(10,2) DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Ambassador program tiers
CREATE TABLE IF NOT EXISTS ambassador_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name text NOT NULL UNIQUE,
  min_referrals integer NOT NULL DEFAULT 0,
  min_points integer NOT NULL DEFAULT 0,
  min_social_posts integer NOT NULL DEFAULT 0,
  bonus_percentage numeric(5,2) NOT NULL DEFAULT 0,
  benefits jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- User achievements tracking
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_type text NOT NULL,
  achievement_data jsonb DEFAULT '{}'::jsonb,
  points_awarded integer DEFAULT 0,
  unlocked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
  -- Add foreign key for points_transactions if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'points_transactions_user_id_fkey'
  ) THEN
    ALTER TABLE points_transactions 
    ADD CONSTRAINT points_transactions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  -- Add foreign key for social_media_stats if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'social_media_stats_user_id_fkey'
  ) THEN
    ALTER TABLE social_media_stats 
    ADD CONSTRAINT social_media_stats_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  -- Add foreign key for user_achievements if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_achievements_user_id_fkey'
  ) THEN
    ALTER TABLE user_achievements 
    ADD CONSTRAINT user_achievements_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add columns to existing user_points table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_points' AND column_name = 'social_media_points'
  ) THEN
    ALTER TABLE user_points ADD COLUMN social_media_points numeric(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_points' AND column_name = 'referral_points'
  ) THEN
    ALTER TABLE user_points ADD COLUMN referral_points numeric(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_points' AND column_name = 'scan_points'
  ) THEN
    ALTER TABLE user_points ADD COLUMN scan_points numeric(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_points' AND column_name = 'ambassador_tier'
  ) THEN
    ALTER TABLE user_points ADD COLUMN ambassador_tier text DEFAULT 'none';
  END IF;
END $$;

-- Add columns to existing referrals table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referrals' AND column_name = 'commission_rate'
  ) THEN
    ALTER TABLE referrals ADD COLUMN commission_rate numeric(5,2) DEFAULT 7.0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referrals' AND column_name = 'total_earned'
  ) THEN
    ALTER TABLE referrals ADD COLUMN total_earned numeric(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referrals' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE referrals ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambassador_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Drop and recreate policies for points_transactions
  DROP POLICY IF EXISTS "Users can read own transactions" ON points_transactions;
  DROP POLICY IF EXISTS "Users can insert own transactions" ON points_transactions;
  
  CREATE POLICY "Users can read own transactions"
    ON points_transactions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert own transactions"
    ON points_transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

  -- Drop and recreate policies for social_media_stats
  DROP POLICY IF EXISTS "Users can read own social stats" ON social_media_stats;
  DROP POLICY IF EXISTS "Users can manage own social stats" ON social_media_stats;
  
  CREATE POLICY "Users can read own social stats"
    ON social_media_stats
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can manage own social stats"
    ON social_media_stats
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

  -- Drop and recreate policies for ambassador_tiers
  DROP POLICY IF EXISTS "Anyone can read ambassador tiers" ON ambassador_tiers;
  
  CREATE POLICY "Anyone can read ambassador tiers"
    ON ambassador_tiers
    FOR SELECT
    TO authenticated
    USING (true);

  -- Drop and recreate policies for user_achievements
  DROP POLICY IF EXISTS "Users can read own achievements" ON user_achievements;
  DROP POLICY IF EXISTS "Users can insert own achievements" ON user_achievements;
  
  CREATE POLICY "Users can read own achievements"
    ON user_achievements
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert own achievements"
    ON user_achievements
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
END $$;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_source ON points_transactions(source);
CREATE INDEX IF NOT EXISTS idx_points_transactions_platform ON points_transactions(platform);
CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON points_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_media_stats_user_id ON social_media_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_social_media_stats_platform ON social_media_stats(platform);
CREATE INDEX IF NOT EXISTS idx_social_media_stats_last_updated ON social_media_stats(last_updated DESC);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_type ON user_achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at DESC);

-- Insert default ambassador tiers
INSERT INTO ambassador_tiers (tier_name, min_referrals, min_points, min_social_posts, bonus_percentage, benefits) VALUES
  ('bronze', 10, 500, 5, 10.0, '["10% Bonus on all points", "Exclusive Discord access", "Bronze badge on profile"]'::jsonb),
  ('silver', 25, 1500, 15, 15.0, '["15% Bonus on all points", "Monthly crypto rewards", "Early feature access"]'::jsonb),
  ('gold', 50, 5000, 30, 25.0, '["25% Bonus on all points", "Premium NFT rewards", "Direct team contact"]'::jsonb)
ON CONFLICT (tier_name) DO NOTHING;

-- Function to calculate user ambassador tier
CREATE OR REPLACE FUNCTION calculate_ambassador_tier(user_uuid uuid)
RETURNS text AS $$
DECLARE
  user_referrals integer;
  user_points integer;
  user_social_posts integer;
  tier_result text := 'none';
BEGIN
  -- Get user referral count
  SELECT COUNT(*) INTO user_referrals
  FROM referrals
  WHERE referrer_id = user_uuid AND is_active = true;
  
  -- Get user total points
  SELECT COALESCE(points, 0) INTO user_points
  FROM user_points
  WHERE user_id = user_uuid;
  
  -- Get user social media posts count
  SELECT COALESCE(SUM(posts_count), 0) INTO user_social_posts
  FROM social_media_stats
  WHERE user_id = user_uuid;
  
  -- Determine tier based on requirements
  IF user_referrals >= 50 AND user_points >= 5000 AND user_social_posts >= 30 THEN
    tier_result := 'gold';
  ELSIF user_referrals >= 25 AND user_points >= 1500 AND user_social_posts >= 15 THEN
    tier_result := 'silver';
  ELSIF user_referrals >= 10 AND user_points >= 500 AND user_social_posts >= 5 THEN
    tier_result := 'bronze';
  END IF;
  
  -- Update user's ambassador tier
  UPDATE user_points 
  SET ambassador_tier = tier_result
  WHERE user_id = user_uuid;
  
  RETURN tier_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award points with proper tracking
CREATE OR REPLACE FUNCTION award_points(
  user_uuid uuid,
  points_amount numeric,
  point_source text DEFAULT 'general',
  point_platform text DEFAULT NULL,
  point_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
  -- Insert transaction record
  INSERT INTO points_transactions (user_id, points_change, source, platform, metadata)
  VALUES (user_uuid, points_amount, point_source, point_platform, point_metadata);
  
  -- Update user total points
  INSERT INTO user_points (user_id, points, created_at, updated_at)
  VALUES (user_uuid, points_amount, now(), now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    points = user_points.points + points_amount,
    updated_at = now();
  
  -- Update category-specific points
  IF point_source = 'social' THEN
    UPDATE user_points 
    SET social_media_points = COALESCE(social_media_points, 0) + points_amount
    WHERE user_id = user_uuid;
  ELSIF point_source = 'referral' THEN
    UPDATE user_points 
    SET referral_points = COALESCE(referral_points, 0) + points_amount
    WHERE user_id = user_uuid;
  ELSIF point_source = 'scan' THEN
    UPDATE user_points 
    SET scan_points = COALESCE(scan_points, 0) + points_amount
    WHERE user_id = user_uuid;
  END IF;
  
  -- Recalculate ambassador tier
  PERFORM calculate_ambassador_tier(user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process referral commission
CREATE OR REPLACE FUNCTION process_referral_commission(
  referred_user_uuid uuid,
  points_earned numeric
)
RETURNS void AS $$
DECLARE
  referrer_uuid uuid;
  commission_rate numeric;
  commission_amount numeric;
BEGIN
  -- Get referrer information
  SELECT referrer_id, commission_rate INTO referrer_uuid, commission_rate
  FROM referrals
  WHERE new_user_id = referred_user_uuid AND is_active = true;
  
  -- If referrer exists, calculate and award commission
  IF referrer_uuid IS NOT NULL THEN
    commission_amount := points_earned * (commission_rate / 100.0);
    
    -- Award commission to referrer
    PERFORM award_points(
      referrer_uuid,
      commission_amount,
      'referral',
      'commission',
      jsonb_build_object(
        'referred_user', referred_user_uuid,
        'original_points', points_earned,
        'commission_rate', commission_rate
      )
    );
    
    -- Update referral total earned
    UPDATE referrals
    SET total_earned = COALESCE(total_earned, 0) + commission_amount
    WHERE referrer_id = referrer_uuid AND new_user_id = referred_user_uuid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;