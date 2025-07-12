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
  Music,
  Heart,
  Volume2,
  Target,
  UserCog,
  Activity
} from "lucide-react";
import { EventParticipationRole, EVENT_PARTICIPATION_ROLES } from "@/lib/types";

interface RoleSelectionProps {
  selectedRole: EventParticipationRole;
  onRoleSelect: (role: EventParticipationRole) => void;
  onContinue: () => void;
}

const ROLE_ICONS: Record<EventParticipationRole, React.ComponentType<{ className?: string }>> = {
  participant: Users,
  
  // Media team roles
  volunteer_media_leader: Camera,
  volunteer_media_sub_leader: Camera,
  volunteer_media_member: Camera,
  
  // Activity team roles
  volunteer_activity_leader: Activity,
  volunteer_activity_sub_leader: Activity,
  volunteer_activity_member: Activity,
  
  // Discipline team roles
  volunteer_discipline_leader: Target,
  volunteer_discipline_sub_leader: Target,
  volunteer_discipline_member: Target,
  
  // Logistics team roles
  volunteer_logistics_leader: Truck,
  volunteer_logistics_sub_leader: Truck,
  volunteer_logistics_member: Truck,
  
  // Liturgy team roles
  volunteer_liturgy_leader: Church,
  volunteer_liturgy_sub_leader: Church,
  volunteer_liturgy_member: Church,
  
  // Security team roles
  volunteer_security_leader: Shield,
  volunteer_security_sub_leader: Shield,
  volunteer_security_member: Shield,
  
  // Registration team roles
  volunteer_registration_leader: UserCheck,
  volunteer_registration_sub_leader: UserCheck,
  volunteer_registration_member: UserCheck,
  
  // Catering team roles
  volunteer_catering_leader: ChefHat,
  volunteer_catering_sub_leader: ChefHat,
  volunteer_catering_member: ChefHat,
  
  // Health team roles
  volunteer_health_leader: Heart,
  volunteer_health_sub_leader: Heart,
  volunteer_health_member: Heart,
  
  // Audio Light team roles
  volunteer_audio_light_leader: Volume2,
  volunteer_audio_light_sub_leader: Volume2,
  volunteer_audio_light_member: Volume2,
  
  // Group leadership roles
  volunteer_group_leader: UserCog,
  volunteer_group_sub_leader: UserCog,
  
  // Organizer roles
  organizer_core: Crown,
  organizer_regional: MapPin,
  
  // Special roles
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
    title: "Ban Truyền thông",
    roles: [
      'volunteer_media_leader',
      'volunteer_media_sub_leader',
      'volunteer_media_member'
    ] as EventParticipationRole[],
    color: "bg-green-50 border-green-200"
  },
  {
    title: "Ban Sinh hoạt",
    roles: [
      'volunteer_activity_leader',
      'volunteer_activity_sub_leader',
      'volunteer_activity_member'
    ] as EventParticipationRole[],
    color: "bg-yellow-50 border-yellow-200"
  },
  {
    title: "Ban Kỷ luật",
    roles: [
      'volunteer_discipline_leader',
      'volunteer_discipline_sub_leader',
      'volunteer_discipline_member'
    ] as EventParticipationRole[],
    color: "bg-red-50 border-red-200"
  },
  {
    title: "Ban Hậu cần",
    roles: [
      'volunteer_logistics_leader',
      'volunteer_logistics_sub_leader',
      'volunteer_logistics_member'
    ] as EventParticipationRole[],
    color: "bg-orange-50 border-orange-200"
  },
  {
    title: "Ban Phụng vụ",
    roles: [
      'volunteer_liturgy_leader',
      'volunteer_liturgy_sub_leader',
      'volunteer_liturgy_member'
    ] as EventParticipationRole[],
    color: "bg-purple-50 border-purple-200"
  },
  {
    title: "Ban An ninh",
    roles: [
      'volunteer_security_leader',
      'volunteer_security_sub_leader',
      'volunteer_security_member'
    ] as EventParticipationRole[],
    color: "bg-gray-50 border-gray-200"
  },
  {
    title: "Ban Thư ký",
    roles: [
      'volunteer_registration_leader',
      'volunteer_registration_sub_leader',
      'volunteer_registration_member'
    ] as EventParticipationRole[],
    color: "bg-indigo-50 border-indigo-200"
  },
  {
    title: "Ban Ẩm thực",
    roles: [
      'volunteer_catering_leader',
      'volunteer_catering_sub_leader',
      'volunteer_catering_member'
    ] as EventParticipationRole[],
    color: "bg-pink-50 border-pink-200"
  },
  {
    title: "Ban Y tế",
    roles: [
      'volunteer_health_leader',
      'volunteer_health_sub_leader',
      'volunteer_health_member'
    ] as EventParticipationRole[],
    color: "bg-teal-50 border-teal-200"
  },
  {
    title: "Ban Âm thanh Ánh sáng",
    roles: [
      'volunteer_audio_light_leader',
      'volunteer_audio_light_sub_leader',
      'volunteer_audio_light_member'
    ] as EventParticipationRole[],
    color: "bg-cyan-50 border-cyan-200"
  },
  {
    title: "Trưởng nhóm",
    roles: [
      'volunteer_group_leader',
      'volunteer_group_sub_leader'
    ] as EventParticipationRole[],
    color: "bg-emerald-50 border-emerald-200"
  },
  {
    title: "Ban Tổ chức",
    roles: ['organizer_core', 'organizer_regional'] as EventParticipationRole[],
    color: "bg-violet-50 border-violet-200"
  },
  {
    title: "Vai trò đặc biệt",
    roles: ['speaker'] as EventParticipationRole[],
    color: "bg-amber-50 border-amber-200"
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
        <p className="text-muted-foreground">
          Bạn tham gia sự kiện với vai trò gì?
        </p>
      </div>

      {/* Selected role indicator */}
      {selectedRole && (
        <div className="flex justify-center py-4 border rounded-lg bg-primary/5">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Bạn đã chọn: <span className="font-medium text-primary">
                {EVENT_PARTICIPATION_ROLES.find(r => r.value === selectedRole)?.label}
              </span>
            </p>
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

      {/* Floating Continue Button */}
      {selectedRole && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white rounded-full shadow-lg border border-gray-200 px-6 py-3">
            <Button 
              onClick={onContinue}
              size="lg"
              className="min-w-[200px] rounded-full"
            >
              Tiếp tục đăng ký →
            </Button>
          </div>
        </div>
      )}

      {/* Spacer to prevent content from being hidden behind floating button */}
      {selectedRole && <div className="h-20"></div>}

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
