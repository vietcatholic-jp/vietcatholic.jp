"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Users, Filter, X, BarChart3 } from "lucide-react";
import { StreamlinedRoleFilter } from "./streamlined-role-filter";
import { StreamlinedTeamFilter } from "./streamlined-team-filter";
import { getEventRoleCategory, RoleCategory } from "@/lib/role-utils";

interface Registrant {
  id: string;
  full_name: string;
  saint_name?: string;
  portrait_url?: string;
  event_role?: {
    name: string;
    description?: string;
  };
  registration?: {
    status: string;
    invoice_code: string;
  };
  event_team_id?: string;
}

interface EnhancedFilterTabsProps {
  registrants: Registrant[];
  selectedCategory: RoleCategory | 'all';
  selectedTeam: string | 'all';
  selectedIds: string[];
  onCategoryChange: (category: RoleCategory | 'all') => void;
  onTeamChange: (team: string | 'all') => void;
  onQuickSelectCategory: (category: RoleCategory | 'all') => void;
  onQuickSelectTeam: (team: string | 'all') => void;
}

type FilterType = 'role' | 'team';

export function EnhancedFilterTabs({
  registrants,
  selectedCategory,
  selectedTeam,
  selectedIds,
  onCategoryChange,
  onTeamChange,
  onQuickSelectCategory,
  onQuickSelectTeam
}: EnhancedFilterTabsProps) {
  // Simple state management for active tab
  const [activeTab, setActiveTab] = useState<FilterType>('role');

  // Handle tab change with mutual exclusive logic
  const handleTabChange = (value: FilterType) => {
    setActiveTab(value);

    // Reset the other filter when switching tabs to ensure mutual exclusivity
    if (value === 'role') {
      // Switching to role tab - reset team filter
      onTeamChange('all');
    } else if (value === 'team') {
      // Switching to team tab - reset role filter
      onCategoryChange('all');
    }
  };

  // Get active filter info for display
  const getActiveFilterInfo = () => {
    if (selectedCategory !== 'all') {
      return {
        type: 'role' as const,
        label: selectedCategory,
        icon: <Crown className="h-3 w-3" />,
        count: registrants.filter(r => getEventRoleCategory(r.event_role?.name) === selectedCategory).length
      };
    }
    
    if (selectedTeam !== 'all') {
      // We'll need to get team name from the team filter component
      return {
        type: 'team' as const,
        label: 'Đội đã chọn',
        icon: <Users className="h-3 w-3" />,
        count: registrants.filter(r => r.event_team_id === selectedTeam).length
      };
    }
    
    return null;
  };

  const activeFilter = getActiveFilterInfo();
  const filteredCount = registrants.filter(registrant => {
    if (selectedCategory !== 'all') {
      return getEventRoleCategory(registrant.event_role?.name) === selectedCategory;
    }
    if (selectedTeam !== 'all') {
      return registrant.event_team_id === selectedTeam;
    }
    return true;
  }).length;

  const clearActiveFilter = () => {
    if (selectedCategory !== 'all') {
      onCategoryChange('all');
    }
    if (selectedTeam !== 'all') {
      onTeamChange('all');
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header with Statistics */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium">Lọc danh sách</h3>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                <span>Hiển thị: <strong className="text-foreground">{filteredCount}</strong></span>
              </div>
              <div>
                Đã chọn: <strong className="text-foreground">{selectedIds.length}</strong>
              </div>
            </div>
          </div>

          {/* Active Filter Display */}
          {activeFilter && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1">
                {activeFilter.icon}
                <span>{activeFilter.label}</span>
                <span className="text-xs opacity-75">({activeFilter.count})</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 hover:bg-transparent"
                  onClick={clearActiveFilter}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            </div>
          )}

          {/* Tab Interface */}
          <Tabs
            value={activeTab}
            onValueChange={(value) => handleTabChange(value as FilterType)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 h-auto p-1">
              <TabsTrigger 
                value="role" 
                className="flex items-center gap-2 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Crown className="h-4 w-4" />
                <span>Vai trò</span>
                {selectedCategory !== 'all' && (
                  <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">
                    {registrants.filter(r => getEventRoleCategory(r.event_role?.name) === selectedCategory).length}
                  </Badge>
                )}
              </TabsTrigger>
              
              <TabsTrigger 
                value="team" 
                className="flex items-center gap-2 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Users className="h-4 w-4" />
                <span>Đội</span>
                {selectedTeam !== 'all' && (
                  <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">
                    {registrants.filter(r => r.event_team_id === selectedTeam).length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <TabsContent value="role" className="mt-0 space-y-0">
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Lọc theo vai trò trong sự kiện (BTC, tình nguyện viên, v.v.)
                  </div>
                  <StreamlinedRoleFilter
                    registrants={registrants}
                    selectedCategory={selectedCategory}
                    onCategoryChange={onCategoryChange}
                    selectedIds={selectedIds}
                    onQuickSelect={onQuickSelectCategory}
                  />
                </div>
              </TabsContent>

              <TabsContent value="team" className="mt-0 space-y-0">
                <StreamlinedTeamFilter
                  registrants={registrants}
                  selectedTeam={selectedTeam}
                  onTeamChange={onTeamChange}
                  selectedIds={selectedIds}
                  onQuickSelect={onQuickSelectTeam}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
