"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  HelpCircle, 
  Users, 
  UserCheck, 
  Crown, 
  Star,
  Info,
  BookOpen
} from "lucide-react";
import { getAllRoleCategories, getRoleCategoryColor, type RoleCategory } from "@/lib/role-utils";

interface RoleHelpProps {
  className?: string;
}

export function RoleHelp({ className }: RoleHelpProps) {
  const [open, setOpen] = useState(false);

  const roleExamples = {
    'Tham gia': [
      { name: 'Tham dự viên', description: 'Người tham gia sự kiện với vai trò cơ bản' }
    ],
    'Tình nguyện': [
      { name: 'Trưởng ban Truyền thông', description: 'Lãnh đạo nhóm truyền thông, chịu trách nhiệm về hoạt động truyền thông' },
      { name: 'Thành viên ban Sinh hoạt', description: 'Hỗ trợ tổ chức các hoạt động sinh hoạt trong sự kiện' },
      { name: 'Phó ban Y tế', description: 'Hỗ trợ trưởng ban Y tế trong việc chăm sóc sức khỏe' }
    ],
    'Tổ chức': [
      { name: 'Ban Tổ chức chính', description: 'Thành viên ban tổ chức cốt lõi, quyết định các vấn đề quan trọng' },
      { name: 'Ban Tổ chức khu vực', description: 'Đại diện tổ chức tại các khu vực địa phương' }
    ],
    'Đặc biệt': [
      { name: 'Diễn giả', description: 'Người được mời thuyết trình tại sự kiện' },
      { name: 'Nghệ sĩ biểu diễn', description: 'Người tham gia biểu diễn văn nghệ' }
    ]
  } as Record<RoleCategory, Array<{ name: string; description: string }>>;

  const getCategoryIcon = (category: RoleCategory) => {
    switch (category) {
      case 'Tổ chức': return <Crown className="h-4 w-4" />;
      case 'Tình nguyện': return <UserCheck className="h-4 w-4" />;
      case 'Đặc biệt': return <Star className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <HelpCircle className="h-4 w-4 mr-2" />
          Hướng dẫn vai trò
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Hướng dẫn về vai trò trong hệ thống
          </DialogTitle>
          <DialogDescription>
            Tìm hiểu về các loại vai trò và cách sử dụng chúng trong việc quản lý sự kiện
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tổng quan về vai trò</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Hệ thống vai trò giúp phân loại và quản lý người tham gia sự kiện một cách hiệu quả. 
                Mỗi người tham gia có thể được gán một vai trò cụ thể để dễ dàng tổ chức và phân công công việc.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {getAllRoleCategories().map((category) => (
                  <div key={category} className="text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${getRoleCategoryColor(category)}`}>
                      {getCategoryIcon(category)}
                    </div>
                    <div className="font-medium">{category}</div>
                    <div className="text-xs text-muted-foreground">
                      {roleExamples[category]?.length || 0} vai trò
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Role Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Chi tiết các loại vai trò</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {getAllRoleCategories().map((category) => (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-3">
                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${getRoleCategoryColor(category)}`}>
                          {getCategoryIcon(category)}
                        </div>
                        <div>
                          <div className="font-medium">{category}</div>
                          <div className="text-sm text-muted-foreground">
                            {roleExamples[category]?.length || 0} vai trò mẫu
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-4">
                        <div className="text-sm text-muted-foreground mb-4">
                          {category === 'Tham gia' && 'Những người tham gia sự kiện với vai trò cơ bản, không có trách nhiệm tổ chức cụ thể.'}
                          {category === 'Tình nguyện' && 'Những người tình nguyện hỗ trợ tổ chức sự kiện, được phân chia thành các ban chuyên môn.'}
                          {category === 'Tổ chức' && 'Những người có trách nhiệm tổ chức và điều hành sự kiện, có quyền quyết định.'}
                          {category === 'Đặc biệt' && 'Những người có vai trò đặc biệt như diễn giả, nghệ sĩ, hoặc khách mời.'}
                        </div>
                        
                        <div className="space-y-2">
                          {roleExamples[category]?.map((role, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                              <Badge variant="outline" className="mt-0.5">
                                {role.name}
                              </Badge>
                              <div className="flex-1 text-sm text-muted-foreground">
                                {role.description}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Usage Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5" />
                Mẹo sử dụng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium">Phân đội hiệu quả</div>
                    <div className="text-sm text-muted-foreground">
                      Sử dụng thông tin vai trò để phân chia người tham gia vào các đội phù hợp với khả năng và kinh nghiệm.
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium">Lọc và tìm kiếm</div>
                    <div className="text-sm text-muted-foreground">
                      Sử dụng bộ lọc vai trò để nhanh chóng tìm kiếm những người có kỹ năng hoặc trách nhiệm cụ thể.
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium">Báo cáo và thống kê</div>
                    <div className="text-sm text-muted-foreground">
                      Xem thống kê phân bố vai trò để đảm bảo cân bằng giữa các nhóm và chức năng.
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium">Xuất dữ liệu</div>
                    <div className="text-sm text-muted-foreground">
                      Thông tin vai trò sẽ được bao gồm trong tất cả các file xuất dữ liệu để tiện quản lý.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
