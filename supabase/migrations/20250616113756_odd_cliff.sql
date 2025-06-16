/*
  # إصلاح جدول المدفوعات

  1. الجداول الجديدة
    - `payments` - جدول المدفوعات مع جميع الحقول المطلوبة
  
  2. الأمان
    - تفعيل RLS على جدول payments
    - إضافة سياسات للمستخدمين المصرح لهم
  
  3. التحسينات
    - إضافة فهارس للأداء
    - إضافة قيود التحقق
    - إضافة مشغل التحديث التلقائي
*/

-- إنشاء جدول المدفوعات إذا لم يكن موجوداً
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

-- إضافة القيود إذا لم تكن موجودة
ALTER TABLE payments DROP CONSTRAINT IF EXISTS check_payments_amount_positive;
ALTER TABLE payments ADD CONSTRAINT check_payments_amount_positive CHECK (amount > 0);

ALTER TABLE payments DROP CONSTRAINT IF EXISTS check_payments_status;
ALTER TABLE payments ADD CONSTRAINT check_payments_status 
CHECK (status IN ('pending', 'submitted', 'confirmed', 'failed', 'verification_failed'));

ALTER TABLE payments DROP CONSTRAINT IF EXISTS fk_payments_user_id;
ALTER TABLE payments ADD CONSTRAINT fk_payments_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- تفعيل RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- حذف السياسات الموجودة وإعادة إنشائها
DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
DROP POLICY IF EXISTS "Users can read own payments" ON payments;
DROP POLICY IF EXISTS "Users can update own payments" ON payments;

CREATE POLICY "Users can insert own payments"
  ON payments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own payments"
  ON payments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own payments"
  ON payments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_network ON payments(network);
CREATE INDEX IF NOT EXISTS idx_payments_service_type ON payments(service_type);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- فهرس فريد لـ transaction_hash
DROP INDEX IF EXISTS idx_payments_transaction_hash_unique;
CREATE UNIQUE INDEX idx_payments_transaction_hash_unique 
  ON payments(transaction_hash) 
  WHERE transaction_hash IS NOT NULL;

-- إنشاء دالة التحديث
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء المشغل
DROP TRIGGER IF EXISTS trigger_update_payments_updated_at ON payments;
CREATE TRIGGER trigger_update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();