import { Calendar, MapPin, Users, Clock, Heart, Cross, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function EventInfo() {
  return (
    <section className="py-20 bg-gradient-to-br from-white via-blue-50 to-purple-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
            ✨ Năm Thánh 2025 ✨
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-700 to-purple-600 bg-clip-text text-transparent">
            🌟 Thông Tin Đại Hội 🌟
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Hành trình đức tin với chủ đề &ldquo;Những Người Hành Hương Hy Vọng&rdquo; - 
            Nơi gặp gỡ, chia sẻ và cùng nhau xây dựng cộng đồng Công giáo Việt Nam mạnh mẽ tại Nhật Bản
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="ml-3 text-blue-800">Thời gian</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700 mb-1">2025</div>
              <p className="text-sm text-blue-600 font-medium">
                📅 Ngày 14 & 15 tháng 9, 2025
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="bg-green-600 p-2 rounded-lg">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="ml-3 text-green-800">Địa điểm</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700 mb-1">🗾 Nhật Bản</div>
              <p className="text-sm text-green-600 font-medium">
                📍 Kamiozuki, Hanado, Kanagawa (〒257-0005)
              </p>
              <p className="text-sm text-green-600 font-medium">
                <a href="https://maps.app.goo.gl/YbZy9rFzni7ztTMv6" className="text-blue-600 hover:underline">Google map</a>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="bg-purple-600 p-2 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="ml-3 text-purple-800">Tham gia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700 mb-1">🇻🇳 Toàn quốc</div>
              <p className="text-sm text-purple-600 font-medium">
                👥 Mọi người Việt tại Nhật Bản
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="bg-amber-600 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="ml-3 text-amber-800">Đăng ký</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-700 mb-1">✅ Đang mở</div>
              <p className="text-sm text-amber-600 font-medium">
                🚀 Đăng ký ngay hôm nay!
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-blue-800">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                🎯 Mục tiêu Đại hội
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3 p-2 rounded-lg bg-white/50">
                  <div className="h-2 w-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                  <span className="text-gray-700">
                    <strong>Đoàn kết:</strong> Tăng cường tình đoàn kết và gắn bó giữa các cộng đồng Công giáo Việt Nam tại Nhật Bản
                  </span>
                </li>
                <li className="flex items-start gap-3 p-2 rounded-lg bg-white/50">
                  <div className="h-2 w-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                  <span className="text-gray-700">
                    <strong>Chia sẻ:</strong> Học hỏi và chia sẻ kinh nghiệm trong đời sống đức tin và hội nhập xã hội
                  </span>
                </li>
                <li className="flex items-start gap-3 p-2 rounded-lg bg-white/50">
                  <div className="h-2 w-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                  <span className="text-gray-700">
                    <strong>Phát triển:</strong> Xây dựng mạng lưới hỗ trợ và cộng đồng bền vững
                  </span>
                </li>
                <li className="flex items-start gap-3 p-2 rounded-lg bg-white/50">
                  <div className="h-2 w-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                  <span className="text-gray-700">
                    <strong>Truyền thống:</strong> Truyền đạt giá trị văn hóa và đức tin cho thế hệ trẻ
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-purple-800">
                <div className="bg-purple-600 p-2 rounded-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                🎉 Các hoạt động chính
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3 p-2 rounded-lg bg-white/50">
                  <div className="h-2 w-2 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
                  <span className="text-gray-700">
                    <strong>⛪ Thánh lễ:</strong> Lễ khai mạc và bế mạc với các vị giám mục
                  </span>
                </li>
                <li className="flex items-start gap-3 p-2 rounded-lg bg-white/50">
                  <div className="h-2 w-2 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
                  <span className="text-gray-700">
                    <strong>💭 Hội thảo:</strong> Đời sống đức tin và hội nhập xã hội
                  </span>
                </li>
                <li className="flex items-start gap-3 p-2 rounded-lg bg-white/50">
                  <div className="h-2 w-2 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
                  <span className="text-gray-700">
                    <strong>🎭 Văn hóa:</strong> Giao lưu nghệ thuật và hoạt động văn hóa
                  </span>
                </li>
                <li className="flex items-start gap-3 p-2 rounded-lg bg-white/50">
                  <div className="h-2 w-2 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
                  <span className="text-gray-700">
                    <strong>🤝 Chia sẻ:</strong> Kinh nghiệm từ các cộng đoàn khác nhau
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Jubilee Year Special Section */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-amber-200 max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-3 text-amber-800 text-2xl">
                <Cross className="h-6 w-6" />
                ✨ Năm Thánh 2025 - Năm của Hy Vọng ✨
                <Cross className="h-6 w-6" />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-lg text-amber-700 mb-4 font-medium">
                &ldquo;Pilgrims of Hope&rdquo; - Chúng ta là những người hành hương hy vọng
              </p>
              <p className="text-gray-700 max-w-2xl mx-auto leading-relaxed">
                Trong Năm Thánh 2025, Giáo hội Công giáo kêu gọi tất cả tín hữu trở thành những người hành hương hy vọng, 
                mang ánh sáng Phúc Âm đến mọi nơi. Đại hội này là cơ hội để chúng ta cùng nhau thực hiện sứ mệnh này 
                trong cộng đồng người Việt tại Nhật Bản.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

