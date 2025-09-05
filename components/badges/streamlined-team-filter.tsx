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
import { Crown, Users, Zap, ChevronDown, Loader2 } from "lucide-react";
import { Registrant } from "@/lib/types";

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

interface StreamlinedTeamFilterProps {
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

export function StreamlinedTeamFilter({
  registrants,
  selectedTeam,
  onTeamChange,
  selectedIds,
  onQuickSelect
}: StreamlinedTeamFilterProps) {
  const [isQuickSelectOpen, setIsQuickSelectOpen] = useState(false);
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
        setTeams(data || []);
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
    setIsQuickSelectOpen(false);
  };

  const getSelectedTeamName = () => {
    if (selectedTeam === 'all') return 'Tất cả đội';
    const team = teams.find(t => t.id === selectedTeam);
    return team?.name || 'Không xác định';
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Đang tải danh sách đội...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Filter Dropdown */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Select value={selectedTeam} onValueChange={onTeamChange}>
            <SelectTrigger className="h-10">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <SelectValue placeholder="Chọn đội" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Tất cả đội</span>
                  </div>
                  <Badge variant="outline" className="ml-3">
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
                    <Badge variant="outline" className="ml-3">
                      {teamStats[team.id]?.total || 0}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Select Button */}
        <Popover open={isQuickSelectOpen} onOpenChange={setIsQuickSelectOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="px-3">
              <Zap className="h-4 w-4 mr-1" />
              Nhanh
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-3">
              <div className="font-medium text-sm">Chọn nhanh theo đội</div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {/* All option */}
                <div className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Tất cả đội</span>
                    <Badge variant="secondary" className="text-xs">
                      {teamStats['all'].selected}/{teamStats['all'].total}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickSelect('all')}
                    className="h-7 px-2 text-xs"
                  >
                    Chọn
                  </Button>
                </div>

                {/* Team options */}
                {sortedTeams.map(team => {
                  const stats = teamStats[team.id] || { total: 0, selected: 0 };
                  const isDisabled = stats.total === 0;
                  
                  return (
                    <div key={team.id} className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {isBTCTeam(team.name) && <Crown className="h-4 w-4 text-yellow-600 flex-shrink-0" />}
                        <span className="font-medium text-sm truncate">{team.name}</span>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          {stats.selected}/{stats.total}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuickSelect(team.id)}
                        disabled={isDisabled}
                        className="h-7 px-2 text-xs flex-shrink-0 ml-2"
                      >
                        Chọn
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filter Summary */}
      {selectedTeam !== 'all' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            {isBTCTeam(getSelectedTeamName()) && <Crown className="h-3 w-3 text-yellow-600" />}
            <Users className="h-3 w-3" />
            <span>Đang hiển thị:</span>
            <strong className="text-foreground">
              {teamStats[selectedTeam]?.total || 0} người
            </strong>
          </div>
          {(teamStats[selectedTeam]?.selected || 0) > 0 && (
            <div className="flex items-center gap-1">
              <span>•</span>
              <span>Đã chọn:</span>
              <strong className="text-foreground">
                {teamStats[selectedTeam]?.selected || 0}
              </strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
