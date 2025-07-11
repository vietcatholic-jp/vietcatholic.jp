import { Navbar } from "@/components/navbar";
import { EditRegistrationWrapper } from "@/components/registration/edit-registration-wrapper";
import { getServerUser, getServerUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Registration } from "@/lib/types";

interface EditRegistrationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditRegistrationPage({ params }: EditRegistrationPageProps) {
  const { id } = await params;
  const user = await getServerUser();
  const profile = await getServerUserProfile();
  
  if (!user) {
    redirect('/auth/login?redirectTo=/register/' + id);
  }

  const supabase = await createClient();

  // Fetch the registration
  const { data: registration, error } = await supabase
    .from('registrations')
    .select(`
      *,
      registrants(*)
    `)
    .eq('id', id)
    .single();

  if (error || !registration) {
    console.error('Registration fetch error:', error);
    notFound();
  }

  // Check if user can edit this registration
  const canEdit = registration.user_id === user.id || 
                  profile?.role === 'admin' || 
                  profile?.role === 'super_admin';

  if (!canEdit) {
    redirect('/dashboard');
  }

  // Check if registration can be modified (check for tickets separately)
  const registrantIds = registration.registrants?.map((r: { id: string }) => r.id) || [];
  let hasTickets = false;
  
  if (registrantIds.length > 0) {
    const { count: ticketCount } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .in('registrant_id', registrantIds);
    
    hasTickets = (ticketCount || 0) > 0;
  }

  const isConfirmed = registration.status === 'confirmed';

  if (hasTickets || isConfirmed) {
    redirect('/dashboard?error=registration-locked');
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">
              Chỉnh sửa đăng ký
            </h1>
            <p className="text-muted-foreground text-lg">
              Cập nhật thông tin đăng ký của bạn
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Edit Form */}
            <div className="lg:col-span-3">
              <EditRegistrationWrapper 
                registration={registration as Registration}
              />
            </div>

            {/* Registration Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Thông tin chỉnh sửa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Lưu ý quan trọng</h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Chỉ có thể chỉnh sửa đăng ký chưa được xác nhận</li>
                      <li>• Không thể sửa đổi khi vé đã được xuất</li>
                      <li>• Vui lòng kiểm tra kỹ thông tin trước khi lưu</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Trạng thái đăng ký</h4>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        registration.status === 'pending' ? 'bg-yellow-500' :
                        registration.status === 'confirmed' ? 'bg-green-500' :
                        'bg-gray-500'
                      }`}></div>
                      <span className="text-sm capitalize">
                        {registration.status === 'pending' ? 'Đang chờ xử lý' :
                         registration.status === 'confirmed' ? 'Đã xác nhận' :
                         registration.status}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hỗ trợ</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Nếu bạn gặp khó khăn trong việc chỉnh sửa đăng ký, vui lòng liên hệ:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Fanpage</span> https://www.facebook.com/GTCGVNtaiNhat/
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
