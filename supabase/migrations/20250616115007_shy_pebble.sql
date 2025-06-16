/*
  # Create points transactions table

  1. New Tables
    - `points_transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `points_change` (decimal, the change in points)
      - `source` (text, source of the transaction)
      - `metadata` (jsonb, additional data)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `points_transactions` table
    - Add policies for users to read and insert their own transactions

  3. Indexes
    - Index on user_id for faster queries
    - Index on created_at for chronological ordering
    - Index on source for filtering by transaction type
*/

-- Create points_transactions table
CREATE TABLE IF NOT EXISTS points_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_change decimal(10,2) NOT NULL,
  source text NOT NULL DEFAULT 'general',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own transactions" ON points_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON points_transactions;

-- Create RLS policies
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id 
  ON points_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at 
  ON points_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_points_transactions_source 
  ON points_transactions(source);