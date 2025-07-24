export type UserRole = 'participant' | 'registration_manager' | 'event_organizer' | 'group_leader' | 'regional_admin' | 'super_admin';
export type RegionType = 'kanto' | 'kansai' | 'chubu' | 'kyushu' | 'chugoku' | 'shikoku' | 'tohoku' | 'hokkaido';
export type GenderType = 'male' | 'female' | 'other';
export type AgeGroupType = 'under_12' | '12_17' | '18_25' | '26_35' | '36_50' | 'over_50';
export type ShirtSizeType = '1'|'2'|'3'|'4'|'5'|'M-XS' | 'M-S' | 'M-M' | 'M-L' | 'M-XL' | 'M-XXL' | 'M-3XL' | 'M-4XL'|'F-XS' | 'F-S' | 'F-M' | 'F-L' | 'F-XL' | 'F-XXL';

// For registration role selection - can be 'participant' or an event role ID
export type EventParticipationRole = string;

export type RegistrationStatus = 
  | 'pending'          // Initial registration, waiting for payment
  | 'report_paid'      // User uploaded payment receipt
  | 'confirm_paid'     // Admin confirmed payment is correct
  | 'payment_rejected' // Admin rejected payment
  | 'donation'         // User chose to donate instead of cancelling
  | 'cancel_pending'   // Cancellation request pending admin review
  | 'cancel_accepted'  // Admin accepted cancellation
  | 'cancel_rejected'  // Admin rejected cancellation
  | 'cancel_processed' // Admin processed cancellation and refunded
  | 'cancelled'        // Registration cancelled
  | 'confirmed'        // Fully confirmed, tickets can be generated
  | 'checked_in'       // Participant checked in at event
  | 'checked_out';     // Participant checked out from event

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  facebook_url?: string;
  region?: RegionType;
  province?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  auth_identities?: { provider: string }[];
}

export interface EventConfig {
  id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  base_price: number;
  cancellation_deadline?: string;
  is_active: boolean;
  total_slots?: number;
  registered_count?: number;
  cancelled_count?: number;
  checked_in_count?: number;
  created_at: string;
  updated_at: string;
}

export interface EventTeam {
  id: string;
  event_config_id: string;
  name: string;
  description?: string;
  leader_id?: string;
  sub_leader_id?: string;
  created_at: string;
  updated_at: string;
}

export interface EventRole {
  id: string;
  event_config_id: string;
  name: string;
  description?: string;
  team_name: string;
  permissions?: Record<string, unknown>; // JSONB
  created_at: string;
  updated_at: string;
}

export interface Registration {
  id: string;
  user_id: string;
  event_config_id?: string;
  invoice_code: string;
  status: RegistrationStatus;
  total_amount: number;
  participant_count: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  user?: User;
  registrants?: Registrant[];
  receipts?: Receipt[];
  tickets?: Ticket[];
}

export interface Registrant {
  id: string;
  registration_id: string;
  email?: string;  // Optional for additional registrants
  saint_name?: string;
  full_name: string;
  gender: GenderType;
  age_group: AgeGroupType;
  province?: string;  // Optional for additional registrants
  diocese?: string;   // Optional for additional registrants
  address?: string;   // Optional for additional registrants
  facebook_link?: string;
  phone?: string;     // Optional for additional registrants
  shirt_size: ShirtSizeType;
  event_team_id?: string;
  event_role_id?: string;
  // Backward compatibility: some legacy components may still expect this
  event_role?: string;
  // Event role object from database join
  event_roles?: {
    id: string;
    name: string;
    description: string | null;
    team_name: string | null;
  } | null;
  is_primary?: boolean;  // Marks the main registrant
  go_with?: boolean; // Indicates if this registrant is going with the primary registrant
  notes?: string;
  portrait_url?: string;
  group_id?: string;
  created_at: string;
  updated_at: string;
  group?: Group;
  ticket?: Ticket;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  region?: RegionType;
  max_participants?: number;
  criteria?: Record<string, string | number | boolean>;
  created_at: string;
  updated_at: string;
}

export interface Receipt {
  id: string;
  registration_id: string;
  file_path: string;
  file_name: string;
  file_size?: number;
  content_type?: string;
  uploaded_at: string;
}

export interface Ticket {
  id: string;
  registrant_id: string;
  qr_code: string;
  frame_url?: string;
  ticket_url?: string;
  generated_at: string;
}

export interface TicketFrame {
  id: string;
  name: string;
  description?: string;
  frame_url: string;
  is_default: boolean;
  region?: RegionType;
  created_at: string;
}

export interface AgendaItem {
  id: string;
  event_config_id?: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  venue?: string;
  session_type?: string;
  notes?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Form types
export interface OnboardingData {
  region: RegionType;
  role: UserRole;
}

export interface RegistrantFormData {
  email?: string;  // Optional for additional registrants
  saint_name?: string;
  full_name: string;
  gender: GenderType;
  age_group: AgeGroupType;
  province?: string;  // Optional for additional registrants
  diocese?: string;   // Optional for additional registrants
  address?: string;   // Optional for additional registrants
  facebook_link?: string;
  phone?: string;     // Optional for additional registrants
  shirt_size: ShirtSizeType;
  event_team_id?: string;
  event_role_id?: string;
  is_primary?: boolean;
  notes?: string;
}

export interface RegistrationFormData {
  registrants: RegistrantFormData[];
  notes?: string;
}

// Database response types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      event_configs: {
        Row: EventConfig;
        Insert: Omit<EventConfig, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<EventConfig, 'id' | 'created_at' | 'updated_at'>>;
      };
      event_teams: {
        Row: EventTeam;
        Insert: Omit<EventTeam, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<EventTeam, 'id' | 'created_at' | 'updated_at'>>;
      };
      event_roles: {
        Row: EventRole;
        Insert: Omit<EventRole, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<EventRole, 'id' | 'created_at' | 'updated_at'>>;
      };
      registrations: {
        Row: Registration;
        Insert: Omit<Registration, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Registration, 'id' | 'created_at' | 'updated_at'>>;
      };
      registrants: {
        Row: Registrant;
        Insert: Omit<Registrant, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Registrant, 'id' | 'created_at' | 'updated_at'>>;
      };
      groups: {
        Row: Group;
        Insert: Omit<Group, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Group, 'id' | 'created_at' | 'updated_at'>>;
      };
      receipts: {
        Row: Receipt;
        Insert: Omit<Receipt, 'id' | 'uploaded_at'>;
        Update: Partial<Omit<Receipt, 'id' | 'uploaded_at'>>;
      };
      tickets: {
        Row: Ticket;
        Insert: Omit<Ticket, 'id' | 'generated_at'>;
        Update: Partial<Omit<Ticket, 'id' | 'generated_at'>>;
      };
      ticket_frames: {
        Row: TicketFrame;
        Insert: Omit<TicketFrame, 'id' | 'created_at'>;
        Update: Partial<Omit<TicketFrame, 'id' | 'created_at'>>;
      };
      agenda_items: {
        Row: AgendaItem;
        Insert: Omit<AgendaItem, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AgendaItem, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}

export interface CancelRequest {
  id: string;
  registration_id: string;
  user_id: string;
  reason: string;
  bank_account_number: string;
  bank_name: string;
  account_holder_name: string;
  refund_amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  processed_at?: string;
  processed_by?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  registration?: Registration;
  user?: User;
}

export interface TransportationGroup {
  id: string;
  name: string;
  region: RegionType;
  departure_location: string;
  departure_time: string;
  arrival_location?: string;
  capacity: number;
  current_count: number;
  vehicle_type?: string;
  contact_person?: string;
  contact_phone?: string;
  notes?: string;
  status: 'active' | 'full' | 'cancelled';
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: User;
  registrations?: TransportationRegistration[];
}

export interface TransportationRegistration {
  id: string;
  transportation_group_id: string;
  registrant_id: string;
  registered_by: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  special_needs?: string;
  created_at: string;
  transportation_group?: TransportationGroup;
  registrant?: Registrant;
  registered_by_user?: User;
}

export interface PaymentStats {
  totalReceived: number;
  pendingPayments: number;
  cancelRequests: number;
  refundsPending: number;
  totalRefunded: number;
}

// Constants
export const REGIONS: { value: RegionType; label: string }[] = [
  { value: 'kanto', label: 'Kanto' },
  { value: 'kansai', label: 'Kansai' },
  { value: 'chubu', label: 'Chubu' },
  { value: 'kyushu', label: 'Kyushu' },
  { value: 'chugoku', label: 'Chugoku' },
  { value: 'shikoku', label: 'Shikoku' },
  { value: 'tohoku', label: 'Tohoku' },
  { value: 'hokkaido', label: 'Hokkaido' },
];

export const ROLES: { value: UserRole; label: string }[] = [
  { value: 'participant', label: 'Participant' },
  { value: 'registration_manager', label: 'Registration Manager' },
  { value: 'event_organizer', label: 'Event Organizer' },
  { value: 'group_leader', label: 'Group Leader' },
  { value: 'regional_admin', label: 'Regional Admin' },
  { value: 'super_admin', label: 'Super Admin' },
];

export const GENDERS: { value: GenderType; label: string }[] = [
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
];

export const AGE_GROUPS: { value: AgeGroupType; label: string }[] = [
  { value: 'under_12', label: 'Dưới 12 tuổi' },
  { value: '12_17', label: '12-17 tuổi' },
  { value: '18_25', label: '18-25 tuổi' },
  { value: '26_35', label: '26-35 tuổi' },
  { value: '36_50', label: '36-50 tuổi' },
  { value: 'over_50', label: 'Trên 50 tuổi' },
];

export const SHIRT_SIZES: { value: ShirtSizeType; label: string }[] = [
  { value: 'M-XS', label: 'Nam XS (40-47)Kg' },
  { value: 'M-S', label: 'Nam S (48-53)Kg' },
  { value: 'M-M', label: 'Nam M (54-60)Kg' },
  { value: 'M-L', label: 'Nam L (61-67)Kg' },
  { value: 'M-XL', label: 'Nam XL (68-74)Kg' },
  { value: 'M-XXL', label: 'Nam XXL (75-82)Kg' },
  { value: 'M-3XL', label: 'Nam 3XL (83-90)Kg' },
  { value: 'M-4XL', label: 'Nam 4XL (>90)Kg' },
  { value: 'F-XS', label: 'Nữ XS (28-34)Kg' },
  { value: 'F-S', label: 'Nữ S (35-42)Kg' },
  { value: 'F-M', label: 'Nữ M (43-47)Kg' },
  { value: 'F-L', label: 'Nữ L (48-53)Kg' },
  { value: 'F-XL', label: 'Nữ XL (54-60)Kg' },
  { value: 'F-XXL', label: 'Nữ XXL (61-67)Kg' },
  { value: '1', label: 'Em bé 1 (9-11)Kg' },
  { value: '2', label: 'Em bé 2 (12-14)Kg' },
  { value: '3', label: 'Trẻ em 3 (15-17)Kg' },
  { value: '4', label: 'Trẻ em 4 (18-21)Kg' },
  { value: '5', label: 'Trẻ em 5 (22-26)Kg' },
];

// Province to Diocese mapping
export const PROVINCE_DIOCESE_MAPPING: { [key: string]: string } = {
  // Hokkaido
  'Hokkaido': 'Giáo phận Sapporo',
  
  // Miyagi, Aomori, Fukushima, Iwate
  'Miyagi': 'Giáo phận Sendai',
  'Aomori': 'Giáo phận Sendai',
  'Fukushima': 'Giáo phận Sendai',
  'Iwate': 'Giáo phận Sendai',
  
  // Niigata, Yamagata, Akita
  'Niigata': 'Giáo phận Niigata',
  'Yamagata': 'Giáo phận Niigata',
  'Akita': 'Giáo phận Niigata',
  
  // Saitama, Tochigi, Gunma, Ibaraki
  'Saitama': 'Giáo phận Saitama',
  'Tochigi': 'Giáo phận Saitama',
  'Gunma': 'Giáo phận Saitama',
  'Ibaraki': 'Giáo phận Saitama',
  
  // Tokyo, Chiba
  'Tokyo': 'Tổng giáo phận Tokyo',
  'Chiba': 'Tổng giáo phận Tokyo',
  
  // Kanagawa, Shizuoka, Nagano, Yamanashi
  'Kanagawa': 'Giáo phận Yokohama',
  'Shizuoka': 'Giáo phận Yokohama',
  'Nagano': 'Giáo phận Yokohama',
  'Yamanashi': 'Giáo phận Yokohama',
  
  // Aichi, Ishikawa, Toyama, Gifu, Fukui
  'Aichi': 'Giáo phận Nagoya',
  'Ishikawa': 'Giáo phận Nagoya',
  'Toyama': 'Giáo phận Nagoya',
  'Gifu': 'Giáo phận Nagoya',
  'Fukui': 'Giáo phận Nagoya',
  
  // Kyoto, Shiga, Nara, Mie
  'Kyoto': 'Giáo phận Kyoto',
  'Shiga': 'Giáo phận Kyoto',
  'Nara': 'Giáo phận Kyoto',
  'Mie': 'Giáo phận Kyoto',
  
  // Osaka, Hyogo, Wakayama, Kagawa, Ehime, Tokushima, Kochi
  'Osaka': 'Tổng giáo phận Osaka-Takamatsu',
  'Hyogo': 'Tổng giáo phận Osaka-Takamatsu',
  'Wakayama': 'Tổng giáo phận Osaka-Takamatsu',
  'Kagawa': 'Tổng giáo phận Osaka-Takamatsu',
  'Ehime': 'Tổng giáo phận Osaka-Takamatsu',
  'Tokushima': 'Tổng giáo phận Osaka-Takamatsu',
  'Kochi': 'Tổng giáo phận Osaka-Takamatsu',

  // Hiroshima, Okayama, Tottori, Yamaguchi, Shimane
  'Hiroshima': 'Giáo phận Hiroshima',
  'Okayama': 'Giáo phận Hiroshima',
  'Tottori': 'Giáo phận Hiroshima',
  'Yamaguchi': 'Giáo phận Hiroshima',
  'Shimane': 'Giáo phận Hiroshima',
  
  // Fukuoka, Saga, Kumamoto
  'Fukuoka': 'Giáo phận Fukuoka',
  'Saga': 'Giáo phận Fukuoka',
  'Kumamoto': 'Giáo phận Fukuoka',
  
  // Nagasaki
  'Nagasaki': 'Tổng giáo phận Nagasaki',
  
  // Oita, Miyazaki
  'Oita': 'Giáo phận Oita',
  'Miyazaki': 'Giáo phận Oita',
  
  // Kagoshima
  'Kagoshima': 'Giáo phận Kagoshima',
  
  // Okinawa
  'Okinawa': 'Giáo phận Naha',
};

// Province to Region mapping for Japan
export const PROVINCE_REGION_MAPPING: { [key: string]: RegionType } = {
  // Hokkaido region
  'Hokkaido': 'hokkaido',
  
  // Tohoku region
  'Aomori': 'tohoku',
  'Iwate': 'tohoku',
  'Miyagi': 'tohoku',
  'Akita': 'tohoku',
  'Yamagata': 'tohoku',
  'Fukushima': 'tohoku',
  
  // Kanto region
  'Ibaraki': 'kanto',
  'Tochigi': 'kanto',
  'Gunma': 'kanto',
  'Saitama': 'kanto',
  'Chiba': 'kanto',
  'Tokyo': 'kanto',
  'Kanagawa': 'kanto',
  
  // Chubu region
  'Niigata': 'chubu',
  'Toyama': 'chubu',
  'Ishikawa': 'chubu',
  'Fukui': 'chubu',
  'Yamanashi': 'chubu',
  'Nagano': 'chubu',
  'Gifu': 'chubu',
  'Shizuoka': 'chubu',
  'Aichi': 'chubu',
  
  // Kansai (Kinki) region
  'Mie': 'kansai',
  'Shiga': 'kansai',
  'Kyoto': 'kansai',
  'Osaka': 'kansai',
  'Hyogo': 'kansai',
  'Nara': 'kansai',
  'Wakayama': 'kansai',
  
  // Chugoku region
  'Tottori': 'chugoku',
  'Shimane': 'chugoku',
  'Okayama': 'chugoku',
  'Hiroshima': 'chugoku',
  'Yamaguchi': 'chugoku',
  
  // Shikoku region
  'Tokushima': 'shikoku',
  'Kagawa': 'shikoku',
  'Ehime': 'shikoku',
  'Kochi': 'shikoku',
  
  // Kyushu region
  'Fukuoka': 'kyushu',
  'Saga': 'kyushu',
  'Nagasaki': 'kyushu',
  'Kumamoto': 'kyushu',
  'Oita': 'kyushu',
  'Miyazaki': 'kyushu',
  'Kagoshima': 'kyushu',
  'Okinawa': 'kyushu',
};

// Helper function to get region from province
export function getRegionFromProvince(province: string): RegionType | null {
  return PROVINCE_REGION_MAPPING[province] || null;
}

export const JAPANESE_PROVINCES: { value: string; label: string }[] = [
  { value: 'Hokkaido', label: 'Hokkaido (北海道)' },
  { value: 'Aomori', label: 'Aomori (青森県)' },
  { value: 'Iwate', label: 'Iwate (岩手県)' },
  { value: 'Miyagi', label: 'Miyagi (宮城県)' },
  { value: 'Akita', label: 'Akita (秋田県)' },
  { value: 'Yamagata', label: 'Yamagata (山形県)' },
  { value: 'Fukushima', label: 'Fukushima (福島県)' },
  { value: 'Ibaraki', label: 'Ibaraki (茨城県)' },
  { value: 'Tochigi', label: 'Tochigi (栃木県)' },
  { value: 'Gunma', label: 'Gunma (群馬県)' },
  { value: 'Saitama', label: 'Saitama (埼玉県)' },
  { value: 'Chiba', label: 'Chiba (千葉県)' },
  { value: 'Tokyo', label: 'Tokyo (東京都)' },
  { value: 'Kanagawa', label: 'Kanagawa (神奈川県)' },
  { value: 'Niigata', label: 'Niigata (新潟県)' },
  { value: 'Toyama', label: 'Toyama (富山県)' },
  { value: 'Ishikawa', label: 'Ishikawa (石川県)' },
  { value: 'Fukui', label: 'Fukui (福井県)' },
  { value: 'Yamanashi', label: 'Yamanashi (山梨県)' },
  { value: 'Nagano', label: 'Nagano (長野県)' },
  { value: 'Gifu', label: 'Gifu (岐阜県)' },
  { value: 'Shizuoka', label: 'Shizuoka (静岡県)' },
  { value: 'Aichi', label: 'Aichi (愛知県)' },
  { value: 'Mie', label: 'Mie (三重県)' },
  { value: 'Shiga', label: 'Shiga (滋賀県)' },
  { value: 'Kyoto', label: 'Kyoto (京都府)' },
  { value: 'Osaka', label: 'Osaka (大阪府)' },
  { value: 'Hyogo', label: 'Hyogo (兵庫県)' },
  { value: 'Nara', label: 'Nara (奈良県)' },
  { value: 'Wakayama', label: 'Wakayama (和歌山県)' },
  { value: 'Tottori', label: 'Tottori (鳥取県)' },
  { value: 'Shimane', label: 'Shimane (島根県)' },
  { value: 'Okayama', label: 'Okayama (岡山県)' },
  { value: 'Hiroshima', label: 'Hiroshima (広島県)' },
  { value: 'Yamaguchi', label: 'Yamaguchi (山口県)' },
  { value: 'Tokushima', label: 'Tokushima (徳島県)' },
  { value: 'Kagawa', label: 'Kagawa (香川県)' },
  { value: 'Ehime', label: 'Ehime (愛媛県)' },
  { value: 'Kochi', label: 'Kochi (高知県)' },
  { value: 'Fukuoka', label: 'Fukuoka (福岡県)' },
  { value: 'Saga', label: 'Saga (佐賀県)' },
  { value: 'Nagasaki', label: 'Nagasaki (長崎県)' },
  { value: 'Kumamoto', label: 'Kumamoto (熊本県)' },
  { value: 'Oita', label: 'Oita (大分県)' },
  { value: 'Miyazaki', label: 'Miyazaki (宮崎県)' },
  { value: 'Kagoshima', label: 'Kagoshima (鹿児島県)' },
  { value: 'Okinawa', label: 'Okinawa (沖縄県)' },
];

// Legacy role definitions removed - now using dynamic event_roles from database
// All role information is fetched from the event_roles table
