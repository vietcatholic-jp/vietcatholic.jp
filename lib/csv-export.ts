import { Registration, Registrant } from '@/lib/types';
import { format } from 'date-fns';

// Extended registrant type for export with event role and registration info
export interface RegistrantWithRoleAndRegistration extends Omit<Registrant, 'event_role'> {
  registration?: {
    id: string;
    invoice_code: string;
    status: string;
    total_amount: number;
    participant_count: number;
    created_at: string;
    user?: {
      id: string;
      email: string;
      full_name?: string;
      role: string;
      region?: string;
      province?: string;
    };
  };
  event_role?: {
    id: string;
    name: string;
    team_name: string;
    description?: string;
  };
}

// Helper function to escape CSV values
function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Escape double quotes and wrap in quotes if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Convert array of objects to CSV string
function arrayToCSV<T extends Record<string, unknown>>(data: T[], headers: (keyof T)[]): string {
  const csvHeaders = headers.map(header => escapeCSV(String(header))).join(',');
  const csvRows = data.map(row => 
    headers.map(header => escapeCSV(row[header])).join(',')
  );
  return [csvHeaders, ...csvRows].join('\n');
}

// Export registrations to CSV
export function exportRegistrationsCSV(registrations: Registration[]): void {
  // Flatten registration data for CSV
  const flattenedData = registrations.map(reg => ({
    id: reg.id,
    user_id: reg.user_id,
    event_config_id: reg.event_config_id || '',
    invoice_code: reg.invoice_code,
    status: reg.status,
    total_amount: reg.total_amount,
    participant_count: reg.participant_count,
    notes: reg.notes || '',
    created_at: reg.created_at,
    updated_at: reg.updated_at,
    // Add user info for reference
    user_email: reg.user?.email || '',
    user_full_name: reg.user?.full_name || '',
    user_region: reg.user?.region || '',
    user_role: reg.user?.role || ''
  }));

  const csvHeaders = [
    'id',
    'user_id', 
    'event_config_id',
    'invoice_code',
    'status',
    'total_amount',
    'participant_count',
    'notes',
    'created_at',
    'updated_at',
    'user_email',
    'user_full_name', 
    'user_region',
    'user_role'
  ];

  const csvContent = arrayToCSV(flattenedData, csvHeaders as (keyof typeof flattenedData[0])[]);

  downloadCSV(csvContent, `registrations-backup-${format(new Date(), 'yyyy-MM-dd')}.csv`);
}

// Export registrants to CSV
export function exportRegistrantsCSV(registrations: Registration[]): void {
  // Extract all registrants from all registrations
  const allRegistrants: (Registrant & { registration_id: string; registration_invoice_code: string })[] = [];
  
  registrations.forEach(registration => {
    registration.registrants?.forEach(registrant => {
      allRegistrants.push({
        ...registrant,
        registration_id: registration.id,
        registration_invoice_code: registration.invoice_code
      });
    });
  });

  const headers = [
    'id',
    'registration_id',
    'registration_invoice_code',
    'email',
    'saint_name',
    'full_name',
    'gender',
    'age_group',
    'province',
    'diocese',
    'address',
    'facebook_link',
    'phone',
    'shirt_size',
    'event_team_id',
    'event_role_id',
    'event_role',
    'is_primary',
    'go_with',
    'notes',
    'portrait_url',
    'group_id',
    'created_at',
    'updated_at'
  ];

  // Flatten registrant data for CSV
  const flattenedData = allRegistrants.map(registrant => ({
    id: registrant.id,
    registration_id: registrant.registration_id,
    registration_invoice_code: registrant.registration_invoice_code,
    email: registrant.email || '',
    saint_name: registrant.saint_name || '',
    full_name: registrant.full_name,
    gender: registrant.gender,
    age_group: registrant.age_group,
    province: registrant.province || '',
    diocese: registrant.diocese || '',
    address: registrant.address || '',
    facebook_link: registrant.facebook_link || '',
    phone: registrant.phone || '',
    shirt_size: registrant.shirt_size,
    event_team_id: registrant.event_team_id || '',
    event_role_id: registrant.event_role_id || '',
    event_role: registrant.event_role || '',
    is_primary: registrant.is_primary ? 'true' : 'false',
    go_with: registrant.go_with ? 'true' : 'false',
    notes: registrant.notes || '',
    portrait_url: registrant.portrait_url || '',
    group_id: registrant.group_id || '',
    created_at: registrant.created_at,
    updated_at: registrant.updated_at
  }));

  const csvContent = arrayToCSV(flattenedData, headers as (keyof typeof flattenedData[0])[]);
  downloadCSV(csvContent, `registrants-backup-${format(new Date(), 'yyyy-MM-dd')}.csv`);
}

// Download CSV file
function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Export registrants with roles and registration info to CSV
export function exportRegistrantsWithRolesCSV(registrantsData: RegistrantWithRoleAndRegistration[]): void {
  const headers = [
    'registrant_id',
    'registration_id',
    'invoice_code',
    'registration_status',
    'registration_amount',
    'registration_created_at',
    'registrant_email',
    'saint_name',
    'full_name',
    'gender',
    'age_group',
    'province',
    'diocese', 
    'address',
    'facebook_link',
    'phone',
    'shirt_size',
    'event_team_id',
    'event_role_name',
    'team_name',
    'role_description',
    'is_primary',
    'go_with',
    'notes',
    'portrait_url',
    'group_id',
    'registrant_created_at',
    'registration_user_name',
    'registration_user_email',
    'registration_user_role',
    'registration_user_region'
  ];

  // Flatten registrants data for CSV with role and registration info
  const flattenedData = registrantsData.map(registrant => ({
    registrant_id: registrant.id,
    registration_id: registrant.registration?.id || '',
    invoice_code: registrant.registration?.invoice_code || '',
    registration_status: registrant.registration?.status || '',
    registration_amount: registrant.registration?.total_amount || 0,
    registration_created_at: registrant.registration?.created_at ? format(new Date(registrant.registration.created_at), 'yyyy-MM-dd HH:mm:ss') : '',
    registrant_email: registrant.email || '',
    saint_name: registrant.saint_name || '',
    full_name: registrant.full_name,
    gender: registrant.gender,
    age_group: registrant.age_group,
    province: registrant.province || '',
    diocese: registrant.diocese || '',
    address: registrant.address || '',
    facebook_link: registrant.facebook_link || '',
    phone: registrant.phone || '',
    shirt_size: registrant.shirt_size,
    event_team_id: registrant.event_team_id || '',
    event_role_name: registrant.event_role?.name || (registrant.event_role_id ? 'Unknown Role' : 'participant'),
    team_name: registrant.event_role?.team_name || '',
    role_description: registrant.event_role?.description || '',
    is_primary: registrant.is_primary ? 'true' : 'false',
    go_with: registrant.go_with ? 'true' : 'false',
    notes: registrant.notes || '',
    portrait_url: registrant.portrait_url || '',
    group_id: registrant.group_id || '',
    registrant_created_at: format(new Date(registrant.created_at), 'yyyy-MM-dd HH:mm:ss'),
    registration_user_name: registrant.registration?.user?.full_name || '',
    registration_user_email: registrant.registration?.user?.email || '',
    registration_user_role: registrant.registration?.user?.role || '',
    registration_user_region: registrant.registration?.user?.region || ''
  }));

  const csvContent = arrayToCSV(flattenedData, headers as (keyof typeof flattenedData[0])[]);
  downloadCSV(csvContent, `registrants-with-roles-${format(new Date(), 'yyyy-MM-dd')}.csv`);
}

// Export both registrations and registrants as ZIP
export async function exportFullBackup(registrations: Registration[]): Promise<void> {
  // We'll use the same individual functions but could also create a ZIP
  // For now, let's trigger both downloads
  exportRegistrationsCSV(registrations);
  
  // Small delay to avoid browser blocking multiple downloads
  setTimeout(() => {
    exportRegistrantsCSV(registrations);
  }, 500);
}