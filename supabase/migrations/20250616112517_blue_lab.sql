/*
  # إصلاح جدول المدفوعات

  1. الجداول الجديدة
    - `payments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `network` (text)
      - `transaction_hash` (text, nullable)
      - `from_address` (text)
      - `to_address` (text)
      - `amount` (numeric)
      - `currency` (text)
      - `status` (text with check constraint)
      - `service_type` (text)
      - `verified_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. الأمان
    - تفعيل RLS على جدول `payments`
    - إضافة سياسات للمستخدمين المصادق عليهم

  3. التحسينات
    - فهارس للأداء
    - قيود للتحقق من صحة البيانات
    - دالة لتحديث الوقت تلقائياً
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
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- إضافة القيود إذا لم تكن موجودة
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'check_payments_amount_positive') THEN
    ALTER TABLE payments ADD CONSTRAINT check_payments_amount_positive CHECK (amount > 0);
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'check_payments_status') THEN
    ALTER TABLE payments ADD CONSTRAINT check_payments_status CHECK (status IN ('pending', 'submitted', 'confirmed', 'failed', 'verification_failed'));
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_payments_user_id') THEN
    ALTER TABLE payments ADD CONSTRAINT fk_payments_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- تفعيل RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- إنشاء السياسات فقط إذا لم تكن موجودة
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can insert own payments') THEN
    CREATE POLICY "Users can insert own payments"
      ON payments
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can read own payments') THEN
    CREATE POLICY "Users can read own payments"
      ON payments
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can update own payments') THEN
    CREATE POLICY "Users can update own payments"
      ON payments
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- إنشاء الفهارس فقط إذا لم تكن موجودة
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_network ON payments(network);
CREATE INDEX IF NOT EXISTS idx_payments_service_type ON payments(service_type);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_transaction_hash_unique 
  ON payments(transaction_hash) 
  WHERE transaction_hash IS NOT NULL;

-- إنشاء الدالة والمشغل
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء المشغل فقط إذا لم يكن موجوداً
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.triggers WHERE trigger_name = 'trigger_update_payments_updated_at') THEN
    CREATE TRIGGER trigger_update_payments_updated_at
      BEFORE UPDATE ON payments
      FOR EACH ROW
      EXECUTE FUNCTION update_payments_updated_at();
  END IF;
END $$;