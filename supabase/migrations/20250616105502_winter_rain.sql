/*
  # Fix payments table migration

  1. Tables
    - Create payments table if not exists
    - Handle existing policies and triggers gracefully
    
  2. Security
    - Enable RLS on payments table
    - Add policies for authenticated users to manage their own payments
    
  3. Performance
    - Add indexes for common queries
    - Add unique constraint on transaction_hash
    
  4. Triggers
    - Auto-update updated_at timestamp
*/

-- Create payments table
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
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT check_payments_amount_positive CHECK (amount > 0),
  CONSTRAINT check_payments_status CHECK (status IN ('pending', 'submitted', 'confirmed', 'failed', 'verification_failed')),
  CONSTRAINT fk_payments_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
  DROP POLICY IF EXISTS "Users can read own payments" ON payments;
  DROP POLICY IF EXISTS "Users can update own payments" ON payments;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create policies
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_network ON payments(network);
CREATE INDEX IF NOT EXISTS idx_payments_service_type ON payments(service_type);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Create unique index on transaction_hash where not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_transaction_hash_unique 
  ON payments(transaction_hash) 
  WHERE transaction_hash IS NOT NULL;

-- Drop existing function and trigger if they exist
DO $$ 
BEGIN
  DROP TRIGGER IF EXISTS trigger_update_payments_updated_at ON payments;
  DROP FUNCTION IF EXISTS update_payments_updated_at();
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER trigger_update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();