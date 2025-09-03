import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const CreateIncomeSourceSchema = z.object({
  event_config_id: z.string().uuid('Event ID phải là UUID hợp lệ'),
  category: z.enum(['ticket_sales', 'merchandise', 'food_beverage', 'other']),
  title: z.string().min(1, 'Tên nguồn thu là bắt buộc'),
  description: z.string().optional(),
  amount: z.number().min(0, 'Số tiền phải lớn hơn hoặc bằng 0').default(0),
  expected_amount: z.number().min(0, 'Số tiền dự kiến phải lớn hơn hoặc bằng 0').optional(),
  status: z.enum(['pending', 'received', 'overdue']).default('pending'),
  contact_person: z.string().optional(),
  contact_info: z.string().optional(),
  due_date: z.string().optional().transform(val => val === '' ? undefined : val),
  notes: z.string().optional(),
});

const FilterSchema = z.object({
  category: z.enum(['ticket_sales', 'merchandise', 'food_beverage', 'other', 'all']).optional(),
  status: z.enum(['pending', 'received', 'overdue', 'all']).optional(),
  event_config_id: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// CREATE income source
export async function POST(request: NextRequest) {
  try {
    await requireRole(['super_admin', 'cashier_role', 'event_organizer']);
    const supabase = await createClient();

    // Get current user for created_by field
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Người dùng chưa được xác thực' },
        { status: 401 }
      );
    }
    
    const payload = await request.json();
    const parsed = CreateIncomeSourceSchema.parse(payload);

    const { data, error } = await supabase
      .from('income_sources')
      .insert({
        event_config_id: parsed.event_config_id,
        category: parsed.category,
        title: parsed.title,
        description: parsed.description ?? null,
        amount: parsed.amount,
        expected_amount: parsed.expected_amount ?? null,
        status: parsed.status,
        contact_person: parsed.contact_person ?? null,
        contact_info: parsed.contact_info ?? null,
        due_date: parsed.due_date ?? null,
        notes: parsed.notes ?? null,
        created_by: user.id,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating income source:', error);
      return NextResponse.json(
        { error: 'Không thể tạo bản ghi nguồn thu' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Đã tạo nguồn thu thành công'
    });
  } catch (error) {
    console.error('Error creating income source:', error);
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

// LIST income sources
export async function GET(request: NextRequest) {
  try {
    await requireRole(['super_admin', 'cashier_role', 'event_organizer']);
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const filters = FilterSchema.parse({
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      event_config_id: searchParams.get('event_config_id') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page') as string, 10) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit') as string, 10) : 20,
    });

    const offset = (filters.page - 1) * filters.limit;

    let query = supabase
      .from('income_sources')
      .select(`
        *,
        event_config:event_configs(id, name)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.event_config_id) {
      query = query.eq('event_config_id', filters.event_config_id);
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + filters.limit - 1);

    const { data: sources, error } = await query;

    if (error) {
      console.error('Error fetching income sources:', error);
      return NextResponse.json(
        { error: 'Không thể tải danh sách nguồn thu' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('income_sources')
      .select('*', { count: 'exact', head: true });

    // Get statistics
    const { data: statsData, error: statsError } = await supabase
      .from('income_sources')
      .select('status, amount, expected_amount');

    if (statsError) {
      console.error('Error fetching income source stats:', statsError);
    }

    // Calculate statistics
    const stats = {
      total_sources: statsData?.length || 0,
      pending_sources: statsData?.filter(s => s.status === 'pending').length || 0,
      received_sources: statsData?.filter(s => s.status === 'received').length || 0,
      overdue_sources: statsData?.filter(s => s.status === 'overdue').length || 0,
      total_amount: statsData?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0,
      received_amount: statsData?.filter(s => s.status === 'received').reduce((sum, s) => sum + (s.amount || 0), 0) || 0,
      pending_amount: statsData?.filter(s => s.status === 'pending').reduce((sum, s) => sum + (s.expected_amount || s.amount || 0), 0) || 0,
    };

    return NextResponse.json({
      sources,
      stats,
      totalPages: Math.ceil((totalCount || 0) / filters.limit),
    });
  } catch (error) {
    console.error('Error fetching income sources:', error);
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
