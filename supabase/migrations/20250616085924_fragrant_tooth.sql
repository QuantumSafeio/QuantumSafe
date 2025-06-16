/*
  # Create payments table for Web3 transactions

  1. New Tables
    - `payments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `network` (text, blockchain network)
      - `transaction_hash` (text, blockchain transaction hash)
      - `from_address` (text, sender address)
      - `to_address` (text, recipient address)
      - `amount` (numeric, payment amount)
      - `currency` (text, payment currency)
      - `status` (text, payment status)
      - `service_type` (text, type of service purchased)
      - `verified_at` (timestamptz, verification timestamp)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `payments` table
    - Add policies for authenticated users to manage their own payments

  3. Indexes
    - Add indexes for performance optimization
    - Unique index on transaction_hash (where not null)

  4. Triggers
    - Auto-update updated_at timestamp
*/

-- Create payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  network text NOT NULL,
  transaction_hash text,
  from_address text NOT NULL,
  to_address text NOT NULL,
  amount numeric(18,8) NOT NULL,
  currency text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  service_type text NOT NULL,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_payments_user_id' 
    AND table_name = 'payments'
  ) THEN
    ALTER TABLE payments ADD CONSTRAINT fk_payments_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add check constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'check_payments_amount_positive'
  ) THEN
    ALTER TABLE payments ADD CONSTRAINT check_payments_amount_positive 
    CHECK (amount > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'check_payments_status'
  ) THEN
    ALTER TABLE payments ADD CONSTRAINT check_payments_status 
    CHECK (status IN ('pending', 'submitted', 'confirmed', 'failed', 'verification_failed'));
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_network ON payments(network);
CREATE INDEX IF NOT EXISTS idx_payments_service_type ON payments(service_type);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Create unique index on transaction_hash where not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_transaction_hash_unique 
ON payments(transaction_hash) WHERE transaction_hash IS NOT NULL;

-- Create trigger function for updating updated_at
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trigger_update_payments_updated_at'
  ) THEN
    CREATE TRIGGER trigger_update_payments_updated_at
      BEFORE UPDATE ON payments
      FOR EACH ROW
      EXECUTE FUNCTION update_payments_updated_at();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
DROP POLICY IF EXISTS "Users can read own payments" ON payments;
DROP POLICY IF EXISTS "Users can update own payments" ON payments;

-- Create RLS policies
CREATE POLICY "Users can insert own payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own payments"
  ON payments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);