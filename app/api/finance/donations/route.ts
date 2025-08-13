import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const CreateDonationSchema = z.object({
  event_config_id: z.string().uuid('Event ID phải là UUID hợp lệ'),
  donor_name: z.string().min(1, 'Tên người quyên góp là bắt buộc'),
  contact: z.string().optional(),
  amount: z.number().min(1, 'Số tiền phải lớn hơn 0'),
  public_identity: z.boolean().default(false),
  note: z.string().optional(),
  status: z.enum(['pledged', 'received']).optional(),
});

const FilterSchema = z.object({
  status: z.enum(['pledged', 'received', 'all']).optional(),
  event_config_id: z.string().uuid().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

// CREATE donation (finance/admin)
export async function POST(request: NextRequest) {
  try {
    await requireRole(['super_admin', 'regional_admin', 'cashier_role']);
    const supabase = await createClient();

    // Check if user is authenticated for created_by field
    let createdBy = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      createdBy = user?.id || null;
    } catch {
      // Allow public donations
    }
    
    const payload = await request.json();
    const parsed = CreateDonationSchema.parse(payload);

    const { data, error } = await supabase
      .from('donations')
      .insert({
        event_config_id: parsed.event_config_id,
        donor_name: parsed.donor_name,
        contact: parsed.contact ?? null,
        amount: parsed.amount,
        public_identity: parsed.public_identity,
        note: parsed.note ?? null,
        status: parsed.status ?? 'pledged',
        created_by: createdBy,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating donation:', error);
      return NextResponse.json(
        { error: 'Không thể tạo bản ghi quyên góp' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error creating donation:', error);
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

// LIST donations (finance/admin)
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
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    });

    let query = supabase
      .from('donations')
      .select(`
        *,
        event_config:event_configs(id, name)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
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

    // Apply pagination
    query = query.range(filters.offset, filters.offset + filters.limit - 1);

    const { data: donations, error } = await query;

    if (error) {
      console.error('Error fetching donations:', error);
      return NextResponse.json(
        { error: 'Không thể tải danh sách quyên góp' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('donations')
      .select('*', { count: 'exact', head: true });

    // Get donation statistics
    const { data: statsData, error: statsError } = await supabase
      .from('donations')
      .select('status, amount');

    if (statsError) {
      console.error('Error fetching donation stats:', statsError);
    }

    // Calculate statistics
    const stats = {
      total_donations: statsData?.length || 0,
      pledged_donations: statsData?.filter(d => d.status === 'pledged').length || 0,
      received_donations: statsData?.filter(d => d.status === 'received').length || 0,
      total_amount: statsData?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0,
      received_amount: statsData?.filter(d => d.status === 'received').reduce((sum, d) => sum + (d.amount || 0), 0) || 0,
    };

    return NextResponse.json({
      donations,
      stats,
      totalPages: Math.ceil((totalCount || 0) / filters.limit),
    });
  } catch (error) {
    console.error('Error fetching donations:', error);
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