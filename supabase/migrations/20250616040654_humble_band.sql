/*
  # إنشاء جداول QuantumSafe

  1. الجداول الجديدة
    - `user_points` - نقاط المستخدمين
    - `scan_results` - نتائج الفحص
    - `referrals` - الإحالات
    - `user_profiles` - ملفات المستخدمين

  2. الأمان
    - تفعيل RLS على جميع الجداول
    - إضافة سياسات للمستخدمين المصادق عليهم
*/

-- جدول نقاط المستخدمين
CREATE TABLE IF NOT EXISTS user_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  points integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- جدول نتائج الفحص
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

-- جدول الإحالات
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  new_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  referrer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  points_awarded integer DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  UNIQUE(new_user_id)
);

-- جدول ملفات المستخدمين
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address text,
  twitter_handle text,
  total_scans integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- تفعيل RLS
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- سياسات user_points
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

-- سياسات scan_results
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

-- سياسات referrals
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

-- سياسات user_profiles
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

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_results_user_id ON scan_results(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);