"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, BarChart3, Users, MapPin, Church, RefreshCw } from "lucide-react";
import { useAnalytics } from "./AnalyticsProvider";

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ thanh toán' },
  { value: 'report_paid', label: 'Đã báo thanh toán' },
  { value: 'confirm_paid', label: 'Đã xác nhận thanh toán' },
  { value: 'payment_rejected', label: 'Thanh toán bị từ chối' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'checked_in', label: 'Đã check-in' },
  { value: 'cancelled', label: 'Đã hủy' }
];

const REPORT_TYPES = [
  { value: 'summary', label: 'Tổng quan', icon: Users },
  { value: 'shirt-size', label: 'Size áo', icon: BarChart3 },
  { value: 'province', label: 'Tỉnh thành', icon: MapPin },
  { value: 'diocese', label: 'Giáo phận', icon: Church }
];

export function AnalyticsFilters() {
  const { filters, updateFilter, clearFilters, refreshData, loading } = useAnalytics();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Bộ lọc và báo cáo
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Report Type Selector */}
        <div>
          <Label htmlFor="reportType">Loại báo cáo</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            {REPORT_TYPES.map(type => {
              const Icon = type.icon;
              return (
                <Button
                  key={type.value}
                  variant={filters.reportType === type.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateFilter('reportType', type.value)}
                  className="justify-start"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {type.label}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="status">Trạng thái</Label>
            <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dateFrom">Từ ngày</Label>
            <Input
              id="dateFrom"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="dateTo">Đến ngày</Label>
            <Input
              id="dateTo"
              type="date"
              value={filters.dateTo}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="search">Tìm kiếm</Label>
            <Input
              id="search"
              placeholder="Mã đăng ký, tên, email..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={clearFilters}>
            Xóa bộ lọc
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}