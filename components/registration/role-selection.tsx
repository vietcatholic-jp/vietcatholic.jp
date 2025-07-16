"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCog } from "lucide-react";
import { EventParticipationRole, EventRole } from "@/lib/types";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface RoleSelectionProps {
  selectedRole: EventParticipationRole;
  onRoleSelect: (role: EventParticipationRole) => void;
  onContinue: () => void;
}

export function RoleSelection({ selectedRole, onRoleSelect, onContinue }: RoleSelectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<'participant' | 'organization' | null>(null);
  const [eventRoles, setEventRoles] = useState<EventRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchEventRoles = async () => {
      try {
        // First, get the active event
        const { data: activeEvent, error: eventError } = await supabase
          .from('event_configs')
          .select('id')
          .eq('is_active', true)
          .single();

        if (eventError) {
          console.error('Error fetching active event:', eventError);
          setIsLoading(false);
          return;
        }

        // Then fetch roles for this event
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
      } catch (error) {
        console.error('Error in fetchEventRoles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventRoles();
  }, [supabase]);

  // Set initial category based on selected role
  useEffect(() => {
    if (selectedRole === 'participant') {
      setSelectedCategory('participant');
    } else if (selectedRole && selectedRole !== 'participant') {
      setSelectedCategory('organization');
    }
  }, [selectedRole]);

  // Handle category selection
  const handleCategorySelect = (category: 'participant' | 'organization') => {
    setSelectedCategory(category);
    if (category === 'participant') {
      onRoleSelect('participant');
    } else {
      // Reset role when switching to organization - don't set to 'organization'
      // Let user select a specific role
    }
  };

  // Handle specific role selection for organization members
  const handleOrganizationRoleSelect = (roleId: string) => {
    onRoleSelect(roleId as EventParticipationRole);
  };

  // Group roles by team based on their names
  const groupRolesByTeam = () => {
    const teams: { [key: string]: EventRole[] } = {};
    
    eventRoles.forEach(role => {
      let teamName = 'Khác'; // Default category
      
      if (role.name.includes('Truyền thông')) {
        teamName = 'Ban Truyền thông';
      } else if (role.name.includes('Sinh hoạt')) {
        teamName = 'Ban Sinh hoạt';
      } else if (role.name.includes('Kỷ luật')) {
        teamName = 'Ban Kỷ luật';
      } else if (role.name.includes('Hậu cần')) {
        teamName = 'Ban Hậu cần';
      } else if (role.name.includes('Phụng vụ')) {
        teamName = 'Ban Phụng vụ';
      } else if (role.name.includes('An ninh')) {
        teamName = 'Ban An ninh';
      } else if (role.name.includes('Thư ký')) {
        teamName = 'Ban Thư ký';
      } else if (role.name.includes('Ẩm thực')) {
        teamName = 'Ban Ẩm thực';
      } else if (role.name.includes('Y tế')) {
        teamName = 'Ban Y tế';
      } else if (role.name.includes('Âm thanh')) {
        teamName = 'Ban Âm thanh & Ánh sáng';
      } else if (role.name.includes('nhóm')) {
        teamName = 'Ban Điều phối';
      } else if (role.name.includes('tổ chức')) {
        teamName = 'Ban Tổ chức';
      }
      
      if (!teams[teamName]) {
        teams[teamName] = [];
      }
      teams[teamName].push(role);
    });
    
    // Sort roles within each team by hierarchy (leader, sub-leader, member)
    Object.keys(teams).forEach(teamName => {
      teams[teamName].sort((a, b) => {
        const getOrder = (name: string) => {
          if (name.includes('Trưởng')) return 0;
          if (name.includes('Phó')) return 1;
          if (name.includes('Thành viên')) return 2;
          return 3;
        };
        return getOrder(a.name) - getOrder(b.name);
      });
    });
    
    return teams;
  };

  const teamGroups = groupRolesByTeam();

  // Get display name for selected role
  const getSelectedRoleDisplay = () => {
    if (selectedRole === 'participant') return 'Người tham gia';
    if (!selectedRole || selectedRole === '') return 'Chưa chọn';
    const role = eventRoles.find(r => r.id === selectedRole);
    return role ? role.name : 'Chưa chọn';
  };

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

      {/* Step 1: Category Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className={`cursor-pointer transition-all ${selectedCategory === 'participant' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
          onClick={() => handleCategorySelect('participant')}
        >
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-lg">Người tham gia</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Tham gia sự kiện như một người tham dự thông thường
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${selectedCategory === 'organization' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
          onClick={() => handleCategorySelect('organization')}
        >
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <UserCog className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-lg">Thành viên Ban tổ chức</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Tham gia với vai trò cụ thể trong ban tổ chức, các ban
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Step 2: Organization Role Selection */}
      {selectedCategory === 'organization' && (
        <>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Đang tải vai trò...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Chọn ban và vai trò cụ thể</CardTitle>
                  <p className="text-sm text-muted-foreground">
                Chọn ban bạn muốn tham gia và vai trò của bạn trong ban đó
              </p>
            </CardHeader>
            <CardContent>
              {Object.entries(teamGroups).map(([teamName, roles]) => (
                <div key={teamName} className="mb-6 last:mb-0">
                  <h4 className="font-medium text-base mb-3 pb-2 border-b text-primary">
                    {teamName}
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {roles.map((role) => (
                      <Button
                        key={role.id}
                        variant={selectedRole === role.id ? "default" : "outline"}
                        onClick={() => handleOrganizationRoleSelect(role.id)}
                        className="h-auto p-3 flex flex-col items-start justify-start space-y-1 text-left"
                      >
                        <div className="font-medium text-sm">{role.name}</div>
                        {role.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2 text-wrap">
                              {role.description}
                            </p>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(teamGroups).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Chưa có vai trò nào được thiết lập cho sự kiện này.</p>
                  <p className="text-sm">Vui lòng liên hệ ban tổ chức để biết thêm thông tin.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        )}
        </>
      )}

      {/* Selected role indicator */}
      {selectedRole && (
        <div className="flex justify-center py-4 border rounded-lg bg-primary/5">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Bạn đã chọn: <span className="font-medium text-primary">
                {getSelectedRoleDisplay()}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Floating Continue Button */}
      {selectedRole && selectedRole !== '' && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white rounded-full shadow-lg border border-gray-200 px-6 py-3">
            <Button 
              onClick={onContinue}
              size="lg"
              className="min-w-[200px] rounded-full"
            >
              {selectedRole === 'participant' ? 'Tiếp tục →' : 'Tiếp tục đăng ký →'}
            </Button>
          </div>
        </div>
      )}

      {/* Spacer to prevent content from being hidden behind floating button */}
      <div className="h-20"></div>

    </div>
  );
}
