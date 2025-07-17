"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RolesChartProps {
  roleStats: { event_role: string; count: number }[];
}

// Mapping từ tên vai trò tiếng Anh sang tiếng Việt
const roleLabels: Record<string, string> = {
  'participant': 'Người tham gia',
  // Media team roles
  'volunteer_media_leader': 'Trưởng ban Truyền thông',
  'volunteer_media_sub_leader': 'Phó ban Truyền thông',
  'volunteer_media_member': 'Thành viên ban Truyền thông',
  // Activity team roles
  'volunteer_activity_leader': 'Trưởng ban Sinh hoạt',
  'volunteer_activity_sub_leader': 'Phó ban Sinh hoạt',
  'volunteer_activity_member': 'Thành viên ban Sinh hoạt',
  // Discipline team roles
  'volunteer_discipline_leader': 'Trưởng ban Kỷ luật',
  'volunteer_discipline_sub_leader': 'Phó ban Kỷ luật',
  'volunteer_discipline_member': 'Thành viên ban Kỷ luật',
  // Logistics team roles
  'volunteer_logistics_leader': 'Trưởng ban Hậu cần',
  'volunteer_logistics_sub_leader': 'Phó ban Hậu cần',
  'volunteer_logistics_member': 'Thành viên ban Hậu cần',
  // Security team roles
  'volunteer_security_leader': 'Trưởng ban An ninh',
  'volunteer_security_sub_leader': 'Phó ban An ninh',
  'volunteer_security_member': 'Thành viên ban An ninh',
  // Registration team roles
  'volunteer_registration_leader': 'Trưởng ban Đăng ký',
  'volunteer_registration_sub_leader': 'Phó ban Đăng ký',
  'volunteer_registration_member': 'Thành viên ban Đăng ký',
  // Medical team roles
  'volunteer_medical_leader': 'Trưởng ban Y tế',
  'volunteer_medical_sub_leader': 'Phó ban Y tế',
  'volunteer_medical_member': 'Thành viên ban Y tế',
  // Audio/Light team roles
  'volunteer_audio_light_leader': 'Trưởng ban Âm thanh Ánh sáng',
  'volunteer_audio_light_sub_leader': 'Phó ban Âm thanh Ánh sáng',
  'volunteer_audio_light_member': 'Thành viên ban Âm thanh Ánh sáng',
  // Group leadership roles
  'volunteer_group_leader': 'Trưởng nhóm các đội',
  'volunteer_group_sub_leader': 'Phó trưởng nhóm các đội',
  // Organizer roles
  'organizer_core': 'Ban Tổ chức chính',
  'organizer_regional': 'Ban Tổ chức khu vực',
  // Special roles
  'speaker': 'Diễn giả',
  'performer': 'Nghệ sĩ biểu diễn'
};

export function RolesChart({ roleStats }: RolesChartProps) {
  // Sort data by count in descending order for better visualization
  const sortedData = [...roleStats].sort((a, b) => b.count - a.count);
  
  // Find max value for percentage calculation
  const maxValue = Math.max(...sortedData.map(item => item.count));
  
  // Calculate percentage for each bar and add Vietnamese labels
  const dataWithPercentage = sortedData.map(item => ({
    ...item,
    percentage: (item.count / maxValue) * 100,
    label: roleLabels[item.event_role] || item.event_role
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          👥 Thống kê theo vai trò
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Số lượng người đăng ký theo từng vai trò trong sự kiện
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart Header */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Số người đăng ký theo vai trò
            </h3>
          </div>

          {/* Custom Horizontal Bar Chart */}
          <div className="space-y-2">
            {dataWithPercentage.map((item, index) => (
              <div key={item.event_role} className="flex items-center gap-4">
                {/* Role Name */}
                <div className="w-1/2 sm:w-48 text-right text-sm font-medium text-gray-700 pr-4">
                  {item.label}
                </div>

                {/* Bar Container */}
                <div className="w-1/2 sm:flex-1 relative">
                  <div className="w-full bg-gray-200 rounded-r-md h-6 relative overflow-hidden">
                    {/* Animated Bar */}
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-purple-500 rounded-r-md transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                      style={{
                        width: `${item.percentage}%`,
                        animationDelay: `${index * 100}ms`
                      }}
                    >
                      {/* Value Label */}
                      <span className="text-white text-xs font-semibold">
                        {item.count}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Summary statistics */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {roleStats.length}
            </div>
            <div className="text-sm text-muted-foreground">Tổng vai trò</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {roleStats.reduce((sum, stat) => sum + stat.count, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Tổng đăng ký</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {sortedData[0]?.count || 0}
            </div>
            <div className="text-sm text-muted-foreground">Cao nhất</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(roleStats.reduce((sum, stat) => sum + stat.count, 0) / roleStats.length) || 0}
            </div>
            <div className="text-sm text-muted-foreground">Trung bình</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
