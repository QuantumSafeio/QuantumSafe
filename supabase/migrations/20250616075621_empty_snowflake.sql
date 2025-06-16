/*
  # Create payments table for Web3 transactions

  1. New Tables
    - `payments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `network` (text, blockchain network)
      - `transaction_hash` (text, unique blockchain tx hash)
      - `from_address` (text, sender wallet address)
      - `to_address` (text, recipient wallet address)
      - `amount` (decimal, payment amount)
      - `currency` (text, currency symbol)
      - `status` (text, payment status)
      - `service_type` (text, type of service purchased)
      - `verified_at` (timestamp, verification time)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `payments` table
    - Add policies for users to manage their own payments
    - Add indexes for performance

  3. Features
    - Track Web3 payments across multiple networks
    - Automatic transaction verification
    - Service type categorization
    - Payment status management
*/

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  network text NOT NULL,
  transaction_hash text,
  from_address text NOT NULL,
  to_address text NOT NULL,
  amount decimal(18,8) NOT NULL,
  currency text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  service_type text NOT NULL,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Add foreign key constraint to auth.users
  CONSTRAINT fk_payments_user_id 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE
);

-- Add unique constraint on transaction_hash (but allow NULL for pending payments)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_transaction_hash_unique 
  ON payments(transaction_hash) 
  WHERE transaction_hash IS NOT NULL;

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can read own payments" ON payments;
  DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
  DROP POLICY IF EXISTS "Users can update own payments" ON payments;
  
  -- Create new policies
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
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_network ON payments(network);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_service_type ON payments(service_type);

-- Add check constraints for data validation
ALTER TABLE payments 
  ADD CONSTRAINT check_payments_status 
  CHECK (status IN ('pending', 'submitted', 'confirmed', 'failed', 'verification_failed'));

ALTER TABLE payments 
  ADD CONSTRAINT check_payments_amount_positive 
  CHECK (amount > 0);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_payments_updated_at ON payments;
CREATE TRIGGER trigger_update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();