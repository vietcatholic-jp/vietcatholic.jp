import { redirect } from "next/navigation";
import { getServerUser, getServerUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { 
  Users, 
  FileText, 
  Calendar, 
  Settings, 
  AlertTriangle
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
                <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
                  Xin chào, {profile.full_name || user.email}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={profile.role === 'super_admin' ? 'default' : 'secondary'} className="text-xs">
                  {profile.role === 'participant' && 'Người tham gia'}
                  {profile.role === 'event_organizer' && 'Tổ chức sự kiện'}
                  {profile.role === 'regional_admin' && 'Quản trị khu vực'}
                  {profile.role === 'super_admin' && 'Quản trị tổng'}
                </Badge>
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
                <Button className="w-full flex flex-col items-center gap-1 text-xs h-auto py-3" size="sm">
                  <Users className="h-4 w-4" />
                  <span className="hidden xs:inline text-center leading-tight">
                    {registrations && registrations.length > 0 ? 'Thêm đăng ký' : 'Đăng ký mới'}
                  </span>
                  <span className="xs:hidden text-center leading-tight">
                    {registrations && registrations.length > 0 ? 'Thêm' : 'Đăng ký'}
                  </span>
                </Button>
              </Link>
              
              <Link href="/agenda">
                <Button variant="outline" className="w-full flex flex-col items-center gap-1 text-xs h-auto py-3" size="sm">
                  <Calendar className="h-4 w-4" />
                  <span className="text-center leading-tight">Chương trình</span>
                </Button>
              </Link>

              {(profile.role === 'regional_admin' || profile.role === 'super_admin') && (
                <Link href="/admin">
                  <Button variant="outline" className="w-full flex flex-col items-center gap-1 text-xs h-auto py-3" size="sm">
                    <Settings className="h-4 w-4" />
                    <span className="text-center leading-tight">Quản trị</span>
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
            <div className="hidden md:grid md:grid-cols-4 md:gap-4">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {registrations && registrations.length > 0 ? 'Thêm đăng ký' : 'Đăng ký mới'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link href="/register">
                    <Button className="w-full" size="sm">
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

              {(profile.role === 'regional_admin' || profile.role === 'super_admin') && (
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
                <div className="space-y-2">
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
    </main>
  );
}
