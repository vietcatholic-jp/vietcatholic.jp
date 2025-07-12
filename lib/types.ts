export type UserRole = 'participant' | 'registration_manager' | 'event_organizer' | 'group_leader' | 'regional_admin' | 'super_admin';
export type RegionType = 'kanto' | 'kansai' | 'chubu' | 'kyushu' | 'chugoku' | 'shikoku' | 'tohoku' | 'hokkaido';
export type GenderType = 'male' | 'female' | 'other';
export type AgeGroupType = 'under_12' | '12_17' | '18_25' | '26_35' | '36_50' | 'over_50';
export type ShirtSizeType = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type RegistrationStatus = 
  | 'pending'          // Initial registration, waiting for payment
  | 'report_paid'      // User uploaded payment receipt
  | 'confirm_paid'     // Admin confirmed payment is correct
  | 'payment_rejected' // Admin rejected payment
  | 'donation'         // User chose to donate instead of cancelling
  | 'cancel_pending'   // Cancellation request pending admin review
  | 'cancel_accepted'  // Admin accepted cancellation
  | 'cancel_rejected'  // Admin rejected cancellation
  | 'cancelled'        // Registration cancelled
  | 'confirmed'        // Fully confirmed, tickets can be generated
  | 'checked_in'       // Participant checked in at event
  | 'checked_out';     // Participant checked out from event

// NEW: Event participation roles
export type EventParticipationRole = 
  | 'participant'           // Regular attendee
  // Media team roles
  | 'volunteer_media_leader'       // Trưởng ban Truyền thông
  | 'volunteer_media_sub_leader'   // Phó ban Truyền thông
  | 'volunteer_media_member'       // Thành viên ban Truyền thông
  // Activity team roles
  | 'volunteer_activity_leader'    // Trưởng ban Sinh hoạt
  | 'volunteer_activity_sub_leader'// Phó ban Sinh hoạt
  | 'volunteer_activity_member'    // Thành viên ban Sinh hoạt
  // Discipline team roles
  | 'volunteer_discipline_leader'  // Trưởng ban Kỷ luật
  | 'volunteer_discipline_sub_leader'// Phó ban Kỷ luật
  | 'volunteer_discipline_member'  // Thành viên ban Kỷ luật
  // Logistics team roles
  | 'volunteer_logistics_leader'   // Trưởng ban Hậu cần
  | 'volunteer_logistics_sub_leader'// Phó ban Hậu cần
  | 'volunteer_logistics_member'   // Thành viên ban Hậu cần
  // Liturgy team roles
  | 'volunteer_liturgy_leader'     // Trưởng ban Phụng vụ
  | 'volunteer_liturgy_sub_leader' // Phó ban Phụng vụ
  | 'volunteer_liturgy_member'     // Thành viên ban Phụng vụ
  // Security team roles
  | 'volunteer_security_leader'    // Trưởng ban An ninh
  | 'volunteer_security_sub_leader'// Phó ban An ninh
  | 'volunteer_security_member'    // Thành viên ban An ninh
  // Registration team roles
  | 'volunteer_registration_leader'// Trưởng ban Thư ký
  | 'volunteer_registration_sub_leader'// Phó ban Thư ký
  | 'volunteer_registration_member'// Thành viên ban Thư ký
  // Catering team roles
  | 'volunteer_catering_leader'    // Trưởng ban Ẩm thực
  | 'volunteer_catering_sub_leader'// Phó ban Ẩm thực
  | 'volunteer_catering_member'    // Thành viên ban Ẩm thực
  // Health team roles
  | 'volunteer_health_leader'      // Trưởng ban Y tế
  | 'volunteer_health_sub_leader'  // Phó ban Y tế
  | 'volunteer_health_member'      // Thành viên ban Y tế
  // Audio Light team roles
  | 'volunteer_audio_light_leader' // Trưởng ban Âm thanh Ánh sáng
  | 'volunteer_audio_light_sub_leader'// Phó ban Âm thanh Ánh sáng
  | 'volunteer_audio_light_member' // Thành viên ban Âm thanh Ánh sáng
  // Group leadership roles
  | 'volunteer_group_leader'       // Trưởng nhóm các đội
  | 'volunteer_group_sub_leader'   // Phó trưởng nhóm các đội
  // Organizer roles
  | 'organizer_core'               // BAN TỔ CHỨC, THỦ QUỸ
  | 'organizer_regional'           // BAN TỔ CHỨC KHU VỰC
  // Special roles
  | 'speaker'                      // Speaker/presenter
  | 'performer';                   // Performer (choir, band, etc.)

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
  event_role?: EventParticipationRole;
  is_primary?: boolean;  // Marks the main registrant
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
  event_role: EventParticipationRole;
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

export const EVENT_PARTICIPATION_ROLES: { value: EventParticipationRole; label: string; description: string }[] = [
  { value: 'participant', label: 'Người tham gia', description: 'Tham gia như người dự sự kiện thông thường' },
  
  // Media team roles
  { value: 'volunteer_media_leader', label: 'Trưởng ban Truyền thông', description: 'Lãnh đạo ban Truyền thông' },
  { value: 'volunteer_media_sub_leader', label: 'Phó ban Truyền thông', description: 'Phó lãnh đạo ban Truyền thông' },
  { value: 'volunteer_media_member', label: 'Thành viên ban Truyền thông', description: 'Chụp ảnh, quay video, social media' },
  
  // Activity team roles
  { value: 'volunteer_activity_leader', label: 'Trưởng ban Sinh hoạt', description: 'Lãnh đạo ban Sinh hoạt' },
  { value: 'volunteer_activity_sub_leader', label: 'Phó ban Sinh hoạt', description: 'Phó lãnh đạo ban Sinh hoạt' },
  { value: 'volunteer_activity_member', label: 'Thành viên ban Sinh hoạt', description: 'Hỗ trợ các hoạt động sinh hoạt' },
  
  // Discipline team roles
  { value: 'volunteer_discipline_leader', label: 'Trưởng ban Kỷ luật', description: 'Lãnh đạo ban Kỷ luật' },
  { value: 'volunteer_discipline_sub_leader', label: 'Phó ban Kỷ luật', description: 'Phó lãnh đạo ban Kỷ luật' },
  { value: 'volunteer_discipline_member', label: 'Thành viên ban Kỷ luật', description: 'Hỗ trợ duy trì kỷ luật' },
  
  // Logistics team roles
  { value: 'volunteer_logistics_leader', label: 'Trưởng ban Hậu cần', description: 'Lãnh đạo ban Hậu cần' },
  { value: 'volunteer_logistics_sub_leader', label: 'Phó ban Hậu cần', description: 'Phó lãnh đạo ban Hậu cần' },
  { value: 'volunteer_logistics_member', label: 'Thành viên ban Hậu cần', description: 'Chuẩn bị sân khấu, vận chuyển, setup' },
  
  // Liturgy team roles
  { value: 'volunteer_liturgy_leader', label: 'Trưởng ban Phụng vụ', description: 'Lãnh đạo ban Phụng vụ' },
  { value: 'volunteer_liturgy_sub_leader', label: 'Phó ban Phụng vụ', description: 'Phó lãnh đạo ban Phụng vụ' },
  { value: 'volunteer_liturgy_member', label: 'Thành viên ban Phụng vụ', description: 'Hỗ trợ các nghi thức tôn giáo' },
  
  // Security team roles
  { value: 'volunteer_security_leader', label: 'Trưởng ban An ninh', description: 'Lãnh đạo ban An ninh' },
  { value: 'volunteer_security_sub_leader', label: 'Phó ban An ninh', description: 'Phó lãnh đạo ban An ninh' },
  { value: 'volunteer_security_member', label: 'Thành viên ban An ninh', description: 'Đảm bảo an toàn và trật tự' },
  
  // Registration team roles
  { value: 'volunteer_registration_leader', label: 'Trưởng ban Thư ký', description: 'Lãnh đạo ban Thư ký' },
  { value: 'volunteer_registration_sub_leader', label: 'Phó ban Thư ký', description: 'Phó lãnh đạo ban Thư ký' },
  { value: 'volunteer_registration_member', label: 'Thành viên ban Thư ký', description: 'Hỗ trợ check-in và đăng ký tại chỗ' },
  
  // Catering team roles
  { value: 'volunteer_catering_leader', label: 'Trưởng ban Ẩm thực', description: 'Lãnh đạo ban Ẩm thực' },
  { value: 'volunteer_catering_sub_leader', label: 'Phó ban Ẩm thực', description: 'Phó lãnh đạo ban Ẩm thực' },
  { value: 'volunteer_catering_member', label: 'Thành viên ban Ẩm thực', description: 'Chuẩn bị và phục vụ đồ ăn uống' },
  
  // Health team roles
  { value: 'volunteer_health_leader', label: 'Trưởng ban Y tế', description: 'Lãnh đạo ban Y tế' },
  { value: 'volunteer_health_sub_leader', label: 'Phó ban Y tế', description: 'Phó lãnh đạo ban Y tế' },
  { value: 'volunteer_health_member', label: 'Thành viên ban Y tế', description: 'Hỗ trợ y tế và sức khỏe' },
  
  // Audio Light team roles
  { value: 'volunteer_audio_light_leader', label: 'Trưởng ban Âm thanh Ánh sáng', description: 'Lãnh đạo ban Âm thanh Ánh sáng' },
  { value: 'volunteer_audio_light_sub_leader', label: 'Phó ban Âm thanh Ánh sáng', description: 'Phó lãnh đạo ban Âm thanh Ánh sáng' },
  { value: 'volunteer_audio_light_member', label: 'Thành viên ban Âm thanh Ánh sáng', description: 'Hỗ trợ âm thanh và ánh sáng' },
  
  // Group leadership roles
  { value: 'volunteer_group_leader', label: 'Trưởng nhóm các đội', description: 'Lãnh đạo nhóm các đội' },
  { value: 'volunteer_group_sub_leader', label: 'Phó trưởng nhóm các đội', description: 'Phó lãnh đạo nhóm các đội' },
  
  // Organizer roles
  { value: 'organizer_core', label: 'Ban Tổ chức chính', description: 'Thành viên ban tổ chức cốt lõi' },
  { value: 'organizer_regional', label: 'Ban Tổ chức khu vực', description: 'Đại diện tổ chức từ các khu vực' },
  
  // Special roles
  { value: 'speaker', label: 'Diễn giả', description: 'Thuyết trình, chia sẻ kinh nghiệm' },
  { value: 'performer', label: 'Ban sinh hoạt', description: 'Ca sĩ, nhạc sĩ, vũ đoàn, etc.' },
];

export const GENDERS: { value: GenderType; label: string }[] = [
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' },
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
  { value: 'XS', label: 'XS' },
  { value: 'S', label: 'S' },
  { value: 'M', label: 'M' },
  { value: 'L', label: 'L' },
  { value: 'XL', label: 'XL' },
  { value: 'XXL', label: 'XXL' },
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
