import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  getEventRoleCategory,
  getRoleCategoryColor,
  formatRoleForDisplay,
  getTeamNameFromRole,
  isLeadershipRole,
  type EventRole
} from "@/lib/role-utils";
import { Info } from "lucide-react";

interface RoleBadgeProps {
  role: EventRole | null | undefined;
  className?: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
  size?: "sm" | "default" | "lg";
  showTooltip?: boolean;
  showTeamInfo?: boolean;
}

export function RoleBadge({
  role,
  className,
  variant = "outline",
  size = "default",
  showTooltip = true,
  showTeamInfo = false
}: RoleBadgeProps) {
  if (!role) {
    const badge = (
      <Badge
        variant="outline"
        className={cn("text-gray-600", className)}
      >
        Chưa phân vai trò
      </Badge>
    );

    if (!showTooltip) return badge;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <p>Người tham gia chưa được phân vai trò cụ thể</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const category = getEventRoleCategory(role);
  const colorClass = getRoleCategoryColor(category);
  const roleLabel = formatRoleForDisplay(role);
  const teamName = getTeamNameFromRole(role);
  const isLeader = isLeadershipRole(role);

  // Size classes
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    default: "text-sm px-2.5 py-0.5",
    lg: "text-base px-3 py-1"
  };

  const badge = (
    <Badge
      variant={variant}
      className={cn(
        colorClass,
        sizeClasses[size],
        "font-medium border cursor-help",
        className
      )}
    >
      {roleLabel}
      {showTeamInfo && teamName && (
        <span className="ml-1 opacity-75">({teamName})</span>
      )}
    </Badge>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <div className="font-medium">{roleLabel}</div>
            {role.description && (
              <div className="text-sm">{role.description}</div>
            )}
            <div className="text-xs space-y-1">
              <div><strong>Loại:</strong> {category}</div>
              {teamName && <div><strong>Nhóm:</strong> {teamName}</div>}
              {isLeader && (
                <div className="text-amber-600 font-medium">
                  <Info className="h-3 w-3 inline mr-1" />
                  Vai trò lãnh đạo
                </div>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Specialized variants for different use cases
export function RoleBadgeCompact({ role, className }: { role: EventRole | null | undefined; className?: string }) {
  return <RoleBadge role={role} size="sm" className={className} />;
}

export function RoleBadgeWithCategory({ role, className }: { role: EventRole | null | undefined; className?: string }) {
  if (!role) {
    return <RoleBadge role={role} className={className} />;
  }

  const category = getEventRoleCategory(role);
  const roleLabel = formatRoleForDisplay(role);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <RoleBadge role={role} size="sm" />
      <span className="text-xs text-muted-foreground">({category})</span>
    </div>
  );
}
