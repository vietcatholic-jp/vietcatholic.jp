import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const PublicDonorFilterSchema = z.object({
  event_config_id: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

// GET public donor roll (no authentication required)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { searchParams } = new URL(request.url);
    const filters = PublicDonorFilterSchema.parse({
      event_config_id: searchParams.get('event_config_id') || undefined,
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    });

    let query = supabase
      .from('donations')
      .select(`
        id,
        donor_name,
        amount,
        note,
        received_at,
        created_at,
        event_config:event_configs(id, name)
      `)
      .eq('status', 'received')
      .eq('public_identity', true)
      .order('received_at', { ascending: false });

    // Filter by event if specified
    if (filters.event_config_id) {
      query = query.eq('event_config_id', filters.event_config_id);
    }

    // Apply pagination
    query = query.range(filters.offset, filters.offset + filters.limit - 1);

    const { data: donations, error } = await query;

    if (error) {
      console.error('Error fetching public donations:', error);
      return NextResponse.json(
        { error: 'Không thể tải danh sách nhà hảo tâm' },
        { status: 500 }
      );
    }

    const totalCount = donations.length;
    const totalAmount = donations.reduce((sum, donation) => sum + (donation.amount || 0), 0);
    
    return NextResponse.json({
      success: true,
      data: donations,
      stats: {
        totalDonors: totalCount || 0,
        totalAmount: totalAmount,
      },
      pagination: {
        total: totalCount || 0,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: (filters.offset + filters.limit) < (totalCount || 0)
      }
    });

  } catch (error) {
    console.error('Error fetching public donations:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Tham số không hợp lệ', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Lỗi tải danh sách nhà hảo tâm' },
      { status: 500 }
    );
  }
}