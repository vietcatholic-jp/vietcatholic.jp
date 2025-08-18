import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import QRCode from "qrcode";
import JSZip from "jszip";

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get user profile to check permissions
    const { data: profile } = await supabase
      .from('users')
      .select('role, region')
      .eq('id', user.id)
      .single();

    if (!profile || !['event_organizer', 'group_leader', 'regional_admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { type = 'checkin' } = await request.json();

    // Get confirmed registrations with registrants
    let query = supabase
      .from('registrations')
      .select(`
        *,
        registrants(*)
      `)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false });

    // Filter by region for regional admins
    if (profile.role === 'regional_admin' && profile.region) {
      const { data: users } = await supabase
        .from('users')
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

    const zip = new JSZip();
    
    // Generate QR codes for each registrant
    const qrPromises: Promise<void>[] = [];
    
    registrations?.forEach((registration) => {
      registration.registrants?.forEach((registrant: { id: string; full_name: string }) => {
        const qrData = JSON.stringify({
          registrationId: registration.id,
          registrantId: registrant.id,
          invoiceCode: registration.invoice_code,
          name: registrant.full_name,
          type: type
        });

        const promise = QRCode.toDataURL(qrData, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        }).then((dataUrl) => {
          const base64Data = dataUrl.split(',')[1];
          const fileName = `${registration.invoice_code}-${registrant.full_name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
          zip.file(fileName, base64Data, { base64: true });
        });

        qrPromises.push(promise);
      });
    });

    await Promise.all(qrPromises);

    // Generate zip file
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="qr-codes-${new Date().toISOString().split('T')[0]}.zip"`,
      },
    });

  } catch (error) {
    console.error('Error generating QR codes:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
