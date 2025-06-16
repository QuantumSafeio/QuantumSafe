/*
  # Fix payments table migration - avoid duplicates

  1. New Tables
    - `payments` table (only if not exists)
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
    - Add policies for authenticated users (with duplicate checks)

  3. Indexes
    - Add indexes for performance optimization
    - Unique index on transaction_hash (where not null)

  4. Triggers
    - Auto-update updated_at timestamp
*/

-- Create payments table only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payments') THEN
    CREATE TABLE payments (
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
      CONSTRAINT fk_payments_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT check_payments_amount_positive CHECK (amount > 0),
      CONSTRAINT check_payments_status CHECK (status IN ('pending', 'submitted', 'confirmed', 'failed', 'verification_failed'))
    );
  END IF;
END $$;

-- Enable RLS (safe to run multiple times)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Drop policies if they exist
  DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
  DROP POLICY IF EXISTS "Users can read own payments" ON payments;
  DROP POLICY IF EXISTS "Users can update own payments" ON payments;
  
  -- Create new policies
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
END $$;

-- Create indexes for performance (IF NOT EXISTS is safe)
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_network ON payments(network);
CREATE INDEX IF NOT EXISTS idx_payments_service_type ON payments(service_type);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Create unique index on transaction_hash (where not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_transaction_hash_unique 
  ON payments(transaction_hash) 
  WHERE transaction_hash IS NOT NULL;

-- Create function to update updated_at timestamp (replace if exists)
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DO $$
BEGIN
  DROP TRIGGER IF EXISTS trigger_update_payments_updated_at ON payments;
  
  CREATE TRIGGER trigger_update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payments_updated_at();
END $$;