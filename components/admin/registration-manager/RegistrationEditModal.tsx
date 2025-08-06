"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Registration, RegistrationStatus, EventRole, SHIRT_SIZES_PARTICIPANT, SHIRT_SIZES_ORGANIZER, EventConfig } from "@/lib/types";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { 
  Save, 
  X,
  Edit,
  Loader2,
  Users,
  UserCog
} from "lucide-react";

interface RegistrationEditModalProps {
  registration: Registration;
  onClose: () => void;
  onSave: () => void;
}

export function RegistrationEditModal({ registration, onClose, onSave }: RegistrationEditModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [eventRoles, setEventRoles] = useState<EventRole[]>([]);
  const [eventConfig, setEventConfig] = useState<EventConfig | null>(null);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const supabase = createClient();
  
  const [formData, setFormData] = useState({
    status: registration.status,
    notes: registration.notes || "",
    registrants: registration.registrants?.map(r => ({
      id: r.id,
      full_name: r.full_name,
      saint_name: r.saint_name || "",
      phone: r.phone || "",
      facebook_link: r.facebook_link || "",
      shirt_size: r.shirt_size || null,
      notes: r.notes || "",
      is_primary: r.is_primary,
      second_day_only: r.second_day_only || false,
      selected_attendance_day: r.selected_attendance_day || "",
      event_role_id: r.event_role_id || null
    })) || [],
  });

  // Fetch active event config and roles
  useEffect(() => {
    const fetchEventData = async () => {
      setIsLoadingRoles(true);
      try {
        // Fetch event config
        const response = await fetch('/api/admin/events');
        if (response.ok) {
          const { events } = await response.json();
          const activeEvent = events?.find((event: EventConfig) => event.is_active);
          setEventConfig(activeEvent || null);
          
          // Fetch event roles if we have an active event
          if (activeEvent) {
            const { data: roles, error: rolesError } = await supabase
              .from('event_roles')
              .select('*')
              .eq('event_config_id', activeEvent.id)
              .order('name');

            if (rolesError) {
              console.error('Error fetching event roles:', rolesError);
            } else {
              setEventRoles(roles || []);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch event data:', error);
      } finally {
        setIsLoadingRoles(false);
      }
    };

    fetchEventData();
  }, [supabase]);

  const statusOptions: { value: RegistrationStatus; label: string; description: string }[] = [
    { value: 'pending', label: 'Chờ đóng phí tham dự', description: 'Đang chờ người dùng đóng phí tham dự' },
    { value: 'report_paid', label: 'Đã báo đóng phí tham dự', description: 'Người dùng đã gửi biên lai' },
    { value: 'confirm_paid', label: 'Đã xác nhận đóng phí tham dự', description: 'Admin xác nhận đóng phí tham dự đúng' },
    { value: 'payment_rejected', label: 'Đóng phí tham dự bị từ chối', description: 'Admin từ chối đóng phí tham dự' },
    { value: 'confirmed', label: 'Đã xác nhận', description: 'Đăng ký hoàn tất, có thể xuất vé' },
    { value: 'cancel_pending', label: 'Chờ hủy', description: 'Đang chờ xử lý yêu cầu hủy' },
    { value: 'cancel_accepted', label: 'Đã chấp nhận hủy', description: 'Yêu cầu hủy đã được chấp nhận' },
    { value: 'cancel_rejected', label: 'Đã từ chối hủy', description: 'Yêu cầu hủy đã bị từ chối' },
    { value: 'cancel_processed', label: 'Đã hoàn tiền', description: 'Đăng ký đã được hoàn tiền' },
    { value: 'donation', label: 'Đã chuyển thành quyên góp', description: 'Đăng ký đã được chuyển thành quyên góp' },
    { value: 'checked_in', label: 'Đã check-in', description: 'Người dùng đã check-in sự kiện' },
    { value: 'checked_out', label: 'Đã check-out', description: 'Người dùng đã check-out sự kiện' },
    { value: 'temp_confirmed', label: 'Đã xác nhận (thanh toán sau)', description: 'Đăng ký tạm thời xác nhận, thanh toán sau' },
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

  const handleRegistrantChange = (index: number, field: string, value: string | null) => {
    setFormData(prev => ({
      ...prev,
      registrants: prev.registrants.map((r, i) => 
        i === index ? { ...r, [field]: value } : r
      )
    }));
  };

  // Get role display name
  const getRoleDisplayName = (roleId: string | null) => {
    if (!roleId) return 'Tham dự viên';
    const role = eventRoles.find(r => r.id === roleId);
    return role ? role.name : 'Tham dự viên';
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
                  <div className="space-y-2">
                      <Label htmlFor={`registrant_${index}_shirt_size`}>Size áo *</Label>
                      <select
                        id={`registrant_${index}_shirt_size`}
                        value={registrant.shirt_size || ""}
                        onChange={(e) => handleRegistrantChange(index, 'shirt_size', e.target.value || null)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Chọn size</option>
                        {
                        (registrant.event_role_id === null) ? (
                          SHIRT_SIZES_PARTICIPANT.map((size) => (
                            <option key={size.value} value={size.value}>
                              {size.label}
                            </option>
                          ))
                        ) : (
                          SHIRT_SIZES_ORGANIZER.map((size) => (
                            <option key={size.value} value={size.value}>
                              {size.label}
                            </option>
                          ))
                        )}
                      </select>
                      <p className="text-xs text-muted-foreground">
                          {registrant.event_role_id === null ? "Chọn size áo không phân biệt giới tính.": "Chọn size áo theo cân nặng và giới tính."}
                      </p>
                    </div>
                  
                  {/* Role Selection */}
                  <div>
                    <Label htmlFor={`registrant_${index}_role`} className="text-sm">
                      <UserCog className="h-4 w-4 inline mr-1" />
                      Vai trò
                    </Label>
                    {isLoadingRoles ? (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Đang tải vai trò...</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <select
                          id={`registrant_${index}_role`}
                          value={registrant.event_role_id || ""}
                          onChange={(e) => handleRegistrantChange(index, 'event_role_id', e.target.value || null)}
                          className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                        >
                          <option value="">Tham dự viên</option>
                          {eventRoles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-muted-foreground">
                          Hiện tại: <span className="font-medium">{getRoleDisplayName(registrant.event_role_id)}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {registrant.second_day_only && eventConfig?.start_date && eventConfig?.end_date && (
                        <div className="mt-3 ml-6 space-y-2">
                          <Label className="text-sm font-medium">Chọn ngày tham gia:</Label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id={`registrants.${index}.first_day`}
                                name={`registrants.${index}.attendance_day`}
                                value={eventConfig.start_date}
                                checked={eventConfig.start_date.includes(registrant.selected_attendance_day || 'NONE')}
                                onChange={(e) => handleRegistrantChange(index, 'selected_attendance_day', e.target.value)}
                                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                              <Label htmlFor={`registrants.${index}.first_day`} className="text-sm font-normal">
                                Ngày đầu: {new Date(eventConfig.start_date).toLocaleDateString('vi-VN', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id={`registrants.${index}.second_day`}
                                name={`registrants.${index}.attendance_day`}
                                value={eventConfig.end_date}
                                checked={eventConfig.end_date.includes(registrant.selected_attendance_day || 'NONE')}
                                onChange={(e) => handleRegistrantChange(index, 'selected_attendance_day', e.target.value)}
                                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                              <Label htmlFor={`registrants.${index}.second_day`} className="text-sm font-normal">
                                Ngày cuối: {new Date(eventConfig.end_date).toLocaleDateString('vi-VN', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </Label>
                            </div>
                          </div>
                        </div>
                      )}
                      

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm">Ghi chú</Label>
                    <Textarea
                      id={`registrant_${index}_notes`}
                      value={registrant.notes}
                      disabled={true}
                      onChange={(e) => handleRegistrantChange(index, 'notes', e.target.value)}
                      placeholder="Không có ghi chú nào cho người này"
                      className="text-sm"
                    />
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
