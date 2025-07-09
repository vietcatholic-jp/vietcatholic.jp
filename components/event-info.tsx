import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function EventInfo() {
  return (
    <section className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Thông tin Đại hội
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Đại hội Công giáo Việt Nam tại Nhật Bản 2025 - Nơi gặp gỡ, chia sẻ và cùng nhau xây dựng cộng đồng
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle className="ml-2 text-base">Thời gian</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2025</div>
              <p className="text-xs text-muted-foreground">
                Thông tin chi tiết sẽ được cập nhật
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <MapPin className="h-5 w-5 text-primary" />
              <CardTitle className="ml-2 text-base">Địa điểm</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Nhật Bản</div>
              <p className="text-xs text-muted-foreground">
                Venue sẽ được thông báo sớm
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="ml-2 text-base">Tham gia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Toàn quốc</div>
              <p className="text-xs text-muted-foreground">
                Mọi người Việt tại Nhật
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle className="ml-2 text-base">Đăng ký</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Mở</div>
              <p className="text-xs text-muted-foreground">
                Đăng ký ngay hôm nay
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Mục tiêu Đại hội</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Tăng cường tình đoàn kết và gắn bó giữa các cộng đồng Công giáo Việt Nam tại Nhật Bản
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Chia sẻ kinh nghiệm và học hỏi lẫn nhau trong đời sống đức tin và hội nhập
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Xây dựng mạng lưới hỗ trợ và phát triển cộng đồng bền vững
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Truyền đạt giá trị văn hóa và đức tin cho thế hệ trẻ
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Các hoạt động chính</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Thánh lễ khai mạc và bế mạc với sự tham dự của các vị giám mục
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Các buổi hội thảo về đời sống đức tin và hội nhập xã hội
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Các hoạt động văn hóa và giao lưu nghệ thuật
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Chia sẻ kinh nghiệm từ các cộng đoàn khác nhau
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
