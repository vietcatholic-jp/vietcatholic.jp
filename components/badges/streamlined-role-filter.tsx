"use client";

import { useState, useMemo } from "react";
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
import { Crown, UserCheck, Star, Users, Zap, ChevronDown } from "lucide-react";
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

interface StreamlinedRoleFilterProps {
  registrants: Registrant[];
  selectedCategory: RoleCategory | 'all';
  onCategoryChange: (category: RoleCategory | 'all') => void;
  selectedIds: string[];
  onQuickSelect: (category: RoleCategory | 'all') => void;
}

const getCategoryIcon = (category: RoleCategory | 'all') => {
  switch (category) {
    case 'Tổ chức':
      return <Crown className="h-4 w-4 text-yellow-600" />;
    case 'Tình nguyện':
      return <UserCheck className="h-4 w-4 text-blue-600" />;
    case 'Đặc biệt':
      return <Star className="h-4 w-4 text-purple-600" />;
    case 'Tham gia':
      return <Users className="h-4 w-4 text-green-600" />;
    default:
      return <Users className="h-4 w-4 text-muted-foreground" />;
  }
};

const getCategoryLabel = (category: RoleCategory | 'all') => {
  if (category === 'all') return 'Tất cả vai trò';
  return category;
};

export function StreamlinedRoleFilter({
  registrants,
  selectedCategory,
  onCategoryChange,
  selectedIds,
  onQuickSelect
}: StreamlinedRoleFilterProps) {
  const [isQuickSelectOpen, setIsQuickSelectOpen] = useState(false);

  // Calculate statistics for each category
  const categoryStats = useMemo(() => {
    const stats: Record<RoleCategory | 'all', { total: number; selected: number }> = {
      'all': { total: registrants.length, selected: selectedIds.length },
      'Tổ chức': { total: 0, selected: 0 },
      'Tình nguyện': { total: 0, selected: 0 },
      'Đặc biệt': { total: 0, selected: 0 },
      'Tham gia': { total: 0, selected: 0 }
    };

    registrants.forEach(registrant => {
      const category = getEventRoleCategory(registrant.event_role?.name);
      stats[category].total++;
      if (selectedIds.includes(registrant.id)) {
        stats[category].selected++;
      }
    });

    return stats;
  }, [registrants, selectedIds]);

  // Order categories with BTC (Tổ chức) first
  const orderedCategories: (RoleCategory | 'all')[] = [
    'all',
    'Tổ chức', // BTC first as requested
    'Tình nguyện',
    'Đặc biệt',
    'Tham gia'
  ];

  const handleQuickSelect = (category: RoleCategory | 'all') => {
    onQuickSelect(category);
    setIsQuickSelectOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* Main Filter Dropdown */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="h-10">
              <div className="flex items-center gap-2">
                {getCategoryIcon(selectedCategory)}
                <SelectValue placeholder="Chọn vai trò" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {orderedCategories.map(category => (
                <SelectItem key={category} value={category}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(category)}
                      <span>{getCategoryLabel(category)}</span>
                    </div>
                    <Badge variant="outline" className="ml-3">
                      {categoryStats[category].total}
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
          <PopoverContent className="w-72" align="end">
            <div className="space-y-3">
              <div className="font-medium text-sm">Chọn nhanh theo vai trò</div>
              
              <div className="space-y-2">
                {orderedCategories.map(category => {
                  const stats = categoryStats[category];
                  const isDisabled = stats.total === 0;
                  
                  return (
                    <div key={category} className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getCategoryIcon(category)}
                        <span className="font-medium text-sm truncate">
                          {getCategoryLabel(category)}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {stats.selected}/{stats.total}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuickSelect(category)}
                        disabled={isDisabled}
                        className="h-7 px-2 text-xs"
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
      {selectedCategory !== 'all' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            {getCategoryIcon(selectedCategory)}
            <span>Đang hiển thị:</span>
            <strong className="text-foreground">
              {categoryStats[selectedCategory].total} người
            </strong>
          </div>
          {categoryStats[selectedCategory].selected > 0 && (
            <div className="flex items-center gap-1">
              <span>•</span>
              <span>Đã chọn:</span>
              <strong className="text-foreground">
                {categoryStats[selectedCategory].selected}
              </strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
