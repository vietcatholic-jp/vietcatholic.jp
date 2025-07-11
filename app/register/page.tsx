import { Navbar } from "@/components/navbar";
import { RegistrationForm } from "@/components/registration/registration-form";
import { getServerUser, getServerUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function RegisterPage() {
  const user = await getServerUser();
  const profile = await getServerUserProfile();
  
  if (!user) {
    redirect('/auth/login?redirectTo=/register');
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">
              Đăng ký tham gia Đại Hội Toàn Quốc 2025
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Registration Form */}
            <div className="lg:col-span-3">
              <RegistrationForm 
                userEmail={user.email || undefined}
                userName={profile?.full_name || user.user_metadata?.name || undefined}
                userFacebookUrl={profile?.facebook_url || undefined}
              />
            </div>

            {/* Registration Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Thông tin đăng ký</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Vai trò tham gia</h4>
                    <p className="text-sm text-muted-foreground">
                      Chọn vai trò phù hợp để chúng tôi chuẩn bị tốt nhất cho bạn
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Phí tham gia</h4>
                    <p className="text-sm text-muted-foreground">
                      ¥6000 cho mỗi người tham gia (áp dụng cho tất cả vai trò)
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Bao gồm</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Tham gia các buổi hội thảo</li>
                      <li>• Ăn uống trong các ngày diễn ra sự kiện</li>
                      <li>• Áo kỷ niệm</li>
                      <li>• Vé điện tử với QR code</li>
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
                      <li>• Cần upload hóa đơn thanh toán sau khi chuyển khoản</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hỗ trợ</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Nếu bạn gặp khó khăn trong quá trình đăng ký, vui lòng liên hệ:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Facebook:</span>
                      <span className="ml-2 text-muted-foreground">https://www.facebook.com/GTCGVNtaiNhat/</span>
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
