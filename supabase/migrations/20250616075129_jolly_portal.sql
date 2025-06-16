/*
  # Create Payments Table for Web3 Integration

  1. New Tables
    - `payments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `network` (text, blockchain network)
      - `transaction_hash` (text, blockchain transaction hash)
      - `from_address` (text, sender wallet address)
      - `to_address` (text, recipient wallet address)
      - `amount` (decimal, payment amount)
      - `currency` (text, currency symbol)
      - `status` (text, payment status)
      - `service_type` (text, type of service purchased)
      - `verified_at` (timestamp, when payment was verified)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `payments` table
    - Add policies for users to read their own payments
    - Add policies for users to insert their own payments

  3. Indexes
    - Index on user_id for fast user queries
    - Index on transaction_hash for verification
    - Index on status for filtering
*/

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  network text NOT NULL,
  transaction_hash text UNIQUE NOT NULL,
  from_address text NOT NULL,
  to_address text NOT NULL,
  amount decimal(18,8) NOT NULL,
  currency text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  service_type text NOT NULL,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payments"
  ON payments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_hash ON payments(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_network ON payments(network);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);