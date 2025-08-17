# Finance Plan: Cashier Separation, Donations, Expense Requests, and Event Scoping

Date: 2025-08-13
Branch: hot-fix-registration-payment
Owner: DangHoangGeo/daihoiconggiao.jp

## 1) Objectives
- Isolate cashier operations from registration management.
- Add new finance features: Donations (revenue) and Expense Requests (expenditure).
- Enforce strict event-level scoping via `event_config_id` across all finance data.
- Keep UX simple: cashier works on the active event.

## 2) Architecture & Reuse
- Auth/roles: reuse `requireRole` (lib/auth.ts) and `UserRole` (lib/types.ts).
- Workflow patterns: mirror `cancel_requests` (status transitions + API + UI).
- Storage: reuse image compression + upload, extend policies modeled on `receipts`.
- App Router: stick to protected pages + API routes.

## 3) Roles & Permissions
- Add role: `cashier_role` (processor for payments/refunds and expense transfers).
- Optional role: `event_holder_role` (approver for expense requests). If not added, map:
  - event_holder_role => super_admin
  - cashier_role => cashier_role (preferred) or fallback to super_admin

Gates
- Registration Manager: manage registrations and registrants only (no payment confirm/reject).
- Cashier: confirm/reject registration payments; process approved cancellations; mark expense transfers.
- Event Holder: approve/reject expense requests.
- Visibility:
  - super_admin, regional_admin: view all finance lists.
  - event_organizer: view/submit own expense requests.

## 4) Event Scoping (single active event for operators)
- All finance tables include `event_config_id` and are filtered by the operator’s active event in UI + APIs.
- DB: add `event_config_id` to missing tables (`receipts`, `cancel_requests`) and to all new tables.

## 5) Data Model (Supabase)
Existing corrections
- receipts: add `event_config_id uuid references public.event_configs(id)` + index.
- cancel_requests: add `event_config_id uuid references public.event_configs(id)` + index.

New tables
- donations
  - Columns: id (uuid pk, default gen_random_uuid()), created_at (timestamptz, default now()),
    event_config_id (uuid not null references public.event_configs(id)),
    donor_name (text not null), contact (text), amount (numeric(12,2) not null check (amount > 0)),
    public_identity (boolean not null default false), note (text),
    status (text not null default 'pledged' check (status in ('pledged','received'))),
    received_at (timestamptz), created_by (uuid null)
  - Indexes: (event_config_id), (status), (created_at)
- expense_requests
  - Columns: id (uuid pk, default gen_random_uuid()), created_at (timestamptz default now()),
    event_config_id (uuid not null references public.event_configs(id)),
    user_id (uuid not null), type (text not null check (type in ('reimbursement','advance'))),
    amount_requested (numeric(12,2) not null check (amount_requested > 0)),
    purpose (text not null), bank_account_name (text), bank_name (text), bank_branch (text), account_number (text),
    optional_invoice_url (text), status (text not null default 'submitted' check (status in ('submitted','approved','rejected','transferred','closed'))),
    amount_approved (numeric(12,2)), approved_by (uuid), approved_at (timestamptz),
    processed_by (uuid), processed_at (timestamptz), transfer_receipt_url (text), transfer_fee (numeric(12,2)),
    notes (text)
  - Indexes: (event_config_id), (status), (user_id), (created_at)
- expense_attachments (optional)
  - Columns: id (uuid pk, default gen_random_uuid()),
    expense_request_id (uuid not null references public.expense_requests(id) on delete cascade),
    event_config_id (uuid not null references public.event_configs(id)),
    file_url (text not null), file_name (text), uploaded_at (timestamptz default now()), uploaded_by (uuid)
  - Indexes: (expense_request_id), (event_config_id)

Notes
- Intentionally omit FKs to `profiles`/`auth.users` for `created_by`, `user_id`, `approved_by`, `processed_by` to reduce coupling; enforce via API + RLS.

## 6) Storage (New private bucket: `finance`)
Structure
- finance/receipts/{eventId}/{registrationId}/{filename}
- finance/expenses/{eventId}/{expenseId}/attachments/{filename}
- finance/transfers/{eventId}/{expenseId}/{filename}

Policies (mirror `receipts` patterns)
- Users manage own uploads under a user-scoped prefix when applicable.
- event_organizer: read own uploaded files.
- cashier_role and admins: read all within matching event.
- Keep bucket private; serve via signed URLs from APIs.

## 7) APIs (App Router)
Cashier-only (payments/refunds)
- POST /api/cashier/payments/[registrationId]/confirm
- POST /api/cashier/payments/[registrationId]/reject
- POST /api/cashier/cancel-requests/[id]/process
  - Guards: `requireRole(['cashier_role','super_admin'])`
  - Checks: ensure resource.event_config_id matches active event
  - Logs: PAYMENT_CONFIRMED, PAYMENT_REJECTED, CANCELLATION_PROCESSED

Donations
- POST /api/donations: create donation (public or authenticated). Validate captcha/anti-abuse; default status='pledged'.
- GET /api/donations: admin list with filters (status, date range, event_config_id).
- GET /api/donations/public: public donor roll (filter status='received' AND public_identity=true, by event).
- PATCH /api/admin/donations/[id]: admin update (mark received, edit fields).

Expense Requests
- POST /api/expenses: requester (event_organizer) submits with optional invoice URL.
- GET /api/expenses: requester sees own; admins see all; filter by event_config_id.
- PATCH /api/admin/expenses/[id]/approve: event_holder approves (set amount_approved, notes).
- PATCH /api/admin/expenses/[id]/reject: event_holder rejects (notes).
- PATCH /api/admin/expenses/[id]/transfer: cashier marks transferred (transfer_receipt_url, transfer_fee).
- PATCH /api/admin/expenses/[id]/close: finalize/close.

## 8) UI & Routes
Cashier (isolated)
- app/(protected)/cashier/page.tsx → `await requireRole(['cashier_role','super_admin'])`
- components/cashier/cashier-dashboard.tsx
  - Tabs: Payments to Confirm (status=report_paid), Refunds to Process (cancel_requests.status=approved)
  - Event selector: default to active event

Registration Manager (cleanup)
- Remove confirm/reject payment actions from `RegistrationEditModal.tsx` unless `cashier_role` or super_admin.
- Enforce server-side checks even if UI is hidden.

Finance Admin
- app/(protected)/finance/donations/page.tsx: list + edit (admin only).
- app/(protected)/finance/expenses/page.tsx: list + approve/reject/transfer flows based on role.
- Public donor roll: app/donations/public (server-rendered from `/api/donations/public`).

## 9) Status Machines (reference)
- Registration payments: report_paid → confirm_paid | payment_rejected (cashier only).
- Cancel requests: approved → processed (cashier only).
- Expense requests: submitted → approved | rejected (event_holder); approved → transferred (cashier); transferred → closed (admin optional).
- Donations: pledged → received (admin).

## 10) RLS Strategy (high level, mirror existing patterns)
- Enable RLS on new tables; deny by default.
- donations
  - select: admins (and regional_admin) for all; no anon/table-level public select (serve via API).
  - insert: allow authenticated users; optional public insert via API only (preferred) to centralize validation.
  - update: admins only.
- expense_requests
  - select: owner (user_id = auth.uid()), admins, regional_admin; scoped by event_config_id.
  - insert: owner only; event_config_id must equal active event passed by API.
  - update transitions: owner can edit only while status='submitted'; event_holder can set approved/rejected; cashier can set transferred; admin can close.
- expense_attachments
  - select: owner, admins; scoped by event.
  - insert/delete: owner; admins.
- Storage bucket `finance`: private; signed URLs; event/caller checks in API; bucket policies mirror `receipts` with cashier/admin read-all.

## 11) Migrations (Dev first, then Prod)
SQL (draft)
- Alter existing
  - ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS event_config_id uuid REFERENCES public.event_configs(id);
  - ALTER TABLE public.cancel_requests ADD COLUMN IF NOT EXISTS event_config_id uuid REFERENCES public.event_configs(id);
  - UPDATE public.receipts r SET event_config_id = reg.event_config_id FROM public.registrations reg WHERE reg.id = r.registration_id AND r.event_config_id IS NULL;
  - UPDATE public.cancel_requests c SET event_config_id = reg.event_config_id FROM public.registrations reg WHERE reg.id = c.registration_id AND c.event_config_id IS NULL;
  - CREATE INDEX IF NOT EXISTS idx_receipts_event_config_id ON public.receipts(event_config_id);
  - CREATE INDEX IF NOT EXISTS idx_cancel_requests_event_config_id ON public.cancel_requests(event_config_id);

- Create tables
  - CREATE TABLE IF NOT EXISTS public.donations (
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
  - CREATE INDEX IF NOT EXISTS idx_donations_event_config_id ON public.donations(event_config_id);
  - CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations(status);
  - CREATE INDEX IF NOT EXISTS idx_donations_created_at ON public.donations(created_at);

  - CREATE TABLE IF NOT EXISTS public.expense_requests (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at timestamptz NOT NULL DEFAULT now(),
      event_config_id uuid NOT NULL REFERENCES public.event_configs(id),
      user_id uuid NOT NULL,
      type text NOT NULL CHECK (type IN ('reimbursement','advance')),
      amount_requested numeric(12,2) NOT NULL CHECK (amount_requested > 0),
      purpose text NOT NULL,
      bank_account_name text,
      bank_name text,
      bank_branch text,
      account_number text,
      optional_invoice_url text,
      status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','approved','rejected','transferred','closed')),
      amount_approved numeric(12,2),
      approved_by uuid,
      approved_at timestamptz,
      processed_by uuid,
      processed_at timestamptz,
      transfer_receipt_url text,
      transfer_fee numeric(12,2),
      notes text
    );
  - CREATE INDEX IF NOT EXISTS idx_expense_requests_event_config_id ON public.expense_requests(event_config_id);
  - CREATE INDEX IF NOT EXISTS idx_expense_requests_status ON public.expense_requests(status);
  - CREATE INDEX IF NOT EXISTS idx_expense_requests_user_id ON public.expense_requests(user_id);
  - CREATE INDEX IF NOT EXISTS idx_expense_requests_created_at ON public.expense_requests(created_at);

  - CREATE TABLE IF NOT EXISTS public.expense_attachments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      expense_request_id uuid NOT NULL REFERENCES public.expense_requests(id) ON DELETE CASCADE,
      event_config_id uuid NOT NULL REFERENCES public.event_configs(id),
      file_url text NOT NULL,
      file_name text,
      uploaded_at timestamptz NOT NULL DEFAULT now(),
      uploaded_by uuid
    );
  - CREATE INDEX IF NOT EXISTS idx_expense_attachments_request_id ON public.expense_attachments(expense_request_id);
  - CREATE INDEX IF NOT EXISTS idx_expense_attachments_event_config_id ON public.expense_attachments(event_config_id);

- RLS enablement (outline)
  - ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
  - ALTER TABLE public.expense_requests ENABLE ROW LEVEL SECURITY;
  - ALTER TABLE public.expense_attachments ENABLE ROW LEVEL SECURITY;
  - Define policies mirroring registrations/admin patterns (owner read/write; admin read-all; role-based transition updates; event-scoped).

- Storage
  - Create private bucket `finance` with subfolders receipts/, expenses/, transfers/.
  - Apply policies mirroring `receipts` bucket; extend read to `cashier_role`.

## 12) Observability
- Add event logs for key transitions: PAYMENT_CONFIRMED, PAYMENT_REJECTED, CANCELLATION_PROCESSED, EXPENSE_APPROVED, EXPENSE_REJECTED, EXPENSE_TRANSFERRED, DONATION_RECEIVED.
- Reuse existing logging utilities (lib/logging if present) or create minimal service.

## 13) Testing
- Unit
  - Role gating for cashier/holder/admin on APIs.
  - Validators for donation/expense payloads.
- Integration
  - Payment flow: report_paid → confirm_paid/payment_rejected (cashier).
  - Cancel flow: approved → processed (cashier).
  - Expense flow: submitted → approved/rejected (holder) → transferred (cashier) → closed.
  - Donations: pledged → received.
- E2E
  - Cashier dashboard actions restricted to cashier.
  - Finance lists respect `event_config_id`.
  - Public donor roll shows only `public_identity=true` and `status=received`.

## 14) Rollout Plan
1. Migrations in dev; backfill; verify indexes and RLS.
2. Add `cashier_role`; update `requireRole` and navigation.
3. Build cashier route (read-only lists) scoped to active event.
4. Implement cashier APIs; wire confirm/reject/refund actions.
5. Remove cashier actions from Registration Manager UI.
6. Implement donations/expenses APIs and admin UIs.
7. Add finance bucket + upload flows (signed URLs).
8. QA + tests; production rollout.

## 15) Open Questions
- Event selection beyond active event for cashier/admin? For now: active event only.
- Store transfer receipts + fees now? Yes (fields included) and use finance/transfers/ path.
- Any regional scoping beyond event? No.
