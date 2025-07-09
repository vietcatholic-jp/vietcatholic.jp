"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Registration } from "@/lib/types";

interface ExportButtonProps {
  registrations: Registration[];
}

export function ExportButton({ registrations }: ExportButtonProps) {
  const exportToCSV = () => {
    if (!registrations || registrations.length === 0) {
      alert("Không có dữ liệu để xuất");
      return;
    }

    // Create CSV headers
    const headers = [
      "Mã đăng ký",
      "Trạng thái", 
      "Người đăng ký",
      "Email",
      "Số người tham gia",
      "Tổng tiền (JPY)",
      "Ngày đăng ký",
      "Ghi chú"
    ];

    // Create CSV data
    const csvData = registrations.map(reg => [
      reg.invoice_code,
      reg.status,
      reg.user?.full_name || '',
      reg.user?.email || '',
      reg.participant_count,
      reg.total_amount,
      new Date(reg.created_at).toLocaleDateString('vi-VN'),
      reg.notes || ''
    ]);

    // Combine headers and data
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `danh-sach-dang-ky-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button onClick={exportToCSV} variant="outline">
      <Download className="h-4 w-4 mr-2" />
      Xuất CSV
    </Button>
  );
}
