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
import { Crown, UserCheck, Star, Users, Filter, X } from "lucide-react";
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
}

interface RoleCategoryFilterProps {
  registrants: Registrant[];
  selectedCategory: RoleCategory | 'all';
  onCategoryChange: (category: RoleCategory | 'all') => void;
  selectedIds: string[];
  onQuickSelect: (category: RoleCategory | 'all') => void;
}

const getCategoryIcon = (category: RoleCategory | 'all') => {
  switch (category) {
    case 'Tổ chức':
      return <Crown className="h-4 w-4" />;
    case 'Tình nguyện':
      return <UserCheck className="h-4 w-4" />;
    case 'Đặc biệt':
      return <Star className="h-4 w-4" />;
    case 'Tham gia':
      return <Users className="h-4 w-4" />;
    default:
      return <Filter className="h-4 w-4" />;
  }
};

const getCategoryLabel = (category: RoleCategory | 'all') => {
  if (category === 'all') return 'Tất cả';
  return category;
};

export function RoleCategoryFilter({
  registrants,
  selectedCategory,
  onCategoryChange,
  selectedIds,
  onQuickSelect
}: RoleCategoryFilterProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

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
    setIsPopoverOpen(false);
  };

  const clearFilter = () => {
    onCategoryChange('all');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {/* Category Dropdown */}
      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <div className="flex items-center gap-2">
            {getCategoryIcon(selectedCategory)}
            <SelectValue placeholder="Chọn loại vai trò" />
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
                <Badge variant="outline" className="ml-2">
                  {categoryStats[category].total}
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
              <h4 className="font-medium">Chọn nhanh theo vai trò</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPopoverOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              {orderedCategories.map(category => (
                <div key={category} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    <span className="font-medium">{getCategoryLabel(category)}</span>
                    <Badge variant="outline">
                      {categoryStats[category].selected}/{categoryStats[category].total}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickSelect(category)}
                    disabled={categoryStats[category].total === 0}
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
      {selectedCategory !== 'all' && (
        <Button variant="ghost" size="sm" onClick={clearFilter}>
          <X className="h-4 w-4 mr-2" />
          Xóa bộ lọc
        </Button>
      )}

      {/* Selected Category Badge */}
      {selectedCategory !== 'all' && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            {getCategoryIcon(selectedCategory)}
            {getCategoryLabel(selectedCategory)}
            <span className="ml-1">
              ({categoryStats[selectedCategory].total} người)
            </span>
          </Badge>
        </div>
      )}
    </div>
  );
}
