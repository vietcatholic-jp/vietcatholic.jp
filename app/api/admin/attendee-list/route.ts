import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get user profile to check permissions
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, region')
      .eq('id', user.id)
      .single();

    if (!profile || !['event_organizer', 'group_leader', 'regional_admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { format = 'csv' } = await request.json();

    // Get registrations with registrants
    let query = supabase
      .from('registrations')
      .select(`
        *,
        user_profiles:user_id(full_name, email),
        registrants(*)
      `)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false });

    // Filter by region for regional admins
    if (profile.role === 'regional_admin' && profile.region) {
      const { data: users } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('region', profile.region);
      
      if (users) {
        const userIds = users.map(u => u.id);
        query = query.in('user_id', userIds);
      }
    }

    const { data: registrations, error } = await query;

    if (error) {
      throw error;
    }

    if (format === 'csv') {
      // Generate CSV content
      const csvHeader = [
        'Mã đăng ký',
        'Họ tên',
        'Email',
        'Tên thánh',
        'Vai trò',
        'Giới tính',
        'Nhóm tuổi',
        'Size áo',
        'Tỉnh',
        'Giáo phận',
        'Ngày đăng ký',
        'Trạng thái'
      ].join(',');

      const csvRows: string[] = [];
      
      registrations?.forEach((registration) => {
        registration.registrants?.forEach((registrant: { full_name: string; saint_name?: string; event_role?: string; gender?: string; age_group?: string; shirt_size?: string; province?: string; diocese?: string; }) => {
          const row = [
            registration.invoice_code,
            `"${registrant.full_name}"`,
            registration.user_profiles?.email || '',
            `"${registrant.saint_name || ''}"`,
            registrant.event_role || '',
            registrant.gender === 'male' ? 'Nam' : registrant.gender === 'female' ? 'Nữ' : 'Khác',
            registrant.age_group || '',
            registrant.shirt_size || '',
            registrant.province || '',
            registrant.diocese || '',
            new Date(registration.created_at).toLocaleDateString('vi-VN'),
            registration.status
          ].join(',');
          csvRows.push(row);
        });
      });

      const csvContent = [csvHeader, ...csvRows].join('\\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="attendee-list-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({ 
      message: "Attendee list generated successfully",
      count: registrations?.length || 0 
    });

  } catch (error) {
    console.error('Error generating attendee list:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
