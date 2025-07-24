import { RegistrationForm } from "@/components/registration/registration-form";
import { getServerUser, getServerUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function RegisterPage() {
  const user = await getServerUser();
  const profile = await getServerUserProfile();

  if (!user || !profile) {
    redirect('/auth/login?redirectTo=/register');
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
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
              ✨ Năm Thánh 2025 - Pilgrims of Hope ✨
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-700 via-purple-600 to-amber-600 bg-clip-text text-transparent">
            Đăng ký tham gia Đại Hội
          </h1>
          <p className="text-xl text-gray-700 mb-2 font-light">
            Việt Nam tại Nhật Bản 14-15/09/2025
          </p>
          <div className="flex justify-center mb-4">
                        <Image
                          src="/logo-dh-2025.jpg"
                          alt="Logo"
                          width={192}
                          height={192}
                          className="object-contain rounded-full"
                        />
                      </div>
          <div className="text-lg text-blue-600 mb-6 font-medium">
            🙏 &ldquo;Những Người Hành Hương Hy Vọng&rdquo; 🙏
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Registration Form */}
            <div className="lg:col-span-3">
              <RegistrationForm 
                userEmail={user.email || undefined}
                userName={profile?.full_name || user.user_metadata?.name || undefined}
                userFacebookUrl={profile?.facebook_url || undefined}
              />
            </div>
          </div>
          {/* Registration Info */}
            <div className="space-y-6 mt-6 max-w-screen-md rounded-sm shadow-lg">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                    <div className="bg-blue-600 p-2 rounded-lg">
                      <span className="text-white text-sm">ℹ️</span>
                    </div>
                    💡 Thông tin đăng ký
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Vai trò tham gia</h4>
                    <p className="text-sm text-muted-foreground">
                      Chọn vai trò phù hợp
                    </p>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <h4 className="font-medium mb-2 text-amber-800 flex items-center gap-2">
                      💰 Phí tham gia
                    </h4>
                    <p className="text-sm text-amber-700">
                      ¥6000 cho mỗi người tham gia (áp dụng cho tất cả vai trò)
                    </p>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <h4 className="font-medium mb-2 text-green-800 flex items-center gap-2">
                      🎁 Bao gồm
                    </h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>✅ Chi phí tổ chức</li>
                      <li>✅ Ăn uống trong các ngày diễn ra sự kiện</li>
                      <li>✅ Áo kỷ niệm</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Đăng ký nhiều người</h4>
                    <p className="text-sm text-muted-foreground">
                      Từ người thứ 2 trở đi chỉ cần điền thông tin cơ bản: tên, tên thánh, giới tính, độ tuổi, và size áo
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Lưu ý</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Chi phí di chuyển tự túc</li>
                      <li>• Cần upload hóa đơn đóng phí tham dự sau khi chuyển khoản</li>
                    </ul>
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
                  <p className="text-sm text-purple-700 mb-4">
                    Nếu bạn gặp khó khăn trong quá trình đăng ký, vui lòng liên hệ:
                  </p>
                  <div className="bg-white/50 rounded-lg p-3 border border-purple-200">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-purple-800">📘 Facebook:</span>
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
  );
}
