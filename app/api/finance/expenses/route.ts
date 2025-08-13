import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// DB row types (subset used by this API)
type DBExpenseStatsRow = {
  status: 'submitted' | 'approved' | 'rejected' | 'transferred' | 'closed';
  amount_requested: string | number | null;
  amount_approved: string | number | null;
};

type DBExpenseRow = {
  id: string;
  event_config_id: string;
  purpose: string | null;
  amount_requested: string | number | null;
  bank_account_name: string | null;
  bank_name: string | null;
  bank_branch: string | null;
  account_number: string | null;
  notes: string | null;
  status: 'submitted' | 'approved' | 'rejected' | 'transferred' | 'closed';
  team_name: string | null;
  category: string | null;
  amount_approved: string | number | null;
  approved_by: string | null;
  approved_at: string | null;
  processed_by: string | null;
  processed_at: string | null;
  transfer_fee: string | number | null;
  user: {
    id: string;
    full_name: string;
    email: string;
  };
  user_id: string;
  created_at: string;
};

const CreateExpenseSchema = z.object({
  event_config_id: z.string().uuid('Event ID phải là UUID hợp lệ'),
  type: z.enum(['reimbursement', 'advance']).default('reimbursement'),
  description: z.string().min(1, 'Mô tả là bắt buộc'),
  amount: z.number().min(1, 'Số tiền phải lớn hơn 0'),
  bank_account_name: z.string().min(1, 'Tên chủ tài khoản là bắt buộc'),
  bank_name: z.string().min(1, 'Tên ngân hàng là bắt buộc'),
  bank_branch: z.string().optional(),
  bank_account_number: z.string().min(1, 'Số tài khoản là bắt buộc'),
  note: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'transferred', 'closed']).optional(),
  catchment: z.string().optional(),
  team_name: z.string().optional(),
  category: z.string().optional(),
  optional_invoice_url: z.string().url().optional(),
});

// Accept legacy/public status filters from UI (pending maps to submitted in DB)
const FilterSchema = z.object({
  status: z.enum(['pending', 'approved', 'transferred', 'closed', 'rejected', 'all']).optional(),
  event_config_id: z.string().uuid().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  page: z.coerce.number().min(1).default(1),
  search: z.string().optional(),
});

// CREATE expense (finance/admin)
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['super_admin', 'regional_admin', 'cashier_role', 'event_organizer']);
    const supabase = await createClient();

    const payload = await request.json();
    const parsed = CreateExpenseSchema.parse(payload);

    // Map UI payload to DB columns
    const insertData = {
      event_config_id: parsed.event_config_id,
      user_id: user.id,
      type: parsed.type ?? 'reimbursement',
      amount_requested: parsed.amount,
      purpose: parsed.description,
      bank_account_name: parsed.bank_account_name,
      bank_name: parsed.bank_name,
      bank_branch: parsed.bank_branch ?? null,
      account_number: parsed.bank_account_number,
      optional_invoice_url: parsed.optional_invoice_url ?? null,
      status: 'pending' as const,
      notes: parsed.note ?? null,
    };

    const { data, error } = await supabase
      .from('expense_requests')
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      console.error('Error creating expense:', error);
      return NextResponse.json(
        { error: 'Không thể tạo đề nghị chi' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error creating expense:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Không có quyền truy cập' },
      { status: 403 }
    );
  }
}

// LIST expenses (finance/admin)
export async function GET(request: NextRequest) {
  try {
    await requireRole(['super_admin', 'regional_admin', 'cashier_role']);
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const filters = FilterSchema.parse({
      status: searchParams.get('status') || undefined,
      event_config_id: searchParams.get('event_config_id') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      limit: searchParams.get('limit') || undefined,
      page: searchParams.get('page') || undefined,
      search: searchParams.get('search') || undefined,
    });

    const offset = (filters.page - 1) * filters.limit;
    const statusDb = (filters.status && filters.status !== 'all')
      ? (filters.status === 'pending' ? 'submitted' : filters.status)
      : undefined;

    let query = supabase
      .from('expense_requests')
      .select(`
        *,
        event_config:event_configs(id, name),
        user:users(id, full_name, email)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (statusDb) {
      query = query.eq('status', statusDb);
    }

    if (filters.event_config_id) {
      query = query.eq('event_config_id', filters.event_config_id);
    }

    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date);
    }

    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date);
    }

    if (filters.search && filters.search.trim().length > 0) {
      const term = filters.search.trim();
      query = query.or(
        `purpose.ilike.%${term}%,bank_account_name.ilike.%${term}%,account_number.ilike.%${term}%`
      );
    }

    // Apply pagination
    query = query.range(offset, offset + filters.limit - 1);

    const { data: expensesRaw, error } = await query;

    if (error) {
      console.error('Error fetching expenses:', error);
      return NextResponse.json(
        { error: 'Không thể tải danh sách chi phí' },
        { status: 500 }
      );
    }

    const expenses = (expensesRaw || []) as unknown as DBExpenseRow[];

    // Get total count for pagination (apply same filters)
    let countQuery = supabase
      .from('expense_requests')
      .select('*', { count: 'exact', head: true });

    if (statusDb) {
      countQuery = countQuery.eq('status', statusDb);
    }
    if (filters.event_config_id) {
      countQuery = countQuery.eq('event_config_id', filters.event_config_id);
    }
    if (filters.start_date) {
      countQuery = countQuery.gte('created_at', filters.start_date);
    }
    if (filters.end_date) {
      countQuery = countQuery.lte('created_at', filters.end_date);
    }
    if (filters.search && filters.search.trim().length > 0) {
      const term = filters.search.trim();
      countQuery = countQuery.or(
        `purpose.ilike.%${term}%,bank_account_name.ilike.%${term}%,account_number.ilike.%${term}%`
      );
    }

    const { count: totalCount } = await countQuery;

    // Get expense statistics
    const { data: statsRaw, error: statsError } = await supabase
      .from('expense_requests')
      .select('status, amount_requested, amount_approved');

    if (statsError) {
      console.error('Error fetching expense stats:', statsError);
    }

    const statsData = (statsRaw || []) as unknown as DBExpenseStatsRow[];

    // Calculate statistics (map submitted -> pending for UI)
    const stats = {
      total_requests: statsData.length,
      pending_requests: statsData.filter((e) => e.status === 'submitted').length,
      approved_requests: statsData.filter((e) => e.status === 'approved').length,
      transferred_requests: statsData.filter((e) => e.status === 'transferred').length,
      closed_requests: statsData.filter((e) => e.status === 'closed').length,
      total_amount: statsData.reduce((sum, e) => sum + Number(e.amount_requested || 0), 0),
      approved_amount: statsData.reduce((sum, e) => sum + Number(e.amount_approved || 0), 0),
    };

    // Map DB rows to frontend-friendly shape
    const mappedExpenses = expenses.map((e) => ({
      id: e.id,
      event_config_id: e.event_config_id,
      description: e.purpose || '',
      amount: Number(e.amount_requested || 0),
      bank_account_name: e.bank_account_name || '',
      bank_name: e.bank_name || '',
      bank_branch: e.bank_branch || '',
      account_number: e.account_number || '',
      bank_account_number: e.account_number || '',
      note: e.notes || null,
      status: e.status === 'submitted' ? 'pending' : e.status,
      team_name: e.team_name || null,
      category: e.category || null,
      approved_amount: e.amount_approved != null ? Number(e.amount_approved) : undefined,
      approved_by: e.approved_by || undefined,
      approved_at: e.approved_at || undefined,
      transferred_by: e.processed_by || undefined,
      transferred_at: e.processed_at || undefined,
      transfer_fee: e.transfer_fee != null ? Number(e.transfer_fee) : undefined,
      admin_notes: e.notes || undefined,
      created_by_user:{
        id: e.user.id,
        full_name: e.user.full_name,
        email: e.user.email,
      },
      created_by: e.user_id,
      created_at: e.created_at,
      updated_at: e.processed_at || e.approved_at || e.created_at,
    }));

    return NextResponse.json({
      expenses: mappedExpenses,
      stats,
      totalPages: Math.ceil((totalCount || 0) / filters.limit),
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Tham số không hợp lệ', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Không có quyền truy cập' },
      { status: 403 }
    );
  }
}