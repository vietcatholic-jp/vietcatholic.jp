"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TeamMember } from "@/lib/types/team-management";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { AvatarManager } from "@/components/avatar/avatar-manager";
import { 
  Save, 
  X,
  Edit,
  Loader2,
  User
} from "lucide-react";

interface MemberEditModalProps {
  member: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function MemberEditModal({ member, isOpen, onClose, onSave }: MemberEditModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    facebook_link: "",
    portrait_url: null as string | null,
    saint_name: ""
  });

  // Update form data when member changes
  useEffect(() => {
    if (member) {
      setFormData({
        saint_name: member.saint_name || "",
        full_name: member.full_name || "",
        phone: member.phone || "",
        facebook_link: member.facebook_link || "",
        portrait_url: member.portrait_url || null
      });
    }
  }, [member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    setIsLoading(true);

    try {
      const supabase = createClient();

      // Update registrant record
      const { error } = await supabase
        .from('registrants')
        .update({
          saint_name: formData.saint_name || null,
          full_name: formData.full_name,
          phone: formData.phone || null,
          facebook_link: formData.facebook_link || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', member.id);

      if (error) {
        throw new Error(error.message);
      }

      toast.success("Cập nhật thành viên thành công!");
      onSave();
      
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra khi cập nhật thành viên");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarChange = (newUrl: string | null) => {
    setFormData(prev => ({
      ...prev,
      portrait_url: newUrl
    }));
  };

  const getGenderText = (gender: string) => {
    return gender === 'male' ? 'Nam' : 'Nữ';
  };

  const getAgeGroupText = (ageGroup: string) => {
    switch (ageGroup) {
      case 'under_18':
        return 'Dưới 18 tuổi';
      case '18_25':
        return '18-25 tuổi';
      case '26_35':
        return '26-35 tuổi';
      case '36_50':
        return '36-50 tuổi';
      case 'over_50':
        return 'Trên 50 tuổi';
      default:
        return 'Không xác định';
    }
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[95vh] w-[95vw] md:w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            <span className="text-sm md:text-base">Chỉnh sửa thông tin thành viên</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Member Info Header */}
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              {member.is_primary && (
                <Badge variant="default" className="text-xs">Người đại diện</Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {getGenderText(member.gender)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {getAgeGroupText(member.age_group)}
              </Badge>
            </div>
          </div>

          {/* Avatar Management */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Ảnh đại diện
            </h3>
            <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-md">
              <div className="flex-shrink-0">
                <AvatarManager
                  registrantId={member.id}
                  registrantName={formData.full_name}
                  currentAvatarUrl={formData.portrait_url || undefined}
                  size="lg"
                  editable={true}
                  onAvatarChange={handleAvatarChange}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Ảnh đại diện thành viên</Label>
                <p className="text-xs text-muted-foreground">
                  Nhấp vào ảnh để cập nhật ảnh đại diện
                </p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          
          <div className="space-y-3">
            <h3 className="text-base font-semibold">Thông tin cơ bản</h3>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label htmlFor="saint_name" className="text-sm">
                  Tên thánh
                </Label>
                <Input
                  id="saint_name"
                  value={formData.saint_name}
                  onChange={(e) => handleFieldChange('saint_name', e.target.value)}
                  placeholder="Tên thánh"
                  className="text-sm"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label htmlFor="full_name" className="text-sm">
                  Họ tên *
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleFieldChange('full_name', e.target.value)}
                  placeholder="Nhập họ tên"
                  className="text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold">Thông tin liên lạc</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="phone" className="text-sm">
                  Số điện thoại
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  placeholder="Số điện thoại"
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="facebook_link" className="text-sm">
                  Facebook
                </Label>
                <Input
                  id="facebook_link"
                  value={formData.facebook_link}
                  onChange={(e) => handleFieldChange('facebook_link', e.target.value)}
                  placeholder="https://facebook.com/..."
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Read-only Location Information */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold">Thông tin địa phương</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Tỉnh thành</Label>
                <Input
                  value={member.province}
                  disabled
                  className="text-sm bg-muted/50"
                />
              </div>
              <div>
                <Label className="text-sm">Giáo phận</Label>
                <Input
                  value={member.diocese}
                  disabled
                  className="text-sm bg-muted/50"
                />
              </div>
            </div>
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
