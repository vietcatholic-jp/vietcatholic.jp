"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList
} from "recharts";
import { 
  Users, 
  UserCheck, 
  Crown, 
  Star,
  TrendingUp
} from "lucide-react";
import {
  getEventRoleCategory,
  getRoleCategoryColor,
  type RoleCategory
} from "@/lib/role-utils";

interface RoleStatistic {
  role_name: string;
  role_label: string;
  total_count: number;
  confirmed_count: number;
  paid_count: number;
  pending_count: number;
}

interface RoleStatisticsProps {
  className?: string;
}

export function RoleStatistics({ className }: RoleStatisticsProps) {
  const [statistics, setStatistics] = useState<RoleStatistic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoleStatistics();
  }, []);

  const fetchRoleStatistics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/statistics/roles');
      if (!response.ok) {
        throw new Error('Failed to fetch role statistics');
      }
      const data = await response.json();
      setStatistics(data.data || []);
    } catch (err) {
      console.error('Error fetching role statistics:', err);
      setError('Không thể tải thống kê vai trò');
    } finally {
      setIsLoading(false);
    }
  };

  // Group statistics by category
  const categoryStats = statistics.reduce((acc, stat) => {
    const category = getEventRoleCategory(stat.role_name);
    if (!acc[category]) {
      acc[category] = {
        category,
        total_count: 0,
        confirmed_count: 0,
        paid_count: 0,
        pending_count: 0,
        roles: []
      };
    }
    acc[category].total_count += stat.total_count;
    acc[category].confirmed_count += stat.confirmed_count;
    acc[category].paid_count += stat.paid_count;
    acc[category].pending_count += stat.pending_count;
    acc[category].roles.push(stat);
    return acc;
  }, {} as Record<RoleCategory, {
    category: RoleCategory;
    total_count: number;
    confirmed_count: number;
    paid_count: number;
    pending_count: number;
    roles: RoleStatistic[];
  }>);

  // Prepare data for charts
  const categoryChartData = Object.values(categoryStats).map(cat => ({
    name: cat.category,
    value: cat.total_count,
    confirmed: cat.confirmed_count,
    paid: cat.paid_count,
    pending: cat.pending_count
  }));

  const topRolesData = statistics
    .sort((a, b) => b.total_count - a.total_count)
    .slice(0, 10)
    .map(stat => ({
      name: stat.role_label || stat.role_name,
      total: stat.total_count,
      confirmed: stat.confirmed_count,
      paid: stat.paid_count,
      pending: stat.pending_count
    }));

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (isLoading) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Thống kê theo vai trò
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-[200px] w-full" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-[80px]" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalParticipants = statistics.reduce((sum, stat) => sum + stat.total_count, 0);

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Thống kê theo vai trò
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.values(categoryStats).map((cat) => (
                <div key={cat.category} className="text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${getRoleCategoryColor(cat.category)}`}>
                    {cat.category === 'Tổ chức' && <Crown className="h-6 w-6" />}
                    {cat.category === 'Tình nguyện' && <UserCheck className="h-6 w-6" />}
                    {cat.category === 'Đặc biệt' && <Star className="h-6 w-6" />}
                    {cat.category === 'Tham gia' && <Users className="h-6 w-6" />}
                  </div>
                  <div className="text-2xl font-bold">{cat.total_count}</div>
                  <div className="text-sm text-muted-foreground">{cat.category}</div>
                  <div className="text-xs text-muted-foreground">
                    {((cat.total_count / totalParticipants) * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Distribution Pie Chart */}
              <div>
                <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Phân bố theo loại vai trò
                </h4>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                      <LabelList dataKey="name" position="outside" />
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [value, 'Số người']}
                      labelFormatter={(label: string) => `${label}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Top Roles Bar Chart */}
              <div>
                <h4 className="text-sm font-medium mb-4">Top 10 vai trò nhiều người nhất</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={topRolesData}
                    layout="horizontal"
                    margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Bar dataKey="total" fill="#8884d8">
                      <LabelList dataKey="total" position="right" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Role List */}
            <div>
              <h4 className="text-sm font-medium mb-4">Chi tiết theo vai trò</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {statistics
                  .sort((a, b) => b.total_count - a.total_count)
                  .map((stat) => (
                    <div key={stat.role_name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{stat.role_label || stat.role_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {stat.confirmed_count} xác nhận • {stat.paid_count} đã thanh toán • {stat.pending_count} chờ xử lý
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {stat.total_count} người
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
