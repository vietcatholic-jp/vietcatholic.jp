/**
 * Utility functions for handling event participation roles
 * Works with the dynamic event_roles table instead of hardcoded enums
 */

export type EventRole = {
  id: string;
  event_config_id?: string;
  name: string;
  description: string | null;
  permissions: Record<string, unknown> | null;
  team_name?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type RoleCategory = 'Tham gia' | 'Tình nguyện' | 'Tổ chức' | 'Đặc biệt';

// Legacy type for backward compatibility
export type EventParticipationRole = string;

/**
 * Gets the display label for an event role
 * If role object is provided, uses the name from database
 * If only role_id is provided, returns a placeholder
 */
export function getEventRoleLabel(role: EventRole | string | null | undefined): string {
  if (!role) return 'Chưa phân vai trò';

  if (typeof role === 'string') {
    // If it's just an ID, we can't determine the label without fetching from DB
    return 'Đang tải...';
  }

  return role.name || 'Chưa xác định';
}

/**
 * Gets the description for an event role
 */
export function getEventRoleDescription(role: EventRole | null | undefined): string {
  if (!role) return 'Người tham gia chưa được phân vai trò cụ thể';
  return role.description || role.name || 'Chưa có mô tả';
}

/**
 * Categorizes event roles based on their name patterns
 * This provides backward compatibility with the old enum-based system
 */
export function getEventRoleCategory(role: EventRole | string | null | undefined): RoleCategory {
  if (!role) return 'Tham gia';

  const roleName = typeof role === 'string' ? role : role.name;
  if (!roleName) return 'Tham gia';

  const lowerName = roleName.toLowerCase();

  // Check for organizer/leadership roles
  if (lowerName.includes('ban tổ chức') ||
      lowerName.includes('organizer') ||
      lowerName.includes('cốt cán') ||
      lowerName.includes('thủ quỹ')) {
    return 'Tổ chức';
  }

  // Check for volunteer roles
  if (lowerName.includes('ban ') ||
      lowerName.includes('volunteer') ||
      lowerName.includes('tình nguyện') ||
      lowerName.includes('trưởng ban') ||
      lowerName.includes('phó ban') ||
      lowerName.includes('thành viên ban')) {
    return 'Tình nguyện';
  }

  // Check for special roles
  if (lowerName.includes('diễn giả') ||
      lowerName.includes('speaker') ||
      lowerName.includes('nghệ sĩ') ||
      lowerName.includes('performer') ||
      lowerName.includes('ca sĩ') ||
      lowerName.includes('nhạc sĩ')) {
    return 'Đặc biệt';
  }

  // Default to participant
  return 'Tham gia';
}

/**
 * Gets all available role categories
 */
export function getAllRoleCategories(): RoleCategory[] {
  return ['Tham gia', 'Tình nguyện', 'Tổ chức', 'Đặc biệt'];
}

/**
 * Gets color class for role category (for badge styling)
 */
export function getRoleCategoryColor(category: RoleCategory): string {
  const colorMap: Record<RoleCategory, string> = {
    'Tham gia': 'bg-blue-100 text-blue-800',
    'Tình nguyện': 'bg-green-100 text-green-800',
    'Tổ chức': 'bg-purple-100 text-purple-800',
    'Đặc biệt': 'bg-orange-100 text-orange-800'
  };
  
  return colorMap[category] || 'bg-gray-100 text-gray-800';
}

/**
 * Checks if a role is a leadership role based on name patterns
 */
export function isLeadershipRole(role: EventRole | string | null | undefined): boolean {
  if (!role) return false;

  const roleName = typeof role === 'string' ? role : role.name;
  if (!roleName) return false;

  const lowerName = roleName.toLowerCase();
  return lowerName.includes('trưởng') ||
         lowerName.includes('phó') ||
         lowerName.includes('leader') ||
         lowerName.includes('cốt cán') ||
         lowerName.includes('thủ quỹ');
}


/**
 * Formats role for display in tables and exports
 */
export function formatRoleForDisplay(role: EventRole | null | undefined): string {
  if (!role) return 'Chưa phân vai trò';
  return role.name;
}

/**
 * Formats role for CSV export (same as display for now)
 */
export function formatRoleForExport(role: EventRole | null | undefined): string {
  return formatRoleForDisplay(role);
}

/**
 * Gets role priority for sorting (leadership roles first)
 */
export function getRolePriority(role: EventRole | null | undefined): number {
  if (!role) return 999;

  const category = getEventRoleCategory(role);
  const isLeader = isLeadershipRole(role);

  // Priority: Leadership Organizer > Organizer > Leadership Volunteer > Volunteer > Special > Participant
  if (category === 'Tổ chức' && isLeader) return 1;
  if (category === 'Tổ chức') return 2;
  if (category === 'Tình nguyện' && isLeader) return 3;
  if (category === 'Tình nguyện') return 4;
  if (category === 'Đặc biệt') return 5;
  return 6; // Tham gia
}

/**
 * Sorts roles by priority
 */
export function sortRolesByPriority(roles: (EventRole | null)[]): (EventRole | null)[] {
  return roles.sort((a, b) => getRolePriority(a) - getRolePriority(b));
}
