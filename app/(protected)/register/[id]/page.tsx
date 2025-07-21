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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-amber-600/5" />
        <div className="absolute top-10 left-10 text-4xl text-blue-200/30">✨</div>
        <div className="absolute top-32 right-16 text-3xl text-amber-200/40">⭐</div>
        <div className="absolute bottom-20 left-1/4 text-3xl text-purple-200/30">🕊️</div>
        
        <div className="container mx-auto text-center relative z-10">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
              ✏️ Chỉnh sửa đăng ký ✏️
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-700 via-purple-600 to-amber-600 bg-clip-text text-transparent">
            🔧 Cập nhật thông tin
          </h1>
          <p className="text-xl text-gray-700 mb-2 font-light">
            Chỉnh sửa đăng ký của bạn cho Đại Hội 2025
          </p>
          <div className="text-lg text-blue-600 mb-6 font-medium">
            🙏 &ldquo;Những Người Hành Hương Hy Vọng&rdquo; 🙏
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Edit Form */}
            <div className="lg:col-span-3">
              <EditRegistrationWrapper 
                registration={registration as Registration}
              />
            </div>

            {/* Registration Info */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-lg text-amber-800 flex items-center gap-2">
                    <div className="bg-amber-600 p-2 rounded-lg">
                      <span className="text-white text-sm">⚠️</span>
                    </div>
                    📝 Thông tin chỉnh sửa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <h4 className="font-medium mb-2 text-red-800 flex items-center gap-2">
                      ⚠️ Lưu ý quan trọng
                    </h4>
                    <ul className="text-sm text-red-700 space-y-2">
                      <li>🔒 Chỉ có thể chỉnh sửa đăng ký chưa được xác nhận</li>
                      <li>🎫 Không thể sửa đổi khi vé đã được xuất</li>
                      <li>✅ Vui lòng kiểm tra kỹ thông tin trước khi lưu</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="font-medium mb-2 text-blue-800 flex items-center gap-2">
                      📊 Trạng thái đăng ký
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        registration.status === 'pending' ? 'bg-yellow-500' :
                        registration.status === 'confirmed' ? 'bg-green-500' :
                        'bg-gray-500'
                      }`}></div>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                        registration.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        registration.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {registration.status === 'pending' ? '⏳ Đang chờ xử lý' :
                         registration.status === 'confirmed' ? '✅ Đã xác nhận' :
                         registration.status}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-lg text-purple-800 flex items-center gap-2">
                    <div className="bg-purple-600 p-2 rounded-lg">
                      <span className="text-white text-sm">🤝</span>
                    </div>
                    💬 Hỗ trợ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-purple-700 mb-3">
                    Nếu bạn gặp khó khăn trong việc chỉnh sửa đăng ký, vui lòng liên hệ:
                  </p>
                  <div className="bg-white/50 rounded-lg p-3 border border-purple-200">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-purple-800">📘 Fanpage:</span>
                      <a href="https://www.facebook.com/GTCGVNtaiNhat/" 
                         className="text-blue-600 hover:text-blue-800 hover:underline"
                         target="_blank" 
                         rel="noopener noreferrer">
                        GTCGVNtaiNhat
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
