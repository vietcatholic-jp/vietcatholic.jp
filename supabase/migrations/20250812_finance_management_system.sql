-- Finance Management System Migration
-- Date: 2025-08-12
-- Implements: Cashier separation, donations, expense requests, and event scoping

-- ===================================
-- 1. ADD EVENT SCOPING TO EXISTING TABLES
-- ===================================

-- Add event_config_id to receipts table
ALTER TABLE public.receipts 
ADD COLUMN IF NOT EXISTS event_config_id uuid REFERENCES public.event_configs(id);

-- Add event_config_id to cancel_requests table
ALTER TABLE public.cancel_requests 
ADD COLUMN IF NOT EXISTS event_config_id uuid REFERENCES public.event_configs(id);

-- Backfill event_config_id for receipts
UPDATE public.receipts r 
SET event_config_id = reg.event_config_id 
FROM public.registrations reg 
WHERE reg.id = r.registration_id 
AND r.event_config_id IS NULL;

-- Backfill event_config_id for cancel_requests
UPDATE public.cancel_requests c 
SET event_config_id = reg.event_config_id 
FROM public.registrations reg 
WHERE reg.id = c.registration_id 
AND c.event_config_id IS NULL;

-- Create indexes on the new event_config_id columns
CREATE INDEX IF NOT EXISTS idx_receipts_event_config_id ON public.receipts(event_config_id);
CREATE INDEX IF NOT EXISTS idx_cancel_requests_event_config_id ON public.cancel_requests(event_config_id);

-- ===================================
-- 2. CREATE DONATIONS TABLE
-- ===================================

CREATE TABLE IF NOT EXISTS public.donations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    event_config_id uuid NOT NULL REFERENCES public.event_configs(id),
    donor_name text NOT NULL,
    contact text,
    amount numeric(12,2) NOT NULL CHECK (amount > 0),
    public_identity boolean NOT NULL DEFAULT false,
    note text,
    status text NOT NULL DEFAULT 'pledged' CHECK (status IN ('pledged','received')),
    received_at timestamptz,
    created_by uuid
);

-- Create indexes for donations
CREATE INDEX IF NOT EXISTS idx_donations_event_config_id ON public.donations(event_config_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON public.donations(created_at);

-- ===================================
-- 3. CREATE EXPENSE_REQUESTS TABLE
-- ===================================

CREATE TABLE IF NOT EXISTS public.expense_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    event_config_id uuid NOT NULL REFERENCES public.event_configs(id),  
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('reimbursement','advance')),
    amount_requested numeric(12,2) NOT NULL CHECK (amount_requested > 0),
    purpose text NOT NULL,
    bank_account_name text,
    bank_name text,
    bank_branch text,
    account_number text,
    optional_invoice_url text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','transferred','closed')),
    amount_approved numeric(12,2),
    approved_by uuid,
    approved_at timestamptz,
    processed_by uuid,
    processed_at timestamptz,
    transfer_receipt_url text,
    transfer_fee numeric(12,2),
    notes text
);

-- Create indexes for expense_requests
CREATE INDEX IF NOT EXISTS idx_expense_requests_event_config_id ON public.expense_requests(event_config_id);
CREATE INDEX IF NOT EXISTS idx_expense_requests_status ON public.expense_requests(status);
CREATE INDEX IF NOT EXISTS idx_expense_requests_user_id ON public.expense_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_requests_created_at ON public.expense_requests(created_at);

-- ===================================
-- 4. CREATE EXPENSE_ATTACHMENTS TABLE
-- ===================================

CREATE TABLE IF NOT EXISTS public.expense_attachments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_request_id uuid NOT NULL REFERENCES public.expense_requests(id) ON DELETE CASCADE,
    event_config_id uuid NOT NULL REFERENCES public.event_configs(id),
    file_url text NOT NULL,
    file_name text,
    uploaded_at timestamptz NOT NULL DEFAULT now(),
    uploaded_by uuid
);

-- Create indexes for expense_attachments
CREATE INDEX IF NOT EXISTS idx_expense_attachments_request_id ON public.expense_attachments(expense_request_id);
CREATE INDEX IF NOT EXISTS idx_expense_attachments_event_config_id ON public.expense_attachments(event_config_id);

-- ===================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ===================================

-- Enable RLS on new tables
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_attachments ENABLE ROW LEVEL SECURITY;

-- ===================================
-- 6. CREATE RLS POLICIES
-- ===================================

-- DONATIONS POLICIES
-- Admins can view all donations
DROP POLICY IF EXISTS "Admins can view all donations" ON public.donations;

CREATE POLICY "Admins can view all donations" 
ON public.donations FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'cashier_role', 'event_organizer')
  )
);

-- Admins can insert donations
DROP POLICY IF EXISTS "Admins can insert donations" ON public.donations;

CREATE POLICY "Admins can insert donations" 
ON public.donations FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'cashier_role', 'event_organizer')
  )
);

-- Admins can update donations
DROP POLICY IF EXISTS "Admins can update donations" ON public.donations;

CREATE POLICY "Admins can update donations" 
ON public.donations FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('cashier_role')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'cashier_role')
  )
);

-- EXPENSE_REQUESTS POLICIES
-- Users can view their own expense requests, admins can view all
DROP POLICY IF EXISTS "Users can view own expense requests, admins view all" ON public.expense_requests;

CREATE POLICY "Users can view own expense requests, admins view all" 
ON public.expense_requests FOR SELECT 
TO authenticated 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'cashier_role', 'event_organizer')
  )
);

-- Event organizers can insert expense requests
DROP POLICY IF EXISTS "Event organizers can insert expense requests" ON public.expense_requests;

CREATE POLICY "Event organizers can insert expense requests" 
ON public.expense_requests FOR INSERT 
TO authenticated 
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('event_organizer', 'super_admin', 'cashier_role')
  )
);

-- Users can update their own requests while submitted, admins can update status transitions
DROP POLICY IF EXISTS "Users can update own requests while submitted, admins can update status" ON public.expense_requests;
CREATE POLICY "Users can update own requests while submitted, admins can update status" 
ON public.expense_requests FOR UPDATE 
TO authenticated 
USING (
  (user_id = auth.uid() AND status = 'submitted') OR
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'cashier_role', 'event_organizer')
  )
)
WITH CHECK (
  (user_id = auth.uid() AND status = 'submitted') OR
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'cashier_role','event_organizer')
  )
);

-- EXPENSE_ATTACHMENTS POLICIES
-- Users can view attachments for their own requests, admins can view all
DROP POLICY IF EXISTS "Users can view own expense attachments, admins view all" ON public.expense_attachments;

CREATE POLICY "Users can view own expense attachments, admins view all" 
ON public.expense_attachments FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.expense_requests 
    WHERE id = expense_request_id 
    AND (user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'cashier_role', 'event_organizer')
    ))
  )
);

-- Users can insert attachments for their own requests, admins can insert any
DROP POLICY IF EXISTS "Users can insert own expense attachments, admins can insert any" ON public.expense_attachments;

CREATE POLICY "Users can insert own expense attachments, admins can insert any" 
ON public.expense_attachments FOR INSERT 
TO authenticated 
WITH CHECK (
  uploaded_by = auth.uid() AND (
    EXISTS (
      SELECT 1 FROM public.expense_requests 
      WHERE id = expense_request_id 
      AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'cashier_role', 'event_organizer')
    )
  )
);

-- Users can delete their own attachments, admins can delete any
DROP POLICY IF EXISTS "Users can delete own expense attachments, admins can delete any" ON public.expense_attachments;

CREATE POLICY "Users can delete own expense attachments, admins can delete any" 
ON public.expense_attachments FOR DELETE 
TO authenticated 
USING (
  uploaded_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'cashier_role', 'event_organizer')
  )
);

-- ===================================
-- 7. CREATE STORAGE BUCKET
-- ===================================

-- Create finance storage bucket (this needs to be done via Supabase Dashboard or API)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES ('finance', 'finance', false, 52428800, '{"image/*", "application/pdf", "text/*"}');

-- Note: Storage policies will need to be created separately via Supabase Dashboard
-- as they require specific storage schema access

-- ===================================
-- 8. COMMENTS FOR DOCUMENTATION
-- ===================================

COMMENT ON TABLE public.donations IS 'Donation records for events with pledged/received status tracking';
COMMENT ON TABLE public.expense_requests IS 'Expense requests from event organizers for reimbursement or advance payments';
COMMENT ON TABLE public.expense_attachments IS 'File attachments for expense requests (invoices, receipts, etc.)';

COMMENT ON COLUMN public.receipts.event_config_id IS 'Links payment receipts to specific events for scoping';
COMMENT ON COLUMN public.cancel_requests.event_config_id IS 'Links cancellation requests to specific events for scoping';

COMMENT ON COLUMN public.donations.status IS 'pledged: donation committed but not yet received, received: donation received';
COMMENT ON COLUMN public.donations.public_identity IS 'Whether donor name should be shown in public donor roll';

COMMENT ON COLUMN public.expense_requests.type IS 'reimbursement: pay back expenses already incurred, advance: pay upfront for future expenses';
COMMENT ON COLUMN public.expense_requests.status IS 'submitted → approved/rejected → transferred → closed';
COMMENT ON COLUMN public.expense_requests.amount_approved IS 'Final approved amount (may differ from requested amount)';
COMMENT ON COLUMN public.expense_requests.transfer_fee IS 'Banking fees incurred during transfer';