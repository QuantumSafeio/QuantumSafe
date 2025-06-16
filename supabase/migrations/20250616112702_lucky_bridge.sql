/*
  # إصلاح نهائي لجدول المدفوعات

  1. التحقق من حالة الجدول الحالية
  2. إضافة الأعمدة المفقودة فقط
  3. إنشاء الفهارس والسياسات المفقودة فقط
  4. تجنب أي تضارب مع البيانات الموجودة
*/

-- التحقق من وجود الأعمدة وإضافة المفقود منها
DO $$
BEGIN
  -- إضافة عمود verified_at إذا لم يكن موجوداً
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE payments ADD COLUMN verified_at timestamptz;
  END IF;

  -- إضافة عمود updated_at إذا لم يكن موجوداً
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE payments ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- تفعيل RLS إذا لم يكن مفعلاً
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'payments' AND rowsecurity = true
  ) THEN
    ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- إنشاء السياسات المفقودة فقط
DO $$
BEGIN
  -- سياسة الإدراج
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payments' AND policyname = 'Users can insert own payments'
  ) THEN
    CREATE POLICY "Users can insert own payments"
      ON payments FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- سياسة القراءة
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payments' AND policyname = 'Users can read own payments'
  ) THEN
    CREATE POLICY "Users can read own payments"
      ON payments FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- سياسة التحديث
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payments' AND policyname = 'Users can update own payments'
  ) THEN
    CREATE POLICY "Users can update own payments"
      ON payments FOR UPDATE TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- إنشاء الفهارس المفقودة
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_network ON payments(network);
CREATE INDEX IF NOT EXISTS idx_payments_service_type ON payments(service_type);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- فهرس فريد لـ transaction_hash
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_payments_transaction_hash_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_payments_transaction_hash_unique 
      ON payments(transaction_hash) 
      WHERE transaction_hash IS NOT NULL;
  END IF;
END $$;

-- إنشاء دالة التحديث
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء المشغل إذا لم يكن موجوداً
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