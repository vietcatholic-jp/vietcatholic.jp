/**
 * Test data fixtures for Teams Assignment testing
 */

export const TEST_USERS = {
  SUPER_ADMIN: {
    email: 'dev.thubv@gmail.com',
    password: '123456',
    role: 'super_admin',
    full_name: 'Test Super Admin'
  },
  EVENT_ORGANIZER: {
    email: 'organizer@test.com',
    password: 'test123',
    role: 'event_organizer',
    full_name: 'Test Event Organizer'
  },
  REGISTRATION_MANAGER: {
    email: 'manager@test.com',
    password: 'test123',
    role: 'registration_manager',
    full_name: 'Test Registration Manager'
  },
  PARTICIPANT: {
    email: 'participant@test.com',
    password: 'test123',
    role: 'participant',
    full_name: 'Test Participant'
  }
} as const;

export const TEST_TEAMS = {
  ALPHA: {
    id: 'team-alpha-001',
    name: 'Đội Alpha',
    description: 'Đội đầu tiên cho thử nghiệm',
    capacity: null,
    current_members: 3,
    leader_id: null,
    deputy_leader_id: null
  },
  BETA: {
    id: 'team-beta-002',
    name: 'Đội Beta',
    description: 'Đội thứ hai cho testing',
    capacity: 10,
    current_members: 0,
    leader_id: null,
    deputy_leader_id: null
  }
} as const;

export const TEST_REGISTRANTS = {
  UNASSIGNED_1: {
    id: 'reg-001',
    full_name: 'HOÀNG VĂN ĐĂNG',
    registration_code: 'DH2025001',
    gender: 'male',
    age: 25,
    province: 'Hà Nội',
    diocese: 'Hà Nội',
    role: 'participant',
    team_id: null
  },
  UNASSIGNED_2: {
    id: 'reg-002',
    full_name: 'NGUYỄN THỊ MAI',
    registration_code: 'DH2025002',
    gender: 'female',
    age: 28,
    province: 'TP. Hồ Chí Minh',
    diocese: 'TP. Hồ Chí Minh',
    role: 'participant',
    team_id: null
  },
  ASSIGNED_1: {
    id: 'reg-003',
    full_name: 'TRẦN VĂN LONG',
    registration_code: 'DH2025003',
    gender: 'male',
    age: 30,
    province: 'Đà Nẵng',
    diocese: 'Đà Nẵng',
    role: 'participant',
    team_id: 'team-alpha-001'
  }
} as const;

export const MOCK_STATS = {
  OVERVIEW: {
    total_teams: 1,
    total_assigned: 3,
    total_unassigned: 18,
    assignment_percentage: 14
  },
  TEAM_DISTRIBUTION: [
    { name: 'Đội Alpha', value: 3 }
  ],
  GENDER_DISTRIBUTION: [
    { name: 'Nam', value: 3 },
    { name: 'Nữ', value: 0 }
  ],
  AGE_DISTRIBUTION: [
    { name: '18-25', value: 1 },
    { name: '26-35', value: 2 },
    { name: '36-45', value: 0 },
    { name: '46+', value: 0 }
  ]
} as const;

export const API_ENDPOINTS = {
  TEAMS_STATS: '/api/admin/teams/stats',
  UNASSIGNED_REGISTRANTS: '/api/admin/registrants/unassigned',
  ASSIGN_TEAM: '/api/admin/registrants/{id}/assign-team',
  REMOVE_TEAM: '/api/admin/registrants/{id}/remove-team',
  BULK_ASSIGN: '/api/admin/registrants/bulk-assign',
  TEAMS_LIST: '/api/admin/teams',
  TEAM_MEMBERS: '/api/admin/teams/{id}/members'
} as const;

export const UI_SELECTORS = {
  TABS: {
    OVERVIEW: '[data-testid="tab-overview"]',
    UNASSIGNED: '[data-testid="tab-unassigned"]',
    TEAM_MANAGEMENT: '[data-testid="tab-team-management"]'
  },
  BUTTONS: {
    CREATE_TEAM: '[data-testid="create-team-btn"]',
    ASSIGN_TEAM: '[data-testid="assign-team-btn"]',
    BULK_ASSIGN: '[data-testid="bulk-assign-btn"]',
    SELECT_ALL: '[data-testid="select-all-checkbox"]'
  },
  MODALS: {
    ASSIGN_TEAM: '[data-testid="assign-team-modal"]',
    CREATE_TEAM: '[data-testid="create-team-modal"]'
  },
  FORMS: {
    TEAM_SELECT: '[data-testid="team-select"]',
    NOTES_INPUT: '[data-testid="notes-input"]',
    SEARCH_INPUT: '[data-testid="search-input"]'
  }
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized',
  TEAM_NOT_FOUND: 'Team not found',
  REGISTRANT_NOT_FOUND: 'Registrant not found',
  VALIDATION_ERROR: 'Validation error',
  NETWORK_ERROR: 'Network error'
} as const;
