"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  CreditCard, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Clock,
  DollarSign,
  MapPin,
  UserPlus,
  Edit,
  Trash2,
  HelpCircle,
  Info,
  Star,
  ShieldCheck,
  Copy,
  RefreshCw,
  Award,
  Target,
  MessageSquare,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export function RegistrationGuide() {
  const [activeTab, setActiveTab] = useState<'overview' | 'register' | 'payment' | 'manage' | 'cancel' | 'faq'>('overview');

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: Info },
    { id: 'register', label: 'Cách đăng ký', icon: UserPlus },
    { id: 'payment', label: 'Đóng phí tham dự', icon: CreditCard },
    { id: 'manage', label: 'Quản lý đăng ký', icon: Edit },
    { id: 'cancel', label: 'Hủy đăng ký', icon: XCircle },
    { id: 'faq', label: 'Câu hỏi thường gặp', icon: HelpCircle },
  ];

  const TabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewSection />;
      case 'register':
        return <RegisterSection />;
      case 'payment':
        return <PaymentSection />;
      case 'manage':
        return <ManageSection />;
      case 'cancel':
        return <CancelSection />;
      case 'faq':
        return <FAQSection />;
      default:
        return <OverviewSection />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Hướng dẫn đăng ký tham gia
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            ĐẠI HỘI TOÀN QUỐC NĂM THÁNH 2025 - Những Người Hành Hương của Hy Vọng
          </p>
          <div className="flex justify-center">
            <Badge variant="outline" className="text-base px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 dark:from-slate-700 dark:to-slate-800">
              <Calendar className="h-4 w-4 mr-2" />
              14-15/09/2025
            </Badge>
          </div>
          <p className="text-sm text-orange-500 text-muted-foreground mt-2">
            Vui lòng mở trang web đăng ký này qua trình duyệt Safari hoặc Chrome trên điện thoại.
            Không mở trực tiếp trên Messenger để tránh lỗi hiển thị.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                className="flex items-center gap-2"
                onClick={() => setActiveTab(tab.id as 'overview' | 'register' | 'payment' | 'manage' | 'cancel' | 'faq')}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          <TabContent />
        </div>
      </div>
    </div>
  );
}

// Overview Section
function OverviewSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Chào mừng đến với Đại hội Năm Thánh 2025!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Thông tin sự kiện</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span>ĐẠI HỘI TOÀN QUỐC NĂM THÁNH 2025</span>
				  <span>Những Người Hành Hương của Hy Vọng</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <span>Hadano, Kanagawa, Nhật Bản</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  <span>Dành cho cộng đồng Công giáo Việt Nam tại Nhật</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Mức phí tham gia</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-slate-800 rounded-lg">
                  <span>Người lớn (từ 12 tuổi trở lên)</span>
                  <Badge variant="secondary">¥6,000</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-slate-800 rounded-lg">
                  <span>Trẻ em (dưới 12 tuổi)</span>
                  <Badge variant="secondary">¥3,000</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Quy trình đăng ký tổng quan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center p-4 bg-blue-50 dark:bg-slate-800 rounded-lg">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-3">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">1. Đăng ký</h3>
              <p className="text-sm text-center text-muted-foreground">
                Tạo tài khoản và điền thông tin đăng ký
              </p>
            </div>

            <div className="flex flex-col items-center p-4 bg-green-50 dark:bg-slate-800 rounded-lg">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">2. Đóng phí tham dự</h3>
              <p className="text-sm text-center text-muted-foreground">
                Chuyển khoản và thông báo biên lai
              </p>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-purple-50 dark:bg-slate-800 rounded-lg">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-3">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">3. Xác nhận</h3>
              <p className="text-sm text-center text-muted-foreground">
                Chờ ban tổ chức xác nhận đóng phí tham dự
              </p>
            </div>

            <div className="flex flex-col items-center p-4 bg-orange-50 dark:bg-slate-800 rounded-lg">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mb-3">
                <Award className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">4. Hoàn tất</h3>
              <p className="text-sm text-center text-muted-foreground">
                Nhận thông tin và chuẩn bị tham gia
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-500" />
            Liên hệ hỗ trợ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-3">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-blue-500" />
              <span>Fanpage: </span>
              <a 
                href="https://www.facebook.com/GTCGVNtaiNhat/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                facebook.com/GTCGVNtaiNhat
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ trực tiếp qua fanpage của nhóm giới trẻ công giáo tại Nhật.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Register Section
function RegisterSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-500" />
            Cách thức đăng ký
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Bước 1: Tạo tài khoản</h3>
              <div className="pl-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Truy cập trang web và nhấn &quot;Đăng ký&quot; trong menu</span>
                </div>
				        <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  💡 <strong>Khuyến nghị:</strong> Sử dụng Google để đăng ký thuận tiện và nhanh chóng hơn!
                </p>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Nhập email và mật khẩu để tạo tài khoản</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Xác thực email qua liên kết được gửi</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Bước 2: Chọn vai trò tham gia</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Tham dự viên</h4>
                  <p className="text-sm text-muted-foreground">
                    Dành cho các thành viên muốn tham gia sự kiện với đầy đủ các hoạt động
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Thành viên ban tổ chức</h4>
                  <p className="text-sm text-muted-foreground">
                    Dành cho những người người có vai trò hỗ trợ tổ chức sự kiện
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Bước 3: Điền thông tin đăng ký</h3>
              <div className="space-y-3">
                <div className="p-4 bg-blue-50 dark:bg-slate-800 rounded-lg">
                  <h4 className="font-medium mb-2">Thông tin cá nhân</h4>
                  <div className="space-y-1 text-sm">
                    <p>• Tên Thánh (không bắt buộc)</p>
                    <p>• Họ và tên đầy đủ</p>
                    <p>• Giới tính</p>
                    <p>• Nhóm tuổi</p>
                    <p>• Kích cỡ áo</p>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 dark:bg-slate-800 rounded-lg">
                  <h4 className="font-medium mb-2">Thông tin liên hệ</h4>
                  <div className="space-y-1 text-sm">
                    <p>• Tỉnh/thành phố</p>
                    <p>• Giáo phận</p>
                    <p>• Facebook (bắt buộc với người đăng ký chính)</p>
                    <p>• Email (tuỳ chọn)</p>
                    <p>• Số điện thoại (tuỳ chọn)</p>
                    <p>• Địa chỉ (tuỳ chọn)</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Bước 4: Thêm người tham gia khác (nếu có)</h3>
              <div className="p-4 bg-amber-50 dark:bg-slate-800 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Lưu ý quan trọng:</p>
                    <ul className="text-sm text-amber-700 mt-1 space-y-1">
                      <li>• Bạn có thể đăng ký cho nhiều người trong cùng một form</li>
                      <li>• Người đầu tiên sẽ là liên hệ chính</li>
                      <li>• Các thành viên khác sẽ dùng chung thông tin liên hệ</li>
                      <li>• Mỗi người cần điền đầy đủ thông tin cá nhân</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Button asChild>
              <Link href="/register">
                <ArrowRight className="h-4 w-4 mr-2" />
                Bắt đầu đăng ký ngay
              </Link>
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}

// Payment Section
function PaymentSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-500" />
            Hướng dẫn đóng phí tham dự
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="p-4 bg-green-50 dark:bg-slate-800 rounded-lg border border-green-200">
              <h3 className="font-semibold mb-3">Phương thức đóng phí tham dự duy nhất: Chuyển khoản ngân hàng</h3>
              <p className="text-sm text-green-700">
                Hiện tại chỉ hỗ trợ đóng phí tham dự qua chuyển khoản ngân hàng Yucho.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Thông tin ngân hàng</h3>
              <div className="grid gap-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Tên ngân hàng</p>
                    <p className="font-medium">ゆうちょ銀行 (Yucho Bank)</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Chi nhánh (店名)</p>
                    <p className="font-medium">二四八(ニヨンハチ）</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Loại tài khoản</p>
                    <p className="font-medium">普通 (Futsu/Regular)</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Mã (記号)</p>
                    <p className="font-medium font-mono">12440</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Số tài khoản (番号)</p>
                    <p className="font-medium font-mono">Xem stk sau khi đăng ký</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-red-600 text-muted-foreground">Tên tài khoản</p>
                    <p className="font-medium text-red-600">在日カトリックベトナム青年会</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Quy trình đóng phí tham dự</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">1</div>
                  <div>
                    <p className="font-medium">Chuyển khoản đúng số tiền</p>
                    <p className="text-sm text-muted-foreground">Chuyển khoản theo đúng tổng số tiền hiển thị trong đăng ký</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">2</div>
                  <div>
                    <p className="font-medium">Ghi mã đăng ký trong nội dung chuyển khoản</p>
                    <p className="text-sm text-muted-foreground">Ghi chính xác mã đăng ký (6 chữ số) vào nội dung chuyển khoản (依頼人名)</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">3</div>
                  <div>
                    <p className="font-medium">Chụp màn hình hoặc giữ biên lai</p>
                    <p className="text-sm text-muted-foreground">Lưu lại bằng chứng chuyển khoản để upload</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">4</div>
                  <div>
                    <p className="font-medium">Upload biên lai trong trang đóng phí tham dự</p>
                    <p className="text-sm text-muted-foreground">Vào trang đóng phí tham dự để upload hình ảnh biên lai</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-red-50 dark:bg-slate-800 rounded-lg border border-red-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Lưu ý quan trọng:</p>
                  <ul className="text-sm text-red-700 mt-1 space-y-1">
                    <li>• Phải ghi đúng mã đăng ký trong nội dung chuyển khoản</li>
                    <li>• Không ghi mã đăng ký sẽ khiến việc xác nhận đóng phí tham dự bị chậm trễ</li>
                    <li>• Đăng ký sẽ được xác nhận trong vòng 1-2 ngày làm việc</li>
                    <li>• Liên hệ qua fanpage nếu có vấn đề</li>
                    <li>• Hạn chuyển khoản 10 ngày sau khi đăng ký và trước ngày 10/09/2025</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Management Section
function ManageSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-500" />
            Quản lý đăng ký của bạn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-slate-800 rounded-lg">
              <h3 className="font-semibold mb-2">Truy cập trang quản lý</h3>
              <p className="text-sm text-blue-700 mb-3">
                Sau khi đăng ký thành công, bạn có thể quản lý đăng ký tại trang &quot;Quản lý đăng ký&quot; trong menu.
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Đi tới trang quản lý đăng ký
                </Link>
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Các trạng thái đăng ký</h3>
              <div className="grid gap-3">
                <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Chờ đóng phí tham dự</span>
                  </div>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    Chờ đóng phí tham dự
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Đã báo đóng phí tham dự</span>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Chờ xác nhận
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Đã xác nhận</span>
                  </div>
                  <Badge variant="default" className="bg-green-500">
                    Đã xác nhận
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="font-medium">Xác nhận đóng phí tham dự bị từ chối</span>
                  </div>
                  <Badge variant="destructive">
                    Đóng phí tham dự bị từ chối
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Đã quyên góp</span>
                  </div>
                  <Badge variant="default" className="bg-orange-500">
                    Đã quyên góp
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-red-600" />
                    <span className="font-medium">Đã huỷ </span>
                  </div>
                  <Badge variant="default" className="bg-red-500">
                    Đã huỷ
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Các thao tác có thể thực hiện</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Edit className="h-4 w-4 text-blue-500" />
                    <h4 className="font-medium">Chỉnh sửa đăng ký</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Có thể chỉnh sửa thông tin khi trạng thái là &quot;Chờ đóng phí tham dự&quot; hoặc &quot;Đóng phí tham dự bị từ chối&quot;
                  </p>
                  <Badge variant="outline" className="text-xs">
                    Chỉ khi chưa đóng phí tham dự
                  </Badge>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Trash2 className="h-4 w-4 text-red-500" />
                    <h4 className="font-medium">Xóa đăng ký</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Có thể xóa đăng ký khi trạng thái là &quot;Chờ đóng phí tham dự&quot; hoặc &quot;Đóng phí tham dự bị từ chối&quot;
                  </p>
                  <Badge variant="outline" className="text-xs">
                    Chỉ khi chưa đóng phí tham dự
                  </Badge>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-4 w-4 text-green-500" />
                    <h4 className="font-medium">Đóng phí tham dự</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Có thể vào trang đóng phí tham dự để xem thông tin và upload biên lai
                  </p>
                  <Badge variant="outline" className="text-xs">
                    Khi chưa đóng phí tham dự
                  </Badge>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-4 w-4 text-orange-500" />
                    <h4 className="font-medium">Yêu cầu hủy</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Có thể gửi yêu cầu hủy đăng ký và hoàn tiền khi đã đóng phí tham dự
                  </p>
                  <Badge variant="outline" className="text-xs">
                    Khi đã đóng phí tham dự
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Cancellation Section
function CancelSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Chính sách hủy đăng ký
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="p-4 bg-amber-50 dark:bg-slate-800 rounded-lg border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Thời hạn hủy đăng ký</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Hạn chót để gửi yêu cầu hủy đăng ký sẽ được thông báo cụ thể trong quá trình đăng ký.
                    Sau thời hạn này, sẽ không thể hủy đăng ký.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Quy trình hủy đăng ký</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-medium">1</div>
                  <div>
                    <p className="font-medium">Gửi yêu cầu hủy</p>
                    <p className="text-sm text-muted-foreground">Trong trang cá nhân, nhấn nút &quot;Yêu cầu hủy&quot; cho đăng ký muốn hủy</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-medium">2</div>
                  <div>
                    <p className="font-medium">Chọn loại yêu cầu</p>
                    <p className="text-sm text-muted-foreground">Chọn &quot;Hoàn tiền&quot; hoặc &quot;Quyên góp&quot; cho tổ chức</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-medium">3</div>
                  <div>
                    <p className="font-medium">Điền thông tin</p>
                    <p className="text-sm text-muted-foreground">Điền lý do hủy và thông tin ngân hàng (nếu chọn hoàn tiền)</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-medium">4</div>
                  <div>
                    <p className="font-medium">Chờ xử lý</p>
                    <p className="text-sm text-muted-foreground">Ban tổ chức sẽ xem xét và phản hồi yêu cầu</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-medium">5</div>
                  <div>
                    <p className="font-medium">Hoàn tiền (nếu được duyệt)</p>
                    <p className="text-sm text-muted-foreground">Hoàn tiền sẽ được thực hiện sau ngày 15 tháng 9 trong vòng 7 ngày làm việc</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Các lựa chọn khi hủy</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="h-4 w-4 text-blue-500" />
                    <h4 className="font-medium">Hoàn tiền</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Yêu cầu hoàn lại số tiền đã đóng phí tham dự
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs font-medium">Cần cung cấp:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Số tài khoản ngân hàng</li>
                      <li>• Tên ngân hàng</li>
                      <li>• Tên chủ tài khoản</li>
                      <li>• Lý do hủy đăng ký</li>
                    </ul>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <h4 className="font-medium">Quyên góp</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Quyên góp số tiền đã đóng phí tham dự cho tổ chức
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs font-medium">Ưu điểm:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Xử lý nhanh chóng</li>
                      <li>• Không cần thông tin ngân hàng</li>
                      <li>• Hỗ trợ tổ chức</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-red-50 dark:bg-slate-800 rounded-lg border border-red-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Điều kiện hủy đăng ký:</p>
                  <ul className="text-sm text-red-700 mt-1 space-y-1">
                    <li>• Chỉ có thể hủy khi đã đóng phí tham dự và được xác nhận</li>
                    <li>• Không thể hủy nếu đã quá hạn chót</li>
                    <li>• Không thể hủy nếu đã được cấp vé tham gia</li>
                    <li>• Hoàn tiền sẽ thực hiện sau ngày 15 tháng 9</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// FAQ Section
function FAQSection() {
  const faqs = [
    {
      question: "Tôi có thể đăng ký cho người khác không?",
      answer: "Có, bạn có thể đăng ký cho nhiều người trong cùng một form đăng ký. Người đầu tiên sẽ là liên hệ chính và các thành viên khác sẽ dùng chung thông tin liên hệ này."
    },
    {
      question: "Tôi có thể thay đổi thông tin sau khi đăng ký không?",
      answer: "Bạn có thể chỉnh sửa thông tin khi trạng thái đăng ký là 'Chờ đóng phí tham dự' hoặc 'Đóng phí tham dự bị từ chối'. Sau khi đóng phí tham dự được xác nhận, bạn không thể tự chỉnh sửa."
    },
    {
      question: "Tôi đã chuyển khoản nhưng chưa thấy trạng thái thay đổi?",
      answer: "Vui lòng kiểm tra xem bạn đã ghi đúng mã đăng ký trong nội dung chuyển khoản chưa. Nếu đã đúng, hãy đợi 1-2 ngày làm việc để ban tổ chức xác nhận. Nếu vẫn không thấy thay đổi, hãy liên hệ qua fanpage."
    },
    {
      question: "Tôi có thể hủy đăng ký không?",
      answer: "Có, bạn có thể hủy đăng ký trước hạn chót (được thông báo trong quá trình đăng ký). Bạn có thể chọn hoàn tiền hoặc quyên góp cho tổ chức. Hoàn tiền sẽ được thực hiện sau ngày 15 tháng 9."
    },
    {
      question: "Phí tham gia bao gồm những gì?",
      answer: "Phí tham gia sẽ bao gồm các chi phí tổ chức sự kiện, ăn uống, và các hoạt động trong chương trình. Thông tin chi tiết sẽ được cập nhật trong chương trình sự kiện."
    },
    {
      question: "Tôi cần chuẩn bị gì để tham gia?",
      answer: "Sau khi đăng ký được xác nhận, bạn hãy tạo vé điện tử, mang theo để checkin khi tới Đại Hội. Hãy theo dõi fanpage để cập nhật thông tin."
    },
    {
      question: "Có hỗ trợ phương tiện di chuyển không?",
      answer: "Thông tin về phương tiện di chuyển và hỗ trợ giao thông sẽ được cập nhật sau trong mục quản lý đăng ký. Vui lòng theo dõi fanpage để biết thêm chi tiết."
    },
    {
      question: "Tôi quên mật khẩu tài khoản thì làm sao?",
      answer: "Bạn có thể sử dụng chức năng 'Quên mật khẩu' trong trang đăng nhập để đặt lại mật khẩu qua email."
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-500" />
            Câu hỏi thường gặp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-blue-700">{faq.question}</h3>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-500" />
            Vẫn có thắc mắc?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Nếu bạn không tìm thấy câu trả lời cho thắc mắc của mình, vui lòng liên hệ trực tiếp với chúng tôi.
            </p>
            <div className="flex justify-center">
              <Button asChild>
                <a 
                  href="https://www.facebook.com/GTCGVNtaiNhat/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Liên hệ qua Facebook
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
