/*
  # Create points transactions table

  1. New Tables
    - `points_transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `points_change` (decimal, can be positive or negative)
      - `source` (text, describes the source of points change)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `points_transactions` table
    - Add policy for users to read their own transactions
    - Add policy for authenticated users to insert their own transactions
*/

CREATE TABLE IF NOT EXISTS points_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  points_change decimal(10,2) NOT NULL,
  source text NOT NULL DEFAULT 'general',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

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

CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id 
  ON points_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at 
  ON points_transactions(created_at DESC);