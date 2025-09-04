import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServerUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify user authentication and role
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Unauthorized - Vui lòng đăng nhập' 
        }, 
        { status: 401 }
      );
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['registration_manager', 'event_organizer', 'super_admin'].includes(profile.role)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Forbidden - Không có quyền truy cập chức năng này' 
        }, 
        { status: 403 }
      );
    }

    const { registrantId } = await request.json();

    if (!registrantId) {
      return NextResponse.json({
        success: false,
        message: 'Thiếu thông tin registrant ID'
      }, { status: 400 });
    }

    // Debug logging
    console.log('Check-in attempt for registrant ID:', registrantId);

    // Get registrant information
    const { data: registrant, error: registrantError } = await supabase
      .from('registrants')
      .select(`
        id,
        full_name,
        saint_name,
        email,
        diocese,
        is_checked_in,
        checked_in_at,
        registration_id
      `)
      .eq('id', registrantId)
      .single();

    if (registrantError || !registrant) {
      console.error('Registrant lookup error:', registrantError);
      console.error('Searched for registrant ID:', registrantId);
      console.error('Query result:', { registrant, registrantError });
      
      return NextResponse.json({
        success: false,
        message: 'Không tìm thấy thông tin người tham gia với mã QR này',
        debug: {
          registrantId,
          error: registrantError?.message,
          hint: 'Kiểm tra ID trong QR code có đúng không'
        }
      }, { status: 404 });
    }

    // Get registration status separately
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('status')
      .eq('id', registrant.registration_id)
      .single();

    if (regError || !registration) {
      return NextResponse.json({
        success: false,
        message: 'Không tìm thấy thông tin đăng ký'
      }, { status: 404 });
    }

    // Check if registration is confirmed or already has some people checked in
    if (!['confirmed', 'temp_confirmed', 'checked_in'].includes(registration.status)) {
      return NextResponse.json({
        success: false,
        registrant: {
          id: registrant.id,
          full_name: registrant.full_name,
          saint_name: registrant.saint_name,
          email: registrant.email,
          diocese: registrant.diocese,
          is_checked_in: registrant.is_checked_in,
          checked_in_at: registrant.checked_in_at,
        },
        message: 'Đăng ký chưa được xác nhận thanh toán. Không thể check-in.'
      }, { status: 400 });
    }

    // Check if already checked in
    if (registrant.is_checked_in) {
      return NextResponse.json({
        success: false,
        registrant: {
          id: registrant.id,
          full_name: registrant.full_name,
          saint_name: registrant.saint_name,
          email: registrant.email,
          diocese: registrant.diocese,
          is_checked_in: registrant.is_checked_in,
          checked_in_at: registrant.checked_in_at,
        },
        message: `${registrant.full_name} đã check-in trước đó lúc ${new Date(registrant.checked_in_at || '').toLocaleString('vi-VN')}`
      });
    }

    // Update check-in status with race condition protection
    const currentTime = new Date().toISOString();
    const { data: updateResult, error: updateError } = await supabase
      .from('registrants')
      .update({
        is_checked_in: true,
        checked_in_at: currentTime,
        updated_at: currentTime
      })
      .eq('id', registrantId)
      .eq('is_checked_in', false) // Only update if not already checked in
      .select();

    if (updateError) {
      console.error('Check-in update error:', updateError);
      return NextResponse.json({
        success: false,
        message: 'Có lỗi xảy ra khi cập nhật trạng thái check-in'
      }, { status: 500 });
    }

    // Check if update actually happened (race condition protection)
    if (!updateResult || updateResult.length === 0) {
      // Someone else already checked in this person
      const { data: updatedRegistrant } = await supabase
        .from('registrants')
        .select('full_name, checked_in_at')
        .eq('id', registrantId)
        .single();

      return NextResponse.json({
        success: false,
        registrant: {
          id: registrantId,
          full_name: updatedRegistrant?.full_name || registrant.full_name,
          saint_name: registrant.saint_name,
          email: registrant.email,
          diocese: registrant.diocese,
          is_checked_in: true,
          checked_in_at: updatedRegistrant?.checked_in_at,
        },
        message: `${updatedRegistrant?.full_name || registrant.full_name} đã được check-in bởi người khác`
      });
    }

    // Update the registration status to 'checked_in' if it's not already checked_in
    if (registration.status !== 'checked_in') {
      try {
        await supabase
          .from('registrations')
          .update({
            status: 'checked_in',
            updated_at: currentTime
          })
          .eq('id', registrant.registration_id);
      } catch (regUpdateError) {
        // Don't fail the whole operation if registration update fails
        console.log('Registration status update failed (non-critical):', regUpdateError);
      }
    }

    // Optional: Log the check-in event (if event_logs table exists)
    try {
      await supabase
        .from('event_logs')
        .insert({
          event_type: 'check_in',
          user_id: user.id,
          target_id: registrantId,
          target_type: 'registrant',
          details: {
            registrant_name: registrant.full_name,
            registrant_email: registrant.email,
            checked_in_by: user.email,
            timestamp: currentTime
          }
        });
    } catch (logError) {
      // Ignore logging errors - check-in still succeeds
      console.log('Event logging failed (optional):', logError);
    }

    // Return success response
    return NextResponse.json({
      success: true,
      registrant: {
        id: registrant.id,
        full_name: registrant.full_name,
        saint_name: registrant.saint_name,
        email: registrant.email,
        diocese: registrant.diocese,
        is_checked_in: true,
        checked_in_at: currentTime,
      },
      message: `Check-in thành công cho ${registrant.full_name}!`
    });

  } catch (error) {
    console.error('Check-in API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Lỗi hệ thống khi xử lý check-in'
    }, { status: 500 });
  }
}

// GET endpoint to retrieve check-in statistics
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Verify user authentication and role
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['registration_manager', 'event_organizer', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get check-in statistics - include both confirmed and checked_in statuses
    const { data: stats, error } = await supabase
      .from('registrants')
      .select('is_checked_in, checked_in_at, registration:registrations!inner(status)')
      .in('registrations.status', ['confirmed', 'temp_confirmed', 'checked_in']);

    if (error) {
      console.error('Stats query error:', error);
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }

    const totalConfirmed = stats?.length || 0;
    const totalCheckedIn = stats?.filter(r => r.is_checked_in).length || 0;
    const checkInRate = totalConfirmed > 0 ? (totalCheckedIn / totalConfirmed * 100).toFixed(1) : '0';

    // Get check-ins by hour for today
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    const todayCheckins = stats?.filter(r => 
      r.is_checked_in && 
      r.checked_in_at && 
      r.checked_in_at >= startOfDay && 
      r.checked_in_at <= endOfDay
    ) || [];

    return NextResponse.json({
      totalConfirmed,
      totalCheckedIn,
      checkInRate,
      todayCheckins: todayCheckins.length,
      recentCheckins: todayCheckins
        .sort((a, b) => new Date(b.checked_in_at!).getTime() - new Date(a.checked_in_at!).getTime())
        .slice(0, 10)
    });

  } catch (error) {
    console.error('Check-in stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
