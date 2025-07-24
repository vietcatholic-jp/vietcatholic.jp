"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Registration, RegistrationStatus } from "@/lib/types";
import { toast } from "sonner";
import { 
  Save, 
  X,
  Edit,
  Loader2,
  Users
} from "lucide-react";

interface RegistrationEditModalProps {
  registration: Registration;
  onClose: () => void;
  onSave: () => void;
}

export function RegistrationEditModal({ registration, onClose, onSave }: RegistrationEditModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    status: registration.status,
    notes: registration.notes || "",
    registrants: registration.registrants?.map(r => ({
      id: r.id,
      full_name: r.full_name,
      saint_name: r.saint_name || "",
      phone: r.phone || "",
      facebook_link: r.facebook_link || "",
      is_primary: r.is_primary
    })) || [],
  });

  const statusOptions: { value: RegistrationStatus; label: string; description: string }[] = [
    { value: 'pending', label: 'Chờ đóng phí tham dự', description: 'Đang chờ người dùng đóng phí tham dự' },
    { value: 'report_paid', label: 'Đã báo đóng phí tham dự', description: 'Người dùng đã gửi biên lai' },
    { value: 'confirm_paid', label: 'Đã xác nhận đóng phí tham dự', description: 'Admin xác nhận đóng phí tham dự đúng' },
    { value: 'payment_rejected', label: 'Đóng phí tham dự bị từ chối', description: 'Admin từ chối đóng phí tham dự' },
    { value: 'confirmed', label: 'Đã xác nhận', description: 'Đăng ký hoàn tất, có thể xuất vé' },
    { value: 'cancel_pending', label: 'Chờ hủy', description: 'Đang chờ xử lý yêu cầu hủy' },
    { value: 'cancelled', label: 'Đã hủy', description: 'Đăng ký đã bị hủy' },
  ];

  const getStatusBadge = (status: RegistrationStatus) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    return statusConfig ? statusConfig.label : status;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Prepare data for API
      const updateData = {
        status: formData.status,
        notes: formData.notes,
        registrants: formData.registrants,
      };

      const response = await fetch(`/api/admin/registration-manager/registrations/${registration.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Update failed');
      }

      toast.success("Cập nhật đăng ký thành công!");
      onSave();
      
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra khi cập nhật đăng ký");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      status: value as RegistrationStatus
    }));
  };

  const handleNotesChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      notes: value
    }));
  };

  const handleRegistrantChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      registrants: prev.registrants.map((r, i) => 
        i === index ? { ...r, [field]: value } : r
      )
    }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[95vh] w-[95vw] md:w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            <span className="text-sm md:text-base">Sửa #{registration.invoice_code}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status Update */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold">Trạng thái đăng ký</h3>
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{getStatusBadge(registration.status)}</Badge>
                <span className="text-sm text-muted-foreground">→</span>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="flex-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-muted-foreground">
                {statusOptions.find(s => s.value === formData.status)?.description}
              </p>
            </div>
          </div>

          {/* Registrants Information */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Thông tin người tham gia
            </h3>
            <div className="space-y-3">
              {formData.registrants.map((registrant, index) => (
                <div key={registrant.id} className="border rounded-lg p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    {registrant.is_primary && (
                      <Badge variant="default" className="text-xs">Người chính</Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`registrant_${index}_full_name`} className="text-sm">
                        Họ tên
                      </Label>
                      <Input
                        id={`registrant_${index}_full_name`}
                        value={registrant.full_name}
                        onChange={(e) => handleRegistrantChange(index, 'full_name', e.target.value)}
                        placeholder="Nhập họ tên"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`registrant_${index}_saint_name`} className="text-sm">
                        Tên thánh
                      </Label>
                      <Input
                        id={`registrant_${index}_saint_name`}
                        value={registrant.saint_name}
                        onChange={(e) => handleRegistrantChange(index, 'saint_name', e.target.value)}
                        placeholder="Tên thánh"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`registrant_${index}_phone`} className="text-sm">
                        Số điện thoại
                      </Label>
                      <Input
                        id={`registrant_${index}_phone`}
                        value={registrant.phone}
                        onChange={(e) => handleRegistrantChange(index, 'phone', e.target.value)}
                        placeholder="Số điện thoại"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`registrant_${index}_facebook`} className="text-sm">
                        Facebook
                      </Label>
                      <Input
                        id={`registrant_${index}_facebook`}
                        value={registrant.facebook_link}
                        onChange={(e) => handleRegistrantChange(index, 'facebook_link', e.target.value)}
                        placeholder="https://facebook.com/..."
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm">Ghi chú quản trị</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Thêm ghi chú về đăng ký này..."
              rows={3}
              className="text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse md:flex-row justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="w-full md:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full md:w-auto"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
