// Team Management Types and Interfaces

export interface MyTeamInfo {
  id: string;
  name: string;
  capacity: number;
  description?: string;
  leader_id: string;
  sub_leader_id?: string;
  created_at: string;
  updated_at: string;
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

export interface TeamMember {
  id: string;
  full_name: string;
  gender: 'male' | 'female';
  age_group: 'under_18' | '18_25' | '26_35' | '36_50' | 'over_50';
  province: string;
  diocese: string;
  email?: string;
  phone?: string;
  facebook_link?: string;
  portrait_url?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  registration?: TeamMemberRegistration;
  event_role?: EventRole;
}

export interface TeamMemberRegistration {
  id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'report_paid' | 'confirm_paid';
  invoice_code?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface EventRole {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface TeamStatistics {
  total_members: number;
  confirmed_members: number;
  male_members: number;
  female_members: number;
  age_groups: {
    under_18: number;
    '18_25': number;
    '26_35': number;
    '36_50': number;
    over_50: number;
  };
  status_breakdown: {
    pending: number;
    confirmed: number;
    report_paid: number;
    confirm_paid: number;
  };
}

export interface MyTeamResponse {
  success: boolean;
  data?: {
    team: MyTeamInfo;
    members: TeamMember[];
    statistics: TeamStatistics;
  };
  error?: string;
  message?: string;
}

// Error Message Constants
export const TEAM_MANAGEMENT_ERRORS = {
  UNAUTHORIZED: 'Bạn không có quyền truy cập chức năng này',
  NOT_TEAM_LEADER: 'Bạn không phải là trưởng nhóm hoặc thư ký của nhóm nào',
  TEAM_NOT_FOUND: 'Không tìm thấy thông tin nhóm',
  MEMBERS_NOT_FOUND: 'Không tìm thấy thành viên nào trong nhóm',
  INVALID_ROLE: 'Vai trò không hợp lệ',
  DATABASE_ERROR: 'Lỗi cơ sở dữ liệu',
  NETWORK_ERROR: 'Lỗi kết nối mạng',
  UNKNOWN_ERROR: 'Đã xảy ra lỗi không xác định',
} as const;

// Success Message Constants
export const TEAM_MANAGEMENT_SUCCESS = {
  DATA_LOADED: 'Tải dữ liệu thành công',
  MEMBER_UPDATED: 'Cập nhật thông tin thành viên thành công',
  TEAM_UPDATED: 'Cập nhật thông tin nhóm thành công',
} as const;

// Loading State Constants
export const TEAM_MANAGEMENT_LOADING = {
  LOADING_TEAM: 'Đang tải thông tin nhóm...',
  LOADING_MEMBERS: 'Đang tải danh sách thành viên...',
  LOADING_STATISTICS: 'Đang tải thống kê...',
  UPDATING_MEMBER: 'Đang cập nhật thông tin thành viên...',
  UPDATING_TEAM: 'Đang cập nhật thông tin nhóm...',
} as const;

// Type Guards
export function isMyTeamResponse(obj: unknown): obj is MyTeamResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'success' in obj &&
    typeof (obj as MyTeamResponse).success === 'boolean'
  );
}

export function isTeamMember(obj: unknown): obj is TeamMember {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'full_name' in obj &&
    'gender' in obj &&
    'age_group' in obj &&
    typeof (obj as TeamMember).id === 'string' &&
    typeof (obj as TeamMember).full_name === 'string'
  );
}

export function isMyTeamInfo(obj: unknown): obj is MyTeamInfo {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'capacity' in obj &&
    'leader_id' in obj &&
    typeof (obj as MyTeamInfo).id === 'string' &&
    typeof (obj as MyTeamInfo).name === 'string' &&
    typeof (obj as MyTeamInfo).capacity === 'number'
  );
}

// Utility Types
export type TeamMemberStatus = TeamMemberRegistration['status'];
export type AgeGroup = TeamMember['age_group'];
export type Gender = TeamMember['gender'];

// API Response Types
export type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  message?: string;
};

// Component Props Types
export interface TeamOverviewProps {
  team: MyTeamInfo;
  statistics: TeamStatistics;
}

export interface MemberListProps {
  members: unknown[];
  totalMembers: number;
  onMemberSelect?: (member: TeamMember) => void;
  userRole?: string;
  canEdit?: boolean;
}

export interface MemberCardProps {
  member: TeamMember;
  onViewDetails?: (member: TeamMember) => void;
  onEdit?: (member: TeamMember) => void;
}

export interface MemberDetailModalProps {
  member: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (member: TeamMember) => void;
}

// Search and Filter Types
export interface MemberSearchFilters {
  searchTerm: string;
  statusFilter: TeamMemberStatus | 'all';
  genderFilter: Gender | 'all';
  ageGroupFilter: AgeGroup | 'all';
  roleFilter: string | 'all';
}

export interface MemberSortOptions {
  field: 'name' | 'created_at' | 'status' | 'role';
  direction: 'asc' | 'desc';
}


