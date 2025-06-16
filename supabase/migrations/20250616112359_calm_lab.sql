/*
  # إصلاح نهائي لجدول المدفوعات
  
  1. التحقق من وجود الجدول
  2. إنشاء الجدول فقط إذا لم يكن موجوداً
  3. تجنب تضارب السياسات والفهارس
*/

-- التحقق من وجود الجدول وإنشاؤه فقط إذا لم يكن موجوداً
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

    -- Enable RLS
    ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

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

    -- Create indexes
    CREATE INDEX idx_payments_user_id ON payments(user_id);
    CREATE INDEX idx_payments_status ON payments(status);
    CREATE INDEX idx_payments_network ON payments(network);
    CREATE INDEX idx_payments_service_type ON payments(service_type);
    CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
    CREATE UNIQUE INDEX idx_payments_transaction_hash_unique 
      ON payments(transaction_hash) 
      WHERE transaction_hash IS NOT NULL;

    -- Create function and trigger
    CREATE OR REPLACE FUNCTION update_payments_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trigger_update_payments_updated_at
      BEFORE UPDATE ON payments
      FOR EACH ROW
      EXECUTE FUNCTION update_payments_updated_at();
  END IF;
END $$;