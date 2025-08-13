import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const CreateExpenseRequestSchema = z.object({
  event_config_id: z.string().uuid('Event ID phải là UUID hợp lệ'),
  type: z.enum(['reimbursement', 'advance'], {
    errorMap: () => ({ message: 'Loại yêu cầu phải là "hoàn tiền" hoặc "tạm ứng"' })
  }),
  amount_requested: z.number().min(1, 'Số tiền yêu cầu phải lớn hơn 0'),
  purpose: z.string().min(1, 'Mục đích chi tiêu là bắt buộc'),
  bank_account_name: z.string().optional(),
  bank_name: z.string().optional(),
  bank_branch: z.string().optional(),
  account_number: z.string().optional(),
  optional_invoice_url: z.string().url().optional(),
});

const FilterSchema = z.object({
  status: z.enum(['submitted', 'approved', 'rejected', 'transferred', 'closed']).optional(),
  type: z.enum(['reimbursement', 'advance']).optional(),
  event_config_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

// CREATE expense request (event_organizer and admins)
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['event_organizer', 'super_admin', 'regional_admin']);
    const supabase = await createClient();
    
    const body = await request.json();
    const validatedData = CreateExpenseRequestSchema.parse(body);

    // Verify event exists
    const { data: event, error: eventError } = await supabase
      .from('event_configs')
      .select('id, name')
      .eq('id', validatedData.event_config_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Sự kiện không tồn tại' },
        { status: 404 }
      );
    }

    // Create expense request
    const { data: expenseRequest, error } = await supabase
      .from('expense_requests')
      .insert({
        ...validatedData,
        user_id: user.id,
      })
      .select(`
        *,
        event_config:event_configs(id, name),
        user:users(id, full_name, email)
      `)
      .single();

    if (error) {
      console.error('Error creating expense request:', error);
      return NextResponse.json(
        { error: 'Không thể tạo yêu cầu chi tiêu' },
        { status: 500 }
      );
    }

    // Log expense request creation
    console.log(`EXPENSE_REQUEST_CREATED: ${expenseRequest.id} by ${user.id} for event ${validatedData.event_config_id}`);

    return NextResponse.json({
      success: true,
      data: expenseRequest,
      message: 'Yêu cầu chi tiêu đã được tạo thành công'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating expense request:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Lỗi tạo yêu cầu chi tiêu' },
      { status: 500 }
    );
  }
}

// GET expense requests (user sees own, admins see all)
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(['event_organizer', 'super_admin', 'regional_admin']);
    const supabase = await createClient();
    
    const { searchParams } = new URL(request.url);
    const filters = FilterSchema.parse({
      status: searchParams.get('status'),
      type: searchParams.get('type'),
      event_config_id: searchParams.get('event_config_id'),
      user_id: searchParams.get('user_id'),
      start_date: searchParams.get('start_date'),
      end_date: searchParams.get('end_date'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    });

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile && ['super_admin', 'regional_admin'].includes(profile.role);

    let query = supabase
      .from('expense_requests')
      .select(`
        *,
        event_config:event_configs(id, name),
        user:users(id, full_name, email),
        attachments:expense_attachments(*)
      `)
      .order('created_at', { ascending: false });

    // Non-admin users can only see their own requests
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.event_config_id) {
      query = query.eq('event_config_id', filters.event_config_id);
    }

    if (filters.user_id && isAdmin) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date);
    }

    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date);
    }

    // Apply pagination
    query = query.range(filters.offset, filters.offset + filters.limit - 1);

    const { data: expenseRequests, error } = await query;

    if (error) {
      console.error('Error fetching expense requests:', error);
      return NextResponse.json(
        { error: 'Không thể tải danh sách yêu cầu chi tiêu' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('expense_requests')
      .select('*', { count: 'exact', head: true });

    if (!isAdmin) {
      countQuery = countQuery.eq('user_id', user.id);
    }

    const { count: totalCount } = await countQuery;

    return NextResponse.json({
      success: true,
      data: expenseRequests,
      pagination: {
        total: totalCount || 0,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: (filters.offset + filters.limit) < (totalCount || 0)
      }
    });

  } catch (error) {
    console.error('Error fetching expense requests:', error);
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