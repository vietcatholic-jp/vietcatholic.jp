"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalytics } from "./AnalyticsProvider";
import { generateShirtSizeStats, generateProvinceStats, generateDioceseStats } from "./AnalyticsUtils";

export function ShirtSizeReport() {
  const { filteredRegistrations, loading } = useAnalytics();
  
  if (loading) {
    return <Card className="animate-pulse"><CardContent className="h-64 bg-gray-200 rounded"></CardContent></Card>;
  }

  const stats = generateShirtSizeStats(filteredRegistrations);
  const total = filteredRegistrations.reduce((sum, reg) => sum + (reg.registrants?.length || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thống kê size áo ({filteredRegistrations.length} đăng ký)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-2 text-left">Size áo</th>
                <th className="border border-gray-300 p-2 text-left">Số lượng</th>
                <th className="border border-gray-300 p-2 text-left">Tỷ lệ %</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(({ size, count, label }) => {
                const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
                return (
                  <tr key={size} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-2 font-medium">{label}</td>
                    <td className="border border-gray-300 p-2 text-center">{count}</td>
                    <td className="border border-gray-300 p-2 text-center">{percentage}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProvinceReport() {
  const { filteredRegistrations, loading } = useAnalytics();
  
  if (loading) {
    return <Card className="animate-pulse"><CardContent className="h-64 bg-gray-200 rounded"></CardContent></Card>;
  }

  const stats = generateProvinceStats(filteredRegistrations);
  const total = filteredRegistrations.reduce((sum, reg) => sum + (reg.registrants?.length || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thống kê tỉnh thành ({filteredRegistrations.length} đăng ký)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-2 text-left">Tỉnh thành</th>
                <th className="border border-gray-300 p-2 text-left">Số lượng</th>
                <th className="border border-gray-300 p-2 text-left">Tỷ lệ %</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(({ province, count, label }) => {
                const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
                return (
                  <tr key={province} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-2 font-medium">{label}</td>
                    <td className="border border-gray-300 p-2 text-center">{count}</td>
                    <td className="border border-gray-300 p-2 text-center">{percentage}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function DioceseReport() {
  const { filteredRegistrations, loading } = useAnalytics();
  
  if (loading) {
    return <Card className="animate-pulse"><CardContent className="h-64 bg-gray-200 rounded"></CardContent></Card>;
  }

  const stats = generateDioceseStats(filteredRegistrations);
  const grandTotal = filteredRegistrations.reduce((sum, reg) => sum + (reg.registrants?.length || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thống kê giáo phận ({filteredRegistrations.length} đăng ký)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-2 text-left">Giáo phận</th>
                <th className="border border-gray-300 p-2 text-left">Tổng số</th>
                <th className="border border-gray-300 p-2 text-left">Đăng ký riêng</th>
                <th className="border border-gray-300 p-2 text-left">Đi cùng</th>
                <th className="border border-gray-300 p-2 text-left">Tỷ lệ %</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(({ diocese, total, individual, goWith }) => {
                const percentage = grandTotal > 0 ? ((total / grandTotal) * 100).toFixed(1) : '0';
                return (
                  <tr key={diocese} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-2 font-medium">{diocese}</td>
                    <td className="border border-gray-300 p-2 text-center font-semibold">{total}</td>
                    <td className="border border-gray-300 p-2 text-center">{individual}</td>
                    <td className="border border-gray-300 p-2 text-center text-blue-600">{goWith}</td>
                    <td className="border border-gray-300 p-2 text-center">{percentage}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Giải thích:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li><strong>Đăng ký riêng:</strong> Người tự đăng ký di chuyển tự do</li>
            <li><strong className="text-blue-600">Đi cùng:</strong> Người được đăng ký có nhu cầu đi xe bus chung</li>
            <li><strong>Tổng số:</strong> Tổng cộng tất cả người tham gia từ giáo phận này</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}