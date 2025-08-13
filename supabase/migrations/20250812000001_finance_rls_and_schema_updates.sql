-- Finance System RLS and Schema Updates
-- Date: 2025-08-12
-- Updates: RLS policies for public donations, cashier permissions, and schema alignment

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'cashier_role';

-- ===================================
-- 1. UPDATE EXPENSE_REQUESTS SCHEMA TO MATCH API
-- ===================================

-- Add new columns and update field names to match current API
ALTER TABLE public.expense_requests 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS amount numeric(12,2),
ADD COLUMN IF NOT EXISTS bank_account_holder text,
ADD COLUMN IF NOT EXISTS bank_account_number text,
ADD COLUMN IF NOT EXISTS approved_amount numeric(12,2),
ADD COLUMN IF NOT EXISTS admin_notes text,
ADD COLUMN IF NOT EXISTS created_by_user uuid;

-- Update old columns with new data if needed
UPDATE public.expense_requests 
SET description = purpose,
    amount = amount_requested,
    bank_account_holder = bank_account_name,
    bank_account_number = account_number,
    approved_amount = amount_approved,
    admin_notes = notes,
    created_by_user = user_id
WHERE description IS NULL;

-- Update status values to match API
UPDATE public.expense_requests 
SET status = 'pending' 
WHERE status = 'submitted';

-- Add check constraints for new status values
ALTER TABLE public.expense_requests 
DROP CONSTRAINT IF EXISTS expense_requests_status_check;

ALTER TABLE public.expense_requests 
ADD CONSTRAINT expense_requests_status_check 
CHECK (status IN ('pending','approved','rejected','transferred','closed'));

-- ===================================
-- 2. ADD PUBLIC SELECT POLICY FOR DONATIONS
-- ===================================

-- Allow public to view received donations with public identity
CREATE POLICY "Public can view received public donations" 
ON public.donations FOR SELECT 
TO anon, authenticated
USING (
  status = 'received' AND public_identity = true
);

-- ===================================
-- 3. UPDATE EXPENSE_REQUESTS POLICIES FOR CASHIER PERMISSIONS
-- ===================================

-- Drop existing update policy and recreate with cashier permissions
DROP POLICY IF EXISTS "Users can update own requests while submitted, admins can update status" ON public.expense_requests;

-- Allow cashiers to update transfer status and fees
CREATE POLICY "Users can update own pending, admins can approve/reject, cashiers can transfer" 
ON public.expense_requests FOR UPDATE 
TO authenticated 
USING (
  -- Users can update their own pending requests
  (created_by_user = auth.uid() AND status = 'pending') OR
  -- Admins can approve/reject requests
  (status IN ('pending', 'approved', 'rejected', 'transferred') AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'regional_admin')
  )) OR
  -- Cashiers can mark approved requests as transferred
  (status IN ('approved', 'transferred') AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('cashier_role', 'super_admin')
  ))
)
WITH CHECK (
  -- Users can update their own pending requests
  (created_by_user = auth.uid() AND status = 'pending') OR
  -- Admins can approve/reject requests  
  (status IN ('pending', 'approved', 'rejected', 'transferred', 'closed') AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'regional_admin')
  )) OR
  -- Cashiers can mark approved requests as transferred
  (status IN ('transferred') AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('cashier_role', 'super_admin')
  ))
);

-- ===================================
-- 4. UPDATE SELECT POLICY FOR EXPENSE_REQUESTS
-- ===================================

-- Drop and recreate select policy to use new field names
DROP POLICY IF EXISTS "Users can view own expense requests, admins view all" ON public.expense_requests;

CREATE POLICY "Users can view own expense requests, admins and cashiers view all" 
ON public.expense_requests FOR SELECT 
TO authenticated 
USING (
  created_by_user = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'regional_admin', 'cashier_role')
  )
);

-- ===================================
-- 5. UPDATE INSERT POLICY FOR EXPENSE_REQUESTS  
-- ===================================

-- Drop and recreate insert policy to use new field names
DROP POLICY IF EXISTS "Event organizers can insert expense requests" ON public.expense_requests;

CREATE POLICY "Event organizers can insert expense requests" 
ON public.expense_requests FOR INSERT 
TO authenticated 
WITH CHECK (
  created_by_user = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('event_organizer', 'super_admin', 'regional_admin')
  )
);

-- ===================================
-- 6. ADD CASHIER ROLE TO DONATIONS POLICIES
-- ===================================

-- Update donations policies to include cashier_role
DROP POLICY IF EXISTS "Admins can view all donations" ON public.donations;
DROP POLICY IF EXISTS "Admins can insert donations" ON public.donations;
DROP POLICY IF EXISTS "Admins can update donations" ON public.donations;

-- Admins and cashiers can view all donations
CREATE POLICY "Admins and cashiers can view all donations" 
ON public.donations FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'regional_admin', 'cashier_role')
  )
);

-- Admins and cashiers can insert donations  
CREATE POLICY "Admins and cashiers can insert donations" 
ON public.donations FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'regional_admin', 'cashier_role')
  )
);

-- Admins and cashiers can update donations
CREATE POLICY "Admins and cashiers can update donations" 
ON public.donations FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'regional_admin', 'cashier_role')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'regional_admin', 'cashier_role')
  )
);

-- ===================================
-- 7. CREATE FUNCTIONS FOR PUBLIC DONATIONS
-- ===================================

-- Function to get public donations with statistics
CREATE OR REPLACE FUNCTION get_public_donations(p_event_config_id uuid DEFAULT NULL, p_limit int DEFAULT 50)
RETURNS TABLE (
  donor_name text,
  amount numeric,
  received_at timestamptz,
  note text,
  total_received_amount numeric,
  total_received_count bigint
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  total_amount numeric;
  total_count bigint;
BEGIN
  -- Get totals for statistics
  SELECT 
    COALESCE(SUM(d.amount), 0),
    COUNT(*)
  INTO total_amount, total_count
  FROM donations d
  WHERE d.status = 'received' 
    AND d.public_identity = true
    AND (p_event_config_id IS NULL OR d.event_config_id = p_event_config_id);

  -- Return donations with statistics
  RETURN QUERY
  SELECT 
    d.donor_name,
    d.amount,
    d.received_at,
    d.note,
    total_amount as total_received_amount,
    total_count as total_received_count
  FROM donations d
  WHERE d.status = 'received' 
    AND d.public_identity = true
    AND (p_event_config_id IS NULL OR d.event_config_id = p_event_config_id)
  ORDER BY d.received_at DESC, d.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION get_public_donations TO anon, authenticated;

-- ===================================
-- 8. COMMENTS FOR NEW FEATURES
-- ===================================

COMMENT ON POLICY "Public can view received public donations" ON public.donations IS 'Allows public access to view donations that have been received and marked as public identity';
COMMENT ON POLICY "Users can update own pending, admins can approve/reject, cashiers can transfer" ON public.expense_requests IS 'Implements role-based expense request workflow with cashier transfer permissions';
COMMENT ON FUNCTION get_public_donations IS 'Public function to display donations with statistics for transparency';

-- Update column comments for schema changes
COMMENT ON COLUMN public.expense_requests.description IS 'Description of the expense (replaces purpose)';
COMMENT ON COLUMN public.expense_requests.amount IS 'Requested amount (replaces amount_requested)';
COMMENT ON COLUMN public.expense_requests.bank_account_holder IS 'Name on bank account (replaces bank_account_name)';
COMMENT ON COLUMN public.expense_requests.bank_account_number IS 'Bank account number (replaces account_number)';
COMMENT ON COLUMN public.expense_requests.approved_amount IS 'Final approved amount (replaces amount_approved)';
COMMENT ON COLUMN public.expense_requests.admin_notes IS 'Administrative notes (replaces notes)';
COMMENT ON COLUMN public.expense_requests.created_by_user IS 'User who created the request (replaces user_id)';