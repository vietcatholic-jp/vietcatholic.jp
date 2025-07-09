"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Camera, 
  Truck, 
  Church, 
  Shield, 
  UserCheck, 
  ChefHat,
  Crown,
  MapPin,
  Mic,
  Music
} from "lucide-react";
import { EventParticipationRole, EVENT_PARTICIPATION_ROLES } from "@/lib/types";

interface RoleSelectionProps {
  selectedRole: EventParticipationRole;
  onRoleSelect: (role: EventParticipationRole) => void;
  onContinue: () => void;
}

const ROLE_ICONS: Record<EventParticipationRole, React.ComponentType<{ className?: string }>> = {
  participant: Users,
  volunteer_media: Camera,
  volunteer_logistics: Truck,
  volunteer_liturgy: Church,
  volunteer_security: Shield,
  volunteer_registration: UserCheck,
  volunteer_catering: ChefHat,
  organizer_core: Crown,
  organizer_regional: MapPin,
  speaker: Mic,
  performer: Music,
};

const ROLE_CATEGORIES = [
  {
    title: "Tham dự viên",
    roles: ['participant'] as EventParticipationRole[],
    color: "bg-blue-50 border-blue-200"
  },
  {
    title: "Đội ngũ thành viên các ban",
    roles: [
      'volunteer_media',
      'volunteer_logistics', 
      'volunteer_liturgy',
      'volunteer_security',
      'volunteer_registration',
      'volunteer_catering',
      'performer', 'speaker'
    ] as EventParticipationRole[],
    color: "bg-green-50 border-green-200"
  },
  {
    title: "Ban Tổ chức",
    roles: ['organizer_core', 'organizer_regional'] as EventParticipationRole[],
    color: "bg-purple-50 border-purple-200"
  }
];

export function RoleSelection({ selectedRole, onRoleSelect, onContinue }: RoleSelectionProps) {
  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
            1
          </div>
          <span className="text-sm font-medium text-primary">Chọn vai trò</span>
        </div>
        <div className="h-px bg-gray-300 w-8"></div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">
            2
          </div>
          <span className="text-sm text-gray-500">Điền thông tin</span>
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Chào mừng đến với Đại hội Công giáo!</h2>
        <p className="text-muted-foreground">
          Bạn tham gia sự kiện với vai trò gì? Điều này giúp chúng tôi chuẩn bị tốt hơn cho bạn.
        </p>
      </div>

      {/* Continue button at top when role is selected */}
      {selectedRole && (
        <div className="flex justify-center py-4 border rounded-lg bg-primary/5">
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Bạn đã chọn: <span className="font-medium text-primary">
                {EVENT_PARTICIPATION_ROLES.find(r => r.value === selectedRole)?.label}
              </span>
            </p>
            <Button 
              onClick={onContinue}
              size="lg"
              className="min-w-[200px]"
            >
              Tiếp tục đăng ký →
            </Button>
          </div>
        </div>
      )}

      {ROLE_CATEGORIES.map((category) => (
        <Card key={category.title} className={category.color}>
          <CardHeader>
            <CardTitle className="text-lg">{category.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {category.roles.map((role) => {
                const roleInfo = EVENT_PARTICIPATION_ROLES.find(r => r.value === role)!;
                const Icon = ROLE_ICONS[role];
                const isSelected = selectedRole === role;
                
                return (
                  <div
                    key={role}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                      isSelected 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => onRoleSelect(role)}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className={`h-6 w-6 mt-1 ${isSelected ? 'text-primary' : 'text-gray-600'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className={`font-medium ${isSelected ? 'text-primary' : 'text-gray-900'}`}>
                            {roleInfo.label}
                          </h3>
                          {isSelected && (
                            <Badge variant="default" className="text-xs">
                              Đã chọn
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {roleInfo.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-center pt-4">
        <Button 
          onClick={onContinue}
          size="lg"
          disabled={!selectedRole}
          className="min-w-[200px]"
          variant={selectedRole ? "default" : "outline"}
        >
          {selectedRole ? "Tiếp tục đăng ký →" : "Vui lòng chọn vai trò"}
        </Button>
      </div>
    </div>
  );
}
