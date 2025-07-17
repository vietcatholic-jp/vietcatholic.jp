"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DiocesesChartProps {
  dioceseStats: { diocese: string; count: number }[];
}

export function DiocesesChart({ dioceseStats }: DiocesesChartProps) {
  // Sort data by count in descending order for better visualization
  const sortedData = [...dioceseStats].sort((a, b) => b.count - a.count);

  // Find max value for percentage calculation
  const maxValue = Math.max(...sortedData.map(item => item.count));

  // Calculate percentage for each bar
  const dataWithPercentage = sortedData.map(item => ({
    ...item,
    percentage: (item.count / maxValue) * 100
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 Thống kê theo giáo phận
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Số lượng người đăng ký theo từng giáo phận
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart Header */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Số người đăng ký theo giáo phận
            </h3>
          </div>

          {/* Custom Horizontal Bar Chart */}
          <div className="space-y-2">
            {dataWithPercentage.map((item, index) => (
              <div key={item.diocese} className="flex items-center gap-4">
                {/* Diocese Name */}
                <div className="w-48 sm:w-2/5 md:w-48 text-right text-sm font-medium text-gray-700 pr-4">
                  {item.diocese}
                </div>

                {/* Bar Container */}
                <div className="flex-1 sm:w-3/5 md:flex-1 relative">
                  <div className="w-full bg-gray-200 rounded-r-md h-6 relative overflow-hidden">
                    {/* Animated Bar */}
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-r-md transition-all duration-1000 ease-out flex items-center justify-end pr-2"
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
            <div className="text-2xl font-bold text-blue-600">
              {dioceseStats.length}
            </div>
            <div className="text-sm text-muted-foreground">Tổng giáo phận</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {dioceseStats.reduce((sum, stat) => sum + stat.count, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Tổng đăng ký</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {sortedData[0]?.count || 0}
            </div>
            <div className="text-sm text-muted-foreground">Cao nhất</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(dioceseStats.reduce((sum, stat) => sum + stat.count, 0) / dioceseStats.length) || 0}
            </div>
            <div className="text-sm text-muted-foreground">Trung bình</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
