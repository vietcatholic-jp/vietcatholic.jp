import { redirect } from "next/navigation";
import { getServerUser, getServerUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { RegistrationActions } from "@/components/dashboard/registration-actions";
import { 
  Users, 
  FileText, 
  Calendar, 
  Settings, 
  CreditCard,
  QrCode,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { EVENT_PARTICIPATION_ROLES, Registrant } from "@/lib/types";

export default async function DashboardPage({ 
  searchParams 
}: { 
  searchParams?: Promise<{ error?: string }> 
}) {
  const user = await getServerUser();
  const profile = await getServerUserProfile();
  if (!user || !profile) {
    redirect('/auth/login');
  }

  const supabase = await createClient();

  // Get user's registrations with full registrant details
  const { data: registrations } = await supabase
    .from('registrations')
    .select(`
      *,
      registrants(*),
      receipts(count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (registrations) {
    console.log('Registrations:', registrations[0]?.receipts);
  }

  // Handle error messages from redirects
  const resolvedSearchParams = await searchParams;
  const errorMessage = resolvedSearchParams?.error === 'registration-locked' 
    ? 'Không thể chỉnh sửa đăng ký này vì vé đã được xuất hoặc đăng ký đã được xác nhận.'
    : null;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      {/* Error message display */}
      {errorMessage && (
        <div className="container mx-auto px-4 pt-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                  Xin chào, {profile.full_name || user.email}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={profile.role === 'super_admin' ? 'default' : 'secondary'}>
                  {profile.role === 'participant' && 'Người tham gia'}
                  {profile.role === 'event_organizer' && 'Tổ chức sự kiện'}
                  {profile.role === 'regional_admin' && 'Quản trị khu vực'}
                  {profile.role === 'super_admin' && 'Quản trị tổng'}
                </Badge>
                {profile.region && (
                  <Badge variant="outline">
                    {profile.region.charAt(0).toUpperCase() + profile.region.slice(1)}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Đăng ký mới
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href="/register">
                  <Button className="w-full" size="sm">
                    Đăng ký tham gia
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Chương trình
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href="/agenda">
                  <Button variant="outline" className="w-full" size="sm">
                    Xem lịch trình
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {(profile.role === 'regional_admin' || profile.role === 'super_admin') && (
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Quản trị
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Link href="/admin">
                    <Button variant="outline" className="w-full" size="sm">
                      Bảng điều khiển
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Hồ sơ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href="/profile">
                  <Button variant="outline" className="w-full" size="sm">
                    Cập nhật thông tin
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Registrations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Đăng ký của tôi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!registrations || registrations.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Chưa có đăng ký nào</h3>
                  <p className="text-muted-foreground mb-4">
                    Bạn chưa đăng ký tham gia sự kiện nào
                  </p>
                  <Link href="/register">
                    <Button>
                      <Users className="h-4 w-4 mr-2" />
                      Đăng ký ngay
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {registrations.map((registration) => (
                    <div
                      key={registration.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">#{registration.invoice_code}</span>
                          <Badge
                            variant={
                              registration.status === 'paid' ? 'default' :
                              registration.status === 'pending' ? 'secondary' :
                              registration.status === 'confirmed' ? 'default' : 'destructive'
                            }
                          >
                            {registration.status === 'pending' && 'Chờ thanh toán'}
                            {registration.status === 'paid' && 'Đã thanh toán'}
                            {registration.status === 'confirmed' && 'Đã xác nhận'}
                            {registration.status === 'cancelled' && 'Đã hủy'}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(registration.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Số người:</span>
                          <span className="ml-1 font-medium">{registration.participant_count}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tổng tiền:</span>
                          <span className="ml-1 font-medium">¥{registration.total_amount.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Hóa đơn:</span>
                          <span className="ml-1 font-medium">{registration.receipts.count > 0 ? 'Đã nộp' : 'Chưa nộp'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Vé:</span>
                          <span className="ml-1 font-medium">
                            {registration.status === 'confirmed' ? 'Có sẵn' : 'Chưa có'}
                          </span>
                        </div>
                      </div>

                      {/* Display registrants with roles */}
                      {registration.registrants && registration.registrants.length > 0 && (
                        <div className="mt-3">
                          <div className="text-sm text-muted-foreground mb-2">Danh sách tham gia:</div>
                          <div className="space-y-2">
                            {(registration.registrants as Registrant[]).map((registrant) => {
                              const roleInfo = EVENT_PARTICIPATION_ROLES.find(r => r.value === registrant.event_role);
                              return (
                                <div key={registrant.id} className="flex items-center justify-between bg-muted/30 rounded p-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{registrant.full_name}</span>
                                    {registrant.saint_name && (
                                      <span className="text-xs text-muted-foreground">({registrant.saint_name})</span>
                                    )}
                                    {registrant.is_primary && (
                                      <Badge variant="outline" className="text-xs">Chính</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {roleInfo && (
                                      <Badge 
                                        variant={
                                          registrant.event_role?.startsWith('volunteer_') ? 'secondary' :
                                          registrant.event_role?.startsWith('organizer_') ? 'default' :
                                          registrant.event_role === 'speaker' || registrant.event_role === 'performer' ? 'destructive' :
                                          'outline'
                                        }
                                        className="text-xs"
                                      >
                                        {roleInfo.label}
                                      </Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      {registrant.shirt_size}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-3 flex justify-between items-center">
                        <div>
                          <span className="text-muted-foreground text-sm">Biên lai:</span>
                          <span className="ml-1 text-sm font-medium">
                            {Array.isArray(registration.receipts) && registration.receipts.count > 0 ? 'Đã tải lên' : 'Chưa có'}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {/* Edit/Delete buttons for modifiable registrations */}
                          <RegistrationActions 
                            registrationId={registration.id}
                            invoiceCode={registration.invoice_code}
                            status={registration.status}
                            registrantIds={(registration.registrants as Registrant[])?.map((r: Registrant) => r.id) || []}
                          />
                          {registration.status === 'pending' && (
                            <Link href={`/payment/${registration.invoice_code}`}>
                              <Button size="sm" variant="outline">
                                <CreditCard className="h-3 w-3 mr-1" />
                                Thanh toán
                              </Button>
                            </Link>
                          )}
                          {registration.status === 'paid' && (
                            <Link href={`/tickets/${registration.invoice_code}`}>
                              <Button size="sm" variant="outline">
                                <QrCode className="h-3 w-3 mr-1" />
                                Vé
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>

                      {registration.notes && (
                        <div className="mt-3 p-2 bg-muted rounded text-sm">
                          <span className="text-muted-foreground">Ghi chú:</span>
                          <span className="ml-1">{registration.notes}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
