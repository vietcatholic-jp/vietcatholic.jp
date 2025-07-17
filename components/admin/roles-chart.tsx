"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RolesChartProps {
  roleStats: { event_role: string; count: number }[];
}

// Note: Role names are now fetched dynamically from the database
// The API returns Vietnamese role names directly from event_roles.name field

export function RolesChart({ roleStats }: RolesChartProps) {
  // Sort data by count in descending order for better visualization
  const sortedData = [...roleStats].sort((a, b) => b.count - a.count);
  
  // Find max value for percentage calculation
  const maxValue = Math.max(...sortedData.map(item => item.count));
  
  // Calculate percentage for each bar - use role names directly from database
  const dataWithPercentage = sortedData.map(item => ({
    ...item,
    percentage: (item.count / maxValue) * 100,
    label: item.event_role // Vietnamese role names come directly from database
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
