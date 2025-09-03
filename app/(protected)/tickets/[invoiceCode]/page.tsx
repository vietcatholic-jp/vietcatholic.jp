import { notFound, redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TicketGenerator } from "@/components/tickets/ticket-generator";
import { AvatarPortraitUpload } from "@/components/tickets/avatar-portrait-upload";
import { Registrant } from "@/lib/types";
import {
  User,
  Calendar,
  MapPin
} from "lucide-react";

interface TicketsPageProps {
  params: Promise<{
    invoiceCode: string;
  }>;
}

export default async function TicketsPage({ params }: TicketsPageProps) {
  const { invoiceCode } = await params;
  const user = await getServerUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  const supabase = await createClient();

  // Get registration details
  const { data: registration, error } = await supabase
    .from('registrations')
    .select(`
      *,
      registrants(*),
      receipts(*)
    `)
    .eq('invoice_code', invoiceCode)
    .eq('user_id', user.id)
    .single();

  if (error || !registration) {
    notFound();
  }

  // Only allow access if payment is confirmed
  if (!['confirmed', 'temp_confirmed'].includes(registration.status)) {
    redirect(`/payment/${invoiceCode}`);
  }

  // Get existing tickets
  const { data: tickets } = await supabase
    .from('tickets')
    .select('*, registrant:registrants(*)')
    .in('registrant_id', registration.registrants?.map((r: Registrant) => r.id) || []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-4">
              Vé tham gia ĐẠI HỘI TOÀN QUỐC NĂM THÁNH 2025
            </h1>
            <p className="text-muted-foreground">
              Mã đăng ký: <span className="font-mono font-medium">{registration.invoice_code}</span>
            </p>
            <Badge className="mt-2 bg-green-500 text-white">
              {registration.status === 'confirmed' ? 'Đã thanh toán' : 'Tạm xác nhận (thanh toán sau)'}
            </Badge>
          </div>

          {/* Event Info */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Thông tin sự kiện
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Đại hội Công giáo Việt Nam 2025</p>
                    <p className="text-sm text-muted-foreground">14-15/09/2025</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Địa điểm</p>
                    <p className="text-sm text-green-600 font-medium">
                      📍 Kamiozuki, Hanado, Kanagawa (〒257-0005)
                    </p>
                    <p className="text-sm text-green-600 font-medium">
                      <a href="https://maps.app.goo.gl/YbZy9rFzni7ztTMv6" className="text-blue-600 hover:underline">Google map</a>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{registration.participant_count} người tham gia</p>
                    <p className="text-sm text-muted-foreground">Đã đăng ký thành công</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participants and Tickets */}
          <div className="space-y-6">
            {registration.registrants?.map((registrant: Registrant) => {
              const existingTicket = tickets?.find(t => t.registrant_id === registrant.id);
              
              return (
                <Card key={registrant.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        <div className="flex flex-col">
                          <span className="text-muted-foreground text-sm">{registrant.saint_name}</span> {registrant.full_name}
                        </div>
                      </div>
                      {registrant.portrait_url ? (
                        <Badge className="bg-green-500">Đã có vé</Badge>
                      ) : (
                        <Badge variant="secondary">Chưa có vé</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Participant Info */}
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Email:</span>
                            <p className="font-medium">{registrant.email}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Giới tính:</span>
                            <p className="font-medium">
                              {registrant.gender === 'male' ? 'Nam' : 
                               registrant.gender === 'female' ? 'Nữ' : 'Khác'}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Độ tuổi:</span>
                            <p className="font-medium">{registrant.age_group}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Size áo:</span>
                            <p className="font-medium">{registrant.shirt_size}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Giáo phận:</span>
                            <p className="font-medium">{registrant.diocese}</p>
                          </div>
                        </div>

                        {/* Portrait Upload */}
                        {!registrant.portrait_url && (
                          <AvatarPortraitUpload
                            registrantId={registrant.id}
                            registrantName={registrant.full_name}
                            currentAvatarUrl={registrant.portrait_url}
                          />
                        )}
                      </div>

                      {/* Ticket Generation */}
                      <div>
                        <TicketGenerator
                            registrant={registrant}
                            existingTicket={existingTicket}
                          />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
