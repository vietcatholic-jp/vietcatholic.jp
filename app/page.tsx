import { Navbar } from "@/components/navbar";
import { EventInfo } from "@/components/event-info";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      <Navbar />
      
      {/* Hero Section with Jubilee Theme */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/5 to-amber-600/10" />
        <div className="absolute top-10 left-10 text-6xl text-blue-200/30">✨</div>
        <div className="absolute top-32 right-16 text-4xl text-amber-200/40">⭐</div>
        <div className="absolute bottom-20 left-1/4 text-5xl text-purple-200/30">🕊️</div>
        
        <div className="container mx-auto text-center relative z-10">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
              ✨ Năm Thánh 2025 - Pilgrims of Hope ✨
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-700 via-purple-600 to-amber-600 bg-clip-text text-transparent">
            Đại Hội Công Giáo
          </h1>
          <p className="text-2xl md:text-3xl text-gray-700 mb-4 font-light">
            Việt Nam tại Nhật Bản 14-15/09/2025
          </p>
          <div className="text-xl text-blue-600 mb-8 font-medium">
            🙏 &ldquo;Những Người Hành Hương Hy Vọng&rdquo; 🙏
          </div>
          
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Cùng nhau thực hiện hành trình đức tin, mang hy vọng và tình yêu đến cộng đồng Công giáo Việt Nam tại Nhật Bản
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all">
              <Link href="/auth/sign-up">
                <Heart className="mr-2 h-5 w-5" />
                Bắt Đầu Hành Trình
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-full">
              <Link href="/auth/login">
                Đăng Nhập
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Registration Steps Guide */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-gray-800">
              🌟 Hướng Dẫn Tham Gia 🌟
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Thực hiện các bước đơn giản để trở thành một Người Hành Hương Hy Vọng
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="absolute top-4 right-4 text-3xl">👤</div>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</div>
                  <CardTitle className="text-blue-800">Tạo Tài Khoản</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">Đăng ký tài khoản với thông tin cá nhân để bắt đầu hành trình</p>
                <Button asChild variant="outline" size="sm" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  <Link href="/auth/sign-up">
                    Đăng Ký Ngay
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="absolute top-4 right-4 text-3xl">📝</div>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</div>
                  <CardTitle className="text-green-800">Đăng Ký Tham Gia</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">Điền thông tin chi tiết và chọn các hoạt động bạn muốn tham gia</p>
                <Button asChild variant="outline" size="sm" className="border-green-600 text-green-600 hover:bg-green-50">
                  <Link href="/register">
                    Đăng Ký Sự Kiện
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="absolute top-4 right-4 text-3xl">💳</div>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-amber-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">3</div>
                  <CardTitle className="text-amber-800">Thanh Toán</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">Hoàn tất thanh toán phí tham gia để xác nhận đăng ký</p>
                <div className="text-sm text-amber-700 font-medium">
                  <CheckCircle className="inline mr-1 h-4 w-4" />
                  Thanh toán an toàn
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="absolute top-4 right-4 text-3xl">🎫</div>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">4</div>
                  <CardTitle className="text-purple-800">Nhận Vé</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">Tải xuống vé tham gia với thông tin cá nhân và QR code</p>
                <div className="text-sm text-purple-700 font-medium">
                  <Sparkles className="inline mr-1 h-4 w-4" />
                  Vé điện tử tiện lợi
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Event Information */}
      <EventInfo />

      {/* Call to Action */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-10 left-20 text-6xl opacity-20">🕊️</div>
        <div className="absolute bottom-10 right-20 text-6xl opacity-20">✨</div>
        
        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-4xl font-bold mb-4">
            🌟 Hãy Trở Thành Người Hành Hương Hy Vọng 🌟
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Cùng nhau xây dựng cộng đồng Công giáo Việt Nam mạnh mẽ và đầy hy vọng tại Nhật Bản.
            Mỗi bước đi của chúng ta là một lời cầu nguyện, mỗi gặp gỡ là một ân sủng.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all">
              <Link href="/auth/sign-up">
                <Heart className="mr-2 h-5 w-5" />
                Bắt Đầu Ngay Hôm Nay
              </Link>
            </Button>
            <p className="text-sm opacity-75">
              🙏 &ldquo;Trong Chúa Kitô, chúng ta tìm thấy hy vọng&rdquo; 🙏
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
