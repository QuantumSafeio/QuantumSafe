/*
  # Create Points Transactions Table

  1. New Tables
    - `points_transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `points_change` (decimal, the amount of points added/removed)
      - `source` (text, source of the points change)
      - `metadata` (jsonb, additional data about the transaction)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `points_transactions` table
    - Add policy for users to read their own transactions
    - Add policy for users to insert their own transactions

  3. Indexes
    - Index on user_id for faster queries
    - Index on created_at for chronological sorting
*/

CREATE TABLE IF NOT EXISTS points_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  points_change decimal(10,2) NOT NULL,
  source text NOT NULL DEFAULT 'general',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraint to auth.users
ALTER TABLE points_transactions 
ADD CONSTRAINT points_transactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id 
  ON points_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at 
  ON points_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_points_transactions_source 
  ON points_transactions(source);