"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RolesChartProps {
  roleStats: { event_role: string; count: number }[];
}

// Role name mapping for better display
const roleNameMapping: Record<string, string> = {
  'participant': 'Người tham gia',
  'media_head': 'Trưởng ban Truyền thông',
  'media_deputy': 'Phó ban Truyền thông',
  'media_member': 'Thành viên ban Truyền thông',
  'activity_head': 'Trưởng ban Sinh hoạt',
  'activity_deputy': 'Phó ban Sinh hoạt',
  'activity_member': 'Thành viên ban Sinh hoạt',
  'discipline_head': 'Trưởng ban Kỷ luật',
  'discipline_deputy': 'Phó ban Kỷ luật',
  'discipline_member': 'Thành viên ban Kỷ luật',
  'logistics_head': 'Trưởng ban Hậu cần',
  'logistics_deputy': 'Phó ban Hậu cần',
  'logistics_member': 'Thành viên ban Hậu cần',
  'liturgy_head': 'Trưởng ban Phụng vụ',
  'liturgy_deputy': 'Phó ban Phụng vụ',
  'liturgy_member': 'Thành viên ban Phụng vụ',
  'security_head': 'Trưởng ban An ninh',
  'security_deputy': 'Phó ban An ninh',
  'security_member': 'Thành viên ban An ninh',
  'registration_head': 'Trưởng ban Thư ký',
  'registration_deputy': 'Phó ban Thư ký',
  'registration_member': 'Thành viên ban Thư ký',
  'catering_head': 'Trưởng ban Ẩm thực',
  'catering_deputy': 'Phó ban Ẩm thực',
  'catering_member': 'Thành viên ban Ẩm thực',
  'health_head': 'Trưởng ban Y tế',
  'health_deputy': 'Phó ban Y tế',
  'health_member': 'Thành viên ban Y tế',
  'audio_light_head': 'Trưởng ban Âm thanh Ánh sáng',
  'audio_light_deputy': 'Phó ban Âm thanh Ánh sáng',
  'audio_light_member': 'Thành viên ban Âm thanh Ánh sáng',
  'group_leader': 'Trưởng nhóm các đội',
  'group_deputy': 'Phó trưởng nhóm các đội',
  'organizer_main': 'Ban Tổ chức chính',
  'organizer_regional': 'Ban Tổ chức khu vực',
  'speaker': 'Diễn giả'
};

export function RolesChart({ roleStats }: RolesChartProps) {
  // Sort data by count in descending order for better visualization
  const sortedData = [...roleStats].sort((a, b) => b.count - a.count);

  // Find max value for percentage calculation
  const maxValue = Math.max(...sortedData.map(item => item.count));

  // Calculate percentage for each bar and map role names
  const dataWithPercentage = sortedData.map(item => ({
    ...item,
    displayName: roleNameMapping[item.event_role] || item.event_role.replace(/_/g, ' '),
    percentage: (item.count / maxValue) * 100
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📋 Thống kê theo vai trò
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Số lượng người đăng ký theo từng vai trò tham gia
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
                <div className="w-48 text-right text-sm font-medium text-gray-700 pr-4">
                  {item.displayName}
                </div>

                {/* Bar Container */}
                <div className="flex-1 relative">
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
            <div className="text-2xl font-bold text-blue-600">
              {roleStats.reduce((sum, stat) => sum + stat.count, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Tổng đăng ký</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
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
