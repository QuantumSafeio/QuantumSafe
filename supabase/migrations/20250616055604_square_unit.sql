/*
  # Points Transactions Table Migration

  1. New Tables
    - `points_transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `points_change` (decimal, the amount of points changed)
      - `source` (text, source of the transaction)
      - `metadata` (jsonb, additional transaction data)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `points_transactions` table
    - Add policy for users to read their own transactions
    - Add policy for users to insert their own transactions

  3. Indexes
    - Index on user_id for faster queries
    - Index on created_at for chronological sorting
    - Index on source for filtering by transaction type
*/

-- Create the points_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS points_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_change decimal(10,2) NOT NULL,
  source text NOT NULL DEFAULT 'general',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on the table
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Drop and recreate the SELECT policy
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'points_transactions' 
    AND policyname = 'Users can read own transactions'
  ) THEN
    DROP POLICY "Users can read own transactions" ON points_transactions;
  END IF;
  
  CREATE POLICY "Users can read own transactions"
    ON points_transactions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

  -- Drop and recreate the INSERT policy
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'points_transactions' 
    AND policyname = 'Users can insert own transactions'
  ) THEN
    DROP POLICY "Users can insert own transactions" ON points_transactions;
  END IF;
  
  CREATE POLICY "Users can insert own transactions"
    ON points_transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id 
  ON points_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at 
  ON points_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_points_transactions_source 
  ON points_transactions(source);