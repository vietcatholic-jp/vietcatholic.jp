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
});

const FilterSchema = z.object({
  status: z.enum(['pledged', 'received']).optional(),
  event_config_id: z.string().uuid().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

// CREATE donation (authenticated users or public via API)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const validatedData = CreateDonationSchema.parse(body);

    // Check if user is authenticated for created_by field
    let createdBy = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      createdBy = user?.id || null;
    } catch {
      // Allow public donations
    }

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

    // Create donation
    const { data: donation, error } = await supabase
      .from('donations')
      .insert({
        ...validatedData,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating donation:', error);
      return NextResponse.json(
        { error: 'Không thể tạo quyên góp' },
        { status: 500 }
      );
    }

    // Log donation creation
    console.log(`DONATION_CREATED: ${donation.id} by ${createdBy || 'anonymous'} for event ${validatedData.event_config_id}`);

    return NextResponse.json({
      success: true,
      data: donation,
      message: 'Quyên góp đã được ghi nhận thành công'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating donation:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Lỗi tạo quyên góp' },
      { status: 500 }
    );
  }
}

// GET donations (admin only)
export async function GET(request: NextRequest) {
  try {
    await requireRole(['super_admin', 'regional_admin']);
    const supabase = await createClient();
    
    const { searchParams } = new URL(request.url);
    const filters = FilterSchema.parse({
      status: searchParams.get('status'),
      event_config_id: searchParams.get('event_config_id'),
      start_date: searchParams.get('start_date'),
      end_date: searchParams.get('end_date'),
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
    if (filters.status) {
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

    return NextResponse.json({
      success: true,
      data: donations,
      pagination: {
        total: totalCount || 0,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: (filters.offset + filters.limit) < (totalCount || 0)
      }
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