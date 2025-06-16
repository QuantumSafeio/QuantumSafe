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
      CONSTRAINT check_payments_amount_positive CHECK (amount > 0),
      CONSTRAINT check_payments_status CHECK (status IN ('pending', 'submitted', 'confirmed', 'failed', 'verification_failed')),
      CONSTRAINT fk_payments_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
    );
  END IF;
END $$;

-- Enable RLS if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'payments' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies only if they don't exist
DO $$
BEGIN
  -- Insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payments' AND policyname = 'Users can insert own payments'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can insert own payments"
      ON payments
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id)';
  END IF;

  -- Select policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payments' AND policyname = 'Users can read own payments'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can read own payments"
      ON payments
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id)';
  END IF;

  -- Update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payments' AND policyname = 'Users can update own payments'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update own payments"
      ON payments
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)';
  END IF;
END $$;

-- Create indexes only if they don't exist
DO $$
BEGIN
  -- User ID index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'payments' AND indexname = 'idx_payments_user_id'
  ) THEN
    CREATE INDEX idx_payments_user_id ON payments(user_id);
  END IF;

  -- Status index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'payments' AND indexname = 'idx_payments_status'
  ) THEN
    CREATE INDEX idx_payments_status ON payments(status);
  END IF;

  -- Network index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'payments' AND indexname = 'idx_payments_network'
  ) THEN
    CREATE INDEX idx_payments_network ON payments(network);
  END IF;

  -- Service type index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'payments' AND indexname = 'idx_payments_service_type'
  ) THEN
    CREATE INDEX idx_payments_service_type ON payments(service_type);
  END IF;

  -- Created at index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'payments' AND indexname = 'idx_payments_created_at'
  ) THEN
    CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
  END IF;

  -- Unique transaction hash index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'payments' AND indexname = 'idx_payments_transaction_hash_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_payments_transaction_hash_unique 
      ON payments(transaction_hash) 
      WHERE transaction_hash IS NOT NULL;
  END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_payments_updated_at'
  ) THEN
    CREATE TRIGGER trigger_update_payments_updated_at
      BEFORE UPDATE ON payments
      FOR EACH ROW
      EXECUTE FUNCTION update_payments_updated_at();
  END IF;
END $$;