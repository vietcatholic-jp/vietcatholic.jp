"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { getAllRoleCategories, type RoleCategory } from "@/lib/role-utils";

interface EventRole {
  id: string;
  name: string;
  description?: string;
}

interface RoleFilterProps {
  roles: EventRole[];
  selectedRoles: string[];
  onRoleChange: (roleIds: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function RoleFilter({
  roles,
  selectedRoles,
  onRoleChange,
  placeholder = "Lọc theo vai trò...",
  className
}: RoleFilterProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Group roles by category for better organization
  const groupedRoles = roles.reduce((acc, role) => {
    // Simple categorization based on role name
    let category: RoleCategory = 'Tham gia';
    const roleName = role.name.toLowerCase();
    
    if (roleName.includes('ban tổ chức') || roleName.includes('organizer') || roleName.includes('cốt cán')) {
      category = 'Tổ chức';
    } else if (roleName.includes('ban ') || roleName.includes('volunteer') || roleName.includes('tình nguyện')) {
      category = 'Tình nguyện';
    } else if (roleName.includes('diễn giả') || roleName.includes('speaker') || roleName.includes('nghệ sĩ')) {
      category = 'Đặc biệt';
    }
    
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(role);
    return acc;
  }, {} as Record<RoleCategory, EventRole[]>);

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchValue.toLowerCase()))
  );

  const handleRoleToggle = (roleId: string) => {
    const newSelectedRoles = selectedRoles.includes(roleId)
      ? selectedRoles.filter(id => id !== roleId)
      : [...selectedRoles, roleId];
    onRoleChange(newSelectedRoles);
  };

  const clearAll = () => {
    onRoleChange([]);
  };

  const selectedRoleNames = roles
    .filter(role => selectedRoles.includes(role.id))
    .map(role => role.name);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between min-w-[200px]"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {selectedRoles.length === 0 ? (
                placeholder
              ) : selectedRoles.length === 1 ? (
                selectedRoleNames[0]
              ) : (
                `${selectedRoles.length} vai trò đã chọn`
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput 
              placeholder="Tìm kiếm vai trò..." 
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>Không tìm thấy vai trò nào.</CommandEmpty>
              
              {/* Show all roles if searching */}
              {searchValue ? (
                <CommandGroup>
                  {filteredRoles.map((role) => (
                    <CommandItem
                      key={role.id}
                      value={role.name}
                      onSelect={() => handleRoleToggle(role.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedRoles.includes(role.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{role.name}</div>
                        {role.description && (
                          <div className="text-xs text-muted-foreground">
                            {role.description}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : (
                /* Show grouped roles when not searching */
                Object.entries(groupedRoles).map(([category, categoryRoles]) => (
                  <CommandGroup key={category} heading={category}>
                    {categoryRoles.map((role) => (
                      <CommandItem
                        key={role.id}
                        value={role.name}
                        onSelect={() => handleRoleToggle(role.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedRoles.includes(role.id) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{role.name}</div>
                          {role.description && (
                            <div className="text-xs text-muted-foreground">
                              {role.description}
                            </div>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))
              )}
              
              {/* Clear all option */}
              {selectedRoles.length > 0 && (
                <CommandGroup>
                  <CommandItem onSelect={clearAll} className="text-destructive">
                    Xóa tất cả bộ lọc
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected roles badges */}
      {selectedRoles.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedRoleNames.slice(0, 3).map((roleName) => (
            <Badge key={roleName} variant="secondary" className="text-xs">
              {roleName}
            </Badge>
          ))}
          {selectedRoles.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{selectedRoles.length - 3} khác
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

// Simplified version for basic filtering
export function SimpleRoleFilter({
  roles,
  selectedRole,
  onRoleChange,
  placeholder = "Tất cả vai trò",
  className
}: {
  roles: EventRole[];
  selectedRole: string | null;
  onRoleChange: (roleId: string | null) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <select
      value={selectedRole || ""}
      onChange={(e) => onRoleChange(e.target.value || null)}
      className={cn(
        "px-3 py-2 border border-input bg-background rounded-md text-sm",
        className
      )}
    >
      <option value="">{placeholder}</option>
      {roles.map((role) => (
        <option key={role.id} value={role.id}>
          {role.name}
        </option>
      ))}
    </select>
  );
}
