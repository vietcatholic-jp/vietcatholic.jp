"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Crown, Users, Filter, X, Loader2 } from "lucide-react";

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

interface Team {
  id: string;
  name: string;
  description?: string;
  member_count: number;
  leader?: {
    id: string;
    full_name: string;
    email: string;
  };
  sub_leader?: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface TeamFilterProps {
  registrants: Registrant[];
  selectedTeam: string | 'all';
  onTeamChange: (team: string | 'all') => void;
  selectedIds: string[];
  onQuickSelect: (team: string | 'all') => void;
}

// Utility function to check if a team is BTC (Ban Tổ chức)
const isBTCTeam = (teamName: string): boolean => {
  const lowerName = teamName.toLowerCase();
  return lowerName.includes('ban tổ chức') ||
         lowerName.includes('organizer') ||
         lowerName.includes('cốt cán') ||
         lowerName.includes('btc') ||
         lowerName.includes('tổ chức');
};

export function TeamFilter({
  registrants,
  selectedTeam,
  onTeamChange,
  selectedIds,
  onQuickSelect
}: TeamFilterProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch teams from API
  useEffect(() => {
    const fetchTeams = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/teams');
        if (!response.ok) {
          throw new Error('Failed to fetch teams');
        }
        const data = await response.json();
        setTeams(data.teams || []);
      } catch (error) {
        console.error('Error fetching teams:', error);
        setTeams([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, []);

  // Calculate statistics for each team
  const teamStats = useMemo(() => {
    const stats: Record<string | 'all', { total: number; selected: number }> = {
      'all': { total: registrants.length, selected: selectedIds.length },
    };

    // Initialize stats for all teams
    teams.forEach(team => {
      stats[team.id] = { total: 0, selected: 0 };
    });

    // Count registrants for each team
    registrants.forEach(registrant => {
      if (registrant.event_team_id && stats[registrant.event_team_id]) {
        stats[registrant.event_team_id].total++;
        if (selectedIds.includes(registrant.id)) {
          stats[registrant.event_team_id].selected++;
        }
      }
    });

    return stats;
  }, [registrants, selectedIds, teams]);

  // Sort teams with BTC first
  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      const aIsBTC = isBTCTeam(a.name);
      const bIsBTC = isBTCTeam(b.name);
      
      // BTC teams first
      if (aIsBTC && !bIsBTC) return -1;
      if (!aIsBTC && bIsBTC) return 1;
      
      // Then alphabetical
      return a.name.localeCompare(b.name);
    });
  }, [teams]);

  const handleQuickSelect = (teamId: string | 'all') => {
    onQuickSelect(teamId);
    setIsPopoverOpen(false);
  };

  const clearFilter = () => {
    onTeamChange('all');
  };

  const getSelectedTeamName = () => {
    if (selectedTeam === 'all') return 'Tất cả';
    const team = teams.find(t => t.id === selectedTeam);
    return team?.name || 'Không xác định';
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Đang tải đội...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {/* Team Dropdown */}
      <Select value={selectedTeam} onValueChange={onTeamChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <SelectValue placeholder="Chọn đội" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Tất cả</span>
              </div>
              <Badge variant="outline" className="ml-2">
                {teamStats['all'].total}
              </Badge>
            </div>
          </SelectItem>
          {sortedTeams.map(team => (
            <SelectItem key={team.id} value={team.id}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {isBTCTeam(team.name) && <Crown className="h-4 w-4 text-yellow-600" />}
                  <span className="truncate max-w-[150px]">{team.name}</span>
                </div>
                <Badge variant="outline" className="ml-2">
                  {teamStats[team.id]?.total || 0}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Quick Select Popover */}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Chọn nhanh
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Chọn nhanh theo đội</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPopoverOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {/* All option */}
              <div className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="font-medium">Tất cả</span>
                  <Badge variant="outline">
                    {teamStats['all'].selected}/{teamStats['all'].total}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect('all')}
                >
                  Chọn tất cả
                </Button>
              </div>

              {/* Team options */}
              {sortedTeams.map(team => (
                <div key={team.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isBTCTeam(team.name) && <Crown className="h-4 w-4 text-yellow-600 flex-shrink-0" />}
                    <span className="font-medium truncate">{team.name}</span>
                    <Badge variant="outline" className="flex-shrink-0">
                      {teamStats[team.id]?.selected || 0}/{teamStats[team.id]?.total || 0}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickSelect(team.id)}
                    disabled={(teamStats[team.id]?.total || 0) === 0}
                    className="flex-shrink-0 ml-2"
                  >
                    Chọn tất cả
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear Filter Button */}
      {selectedTeam !== 'all' && (
        <Button variant="ghost" size="sm" onClick={clearFilter}>
          <X className="h-4 w-4 mr-2" />
          Xóa bộ lọc
        </Button>
      )}

      {/* Selected Team Badge */}
      {selectedTeam !== 'all' && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            {isBTCTeam(getSelectedTeamName()) && <Crown className="h-3 w-3 text-yellow-600" />}
            <Users className="h-3 w-3" />
            {getSelectedTeamName()}
            <span className="ml-1">
              ({teamStats[selectedTeam]?.total || 0} người)
            </span>
          </Badge>
        </div>
      )}
    </div>
  );
}
