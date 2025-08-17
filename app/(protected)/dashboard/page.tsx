import { redirect } from "next/navigation";
import { getServerUser, getServerUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  FileText, 
  Calendar, 
  Settings, 
  AlertTriangle,
  DollarSign,
  Users2Icon,
  QrCode
} from "lucide-react";
import Link from "next/link";
import { RegistrationCard } from "@/components/dashboard/registration-card";

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

  // Get active event config
  const { data: eventConfig } = await supabase
    .from('event_configs')
    .select('*')
    .eq('is_active', true)
    .single();

  // Get user's registrations with full registrant details
  const { data: registrations } = await supabase
    .from('registrations')
    .select(`
      *,
      registrants(
      *,
      event_roles:event_role_id(
          id,
          name,
          description
        )
      ),
      receipts(count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Handle error messages from redirects
  const resolvedSearchParams = await searchParams;
  const errorMessage = resolvedSearchParams?.error === 'registration-locked' 
    ? 'Không thể chỉnh sửa đăng ký này vì vé đã được xuất hoặc đăng ký đã được xác nhận.'
    : null;

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6">
      
      {/* Error message display */}
      {errorMessage && (
        <div className="container mx-auto px-3 sm:px-4 pt-4">
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
      
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Quản lý đăng ký</h1>
                <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
                  Xin chào, {profile.full_name || user.email}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {profile.role in ['registration_manager', 'super_admin','event_organizer'] && (
                  <Badge variant={profile.role === 'super_admin' ? 'default' : 'secondary'} className="text-xs">
                    {profile.role === 'event_organizer' && 'Tổ chức sự kiện'}
                    {profile.role === 'registration_manager' && 'Quản lý đăng ký'}
                    {profile.role === 'cashier_role' && 'Kế toán'}
                    {profile.role === 'super_admin' && 'Quản trị tổng'}
                  </Badge>
                )}
                {profile.region && (
                  <Badge variant="outline" className="text-xs">
                    {profile.region.charAt(0).toUpperCase() + profile.region.slice(1)}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions - Mobile and Desktop optimized */}
          <div className="mb-6 sm:mb-8">
            {/* Mobile: 2 column grid - admin users get 4 buttons, regular users get 3 */}
            <div className="grid grid-cols-2 gap-3 md:hidden">
              <Link href="/register">
                <Button className="w-full flex flex-col items-center gap-1 text-xs h-auto py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white " size="sm">
                  <Users className="h-4 w-4" />
                  <span className="hidden xs:inline text-center leading-tight">
                    {registrations && registrations.length > 0 ? 'Thêm đăng ký' : 'Đăng ký'}
                  </span>
                  <span className="xs:hidden text-center leading-tight">
                    {registrations && registrations.length > 0 ? 'Thêm đăng ký' : 'Đăng ký'}
                  </span>
                </Button>
              </Link>
              
              <Link href="/agenda">
                <Button variant="outline" className="w-full flex flex-col items-center gap-1 text-xs h-auto py-3" size="sm">
                  <Calendar className="h-4 w-4" />
                  <span className="text-center leading-tight">Chương trình</span>
                </Button>
              </Link>

              {(profile.role === 'event_organizer' || profile.role === 'super_admin' || profile.role === 'registration_manager') && (
                <>
                  <Link href="/check-in">
                    <Button variant="outline" className="w-full flex flex-col items-center gap-1 text-xs h-auto py-3" size="sm">
                      <QrCode className="h-4 w-4" />
                      <span className="text-center leading-tight">Check-in</span>
                    </Button>
                  </Link>
                  <Link href="/admin">
                    <Button variant="outline" className="w-full flex flex-col items-center gap-1 text-xs h-auto py-3" size="sm">
                      <Settings className="h-4 w-4" />
                      <span className="text-center leading-tight">Quản trị</span>
                    </Button>
                  </Link>
                </>
              )}

              {(profile.role === 'cashier_role' || profile.role === 'event_organizer' || profile.role === 'super_admin' || profile.role === 'registration_manager') && (
                <Link href="/payment-request">
                  <Button variant="outline" className="w-full flex flex-col items-center gap-1 text-xs h-auto py-3" size="sm">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-center leading-tight">Yêu cầu thanh toán</span>
                  </Button>
                </Link>
              )}

              {(profile.role === 'cashier_role' || profile.role === 'super_admin') && (
                <Link href="/finance">
                  <Button variant="outline" className="w-full flex flex-col items-center gap-1 text-xs h-auto py-3" size="sm">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-center leading-tight">Quản trị tài chính</span>
                  </Button>
                </Link>
              )}

              {(profile.role === 'registration_manager') && (
                <Link href="/registration-manager">
                  <Button variant="outline" className="w-full flex flex-col items-center gap-1 text-xs h-auto py-3" size="sm">
                    <Users2Icon className="h-4 w-4" />
                    <span className="text-center leading-tight">Quản lý đăng ký</span>
                  </Button>
                </Link>
              )}

              <Link href="/profile">
                <Button variant="outline" className="w-full flex flex-col items-center gap-1 text-xs h-auto py-3" size="sm">
                  <FileText className="h-4 w-4" />
                  <span className="text-center leading-tight">Hồ sơ</span>
                </Button>
              </Link>
            </div>

            {/* Desktop: Grid layout with cards */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-4">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {registrations && registrations.length > 0 ? 'Thêm đăng ký' : 'Đăng ký mới'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link href="/register">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white" size="sm">
                      Đăng ký tham gia
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Chương trình
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link href="/agenda">
                    <Button variant="outline" className="w-full" size="sm">
                      Xem lịch trình
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {(profile.role === 'registration_manager' || profile.role === 'event_organizer' || profile.role === 'super_admin') && (
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      Check-in
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Link href="/check-in">
                      <Button variant="outline" className="w-full" size="sm">
                        Quét mã QR
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {(profile.role === 'registration_manager' || profile.role === 'event_organizer' || profile.role === 'super_admin') && (
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Quản trị
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Link href="/admin">
                      <Button variant="outline" className="w-full" size="sm">
                        Bảng điều khiển
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
              {(profile.role === 'cashier_role' || profile.role === 'super_admin' || profile.role === 'event_organizer' || profile.role === 'registration_manager') && (
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Yêu cầu thanh toán
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Link href="/payment-request">
                      <Button variant="outline" className="w-full" size="sm">
                        Tạo yêu cầu thanh toán
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
              
              {(profile.role === 'cashier_role' || profile.role === 'super_admin') && (
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Quản trị tài chính
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Link href="/finance">
                      <Button variant="outline" className="w-full" size="sm">
                        Quản lý tài chính
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {(profile.role === 'registration_manager') && (
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users2Icon className="h-4 w-4" />
                      Quản lý đăng ký
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Link href="/registration-manager">
                      <Button variant="outline" className="w-full" size="sm">
                        Xem đăng ký
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Hồ sơ
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link href="/profile">
                    <Button variant="outline" className="w-full" size="sm">
                      Cập nhật thông tin
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Registrations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Đăng ký của tôi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!registrations || registrations.length === 0 ? (
                <div className="text-center py-8 px-6">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Chưa có đăng ký nào</h3>
                  <p className="text-muted-foreground text-3xl mb-4">
                    Bạn chưa đăng ký tham gia Đại Hội.
                  </p>
                  <Link href="/register">
                    <Button>
                      <Users className="h-4 w-4 mr-2" />
                      Bấm vào đây để tạo đăng ký
                    </Button>
                  </Link>
                </div>
              ) : (
                <div>
                  {registrations.map((registration, index) => (
                    <RegistrationCard 
                      key={registration.id} 
                      registration={registration} 
                      eventConfig={eventConfig}
                      isLast={index === registrations.length - 1}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
