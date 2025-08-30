-- ===================================
-- INCOME SOURCES MANAGEMENT SYSTEM
-- ===================================
-- Date: 2025-08-30
-- Purpose: Add income sources tracking beyond registrations and donations

-- ===================================
-- 1. CREATE INCOME_SOURCES TABLE
-- ===================================

CREATE TABLE IF NOT EXISTS public.income_sources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_config_id uuid NOT NULL REFERENCES public.event_configs(id),
    category text NOT NULL CHECK (category IN ('ticket_sales', 'merchandise', 'food_beverage', 'other')),
    title text NOT NULL,
    description text,
    amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
    expected_amount numeric(12,2) CHECK (expected_amount >= 0),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'overdue')),
    contact_person text,
    contact_info text,
    due_date timestamptz,
    received_date timestamptz,
    notes text,
    created_by uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz
);

-- Create indexes for income_sources
CREATE INDEX IF NOT EXISTS idx_income_sources_event_config_id ON public.income_sources(event_config_id);
CREATE INDEX IF NOT EXISTS idx_income_sources_category ON public.income_sources(category);
CREATE INDEX IF NOT EXISTS idx_income_sources_status ON public.income_sources(status);
CREATE INDEX IF NOT EXISTS idx_income_sources_created_by ON public.income_sources(created_by);
CREATE INDEX IF NOT EXISTS idx_income_sources_created_at ON public.income_sources(created_at);
CREATE INDEX IF NOT EXISTS idx_income_sources_due_date ON public.income_sources(due_date);

-- ===================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ===================================

ALTER TABLE public.income_sources ENABLE ROW LEVEL SECURITY;

-- ===================================
-- 3. CREATE RLS POLICIES
-- ===================================

-- Admins and cashiers can view all income sources
DROP POLICY IF EXISTS "Finance staff can view all income sources" ON public.income_sources;

CREATE POLICY "Finance staff can view all income sources" 
ON public.income_sources FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'cashier_role', 'event_organizer')
  )
);

-- Finance staff can insert income sources
DROP POLICY IF EXISTS "Finance staff can insert income sources" ON public.income_sources;

CREATE POLICY "Finance staff can insert income sources" 
ON public.income_sources FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'cashier_role', 'event_organizer')
  )
);

-- Finance staff can update income sources
DROP POLICY IF EXISTS "Finance staff can update income sources" ON public.income_sources;

CREATE POLICY "Finance staff can update income sources" 
ON public.income_sources FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'cashier_role', 'event_organizer')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'cashier_role', 'event_organizer')
  )
);

-- Only super admins and regional admins can delete income sources
DROP POLICY IF EXISTS "Admins can delete income sources" ON public.income_sources;

CREATE POLICY "Admins can delete income sources" 
ON public.income_sources FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'cashier_role')
  )
);

-- ===================================
-- 4. CREATE FUNCTIONS FOR STATISTICS
-- ===================================

-- Function to get income statistics by event
CREATE OR REPLACE FUNCTION get_income_statistics(p_event_config_id uuid DEFAULT NULL)
RETURNS TABLE (
  category text,
  total_sources bigint,
  pending_sources bigint,
  received_sources bigint,
  overdue_sources bigint,
  total_amount numeric,
  received_amount numeric,
  pending_amount numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.category,
    COUNT(*) as total_sources,
    COUNT(*) FILTER (WHERE i.status = 'pending') as pending_sources,
    COUNT(*) FILTER (WHERE i.status = 'received') as received_sources,
    COUNT(*) FILTER (WHERE i.status = 'overdue') as overdue_sources,
    COALESCE(SUM(i.amount), 0) as total_amount,
    COALESCE(SUM(i.amount) FILTER (WHERE i.status = 'received'), 0) as received_amount,
    COALESCE(SUM(COALESCE(i.expected_amount, i.amount)) FILTER (WHERE i.status = 'pending'), 0) as pending_amount
  FROM public.income_sources i
  WHERE (p_event_config_id IS NULL OR i.event_config_id = p_event_config_id)
  GROUP BY i.category
  ORDER BY total_amount DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_income_statistics TO authenticated;

-- ===================================
-- 5. ADD COMMENTS FOR DOCUMENTATION
-- ===================================

COMMENT ON TABLE public.income_sources IS 'Income sources beyond registrations and donations for comprehensive event finance tracking';

COMMENT ON COLUMN public.income_sources.category IS 'Category of income: sponsorship, vendor_fees, merchandise, food_beverage, parking_fees, transportation, booth_rental, advertising, other';
COMMENT ON COLUMN public.income_sources.amount IS 'Actual amount received (for received status) or current amount (for pending/overdue)';
COMMENT ON COLUMN public.income_sources.expected_amount IS 'Expected amount to be received (can differ from actual amount)';
COMMENT ON COLUMN public.income_sources.status IS 'pending: waiting to receive, received: money received, overdue: past due date without receipt';
COMMENT ON COLUMN public.income_sources.due_date IS 'Expected date to receive the income';
COMMENT ON COLUMN public.income_sources.received_date IS 'Actual date the income was received';

COMMENT ON FUNCTION get_income_statistics IS 'Get income statistics grouped by category for comprehensive financial reporting';

-- ===================================
-- 6. UPDATE TRIGGERS
-- ===================================

-- Trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_income_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_income_sources_updated_at_trigger ON public.income_sources;

CREATE TRIGGER update_income_sources_updated_at_trigger
    BEFORE UPDATE ON public.income_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_income_sources_updated_at();

-- ===================================
-- 7. SAMPLE DATA (for testing)
-- ===================================

-- Note: This sample data is for development/testing only
-- Remove or comment out for production deployment

/*
-- Insert sample income sources (requires active event_config_id)
INSERT INTO public.income_sources (
    event_config_id, 
    category, 
    title, 
    description, 
    amount, 
    expected_amount, 
    status, 
    contact_person, 
    contact_info, 
    due_date, 
    notes,
    created_by
) VALUES 
-- Sponsorship examples
(
    (SELECT id FROM public.event_configs WHERE is_active = true LIMIT 1),
    'sponsorship',
    'ABC Company Main Sponsor',
    'Tài trợ chính từ công ty ABC cho sự kiện',
    500000,
    500000,
    'received',
    'Nguyen Van A',
    'nvana@abc.com',
    '2025-08-20',
    'Đã ký hợp đồng tài trợ',
    (SELECT id FROM public.users WHERE role = 'super_admin' LIMIT 1)
),
-- Vendor fees example
(
    (SELECT id FROM public.event_configs WHERE is_active = true LIMIT 1),
    'vendor_fees',
    'Food Vendor Fees',
    'Phí thuê gian hàng bán đồ ăn',
    0,
    150000,
    'pending',
    'Tran Thi B',
    '090-1234-5678',
    '2025-09-01',
    'Chờ xác nhận phí gian hàng',
    (SELECT id FROM public.users WHERE role = 'super_admin' LIMIT 1)
),
-- Merchandise example
(
    (SELECT id FROM public.event_configs WHERE is_active = true LIMIT 1),
    'merchandise',
    'T-shirt Sales',
    'Bán áo kỷ niệm sự kiện',
    0,
    200000,
    'pending',
    'Le Van C',
    'levanc@example.com',
    '2025-09-15',
    'Dự kiến bán trong sự kiện',
    (SELECT id FROM public.users WHERE role = 'super_admin' LIMIT 1)
);
*/
