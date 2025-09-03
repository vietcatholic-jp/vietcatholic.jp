import * as XLSX from 'xlsx';
import { format } from 'date-fns';

// Team member interface for export
export interface TeamMemberForExport {
  id: string;
  full_name: string;
  gender: string;
  age_group: string;
  shirt_size?: string;
  province: string;
  diocese?: string;
  email?: string;
  phone?: string;
  facebook_link?: string;
  event_role_name?: string;
  registration_status?: string;
  invoice_code?: string;
  second_day_only?: boolean;
  selected_attendance_day?: string;
  joined_date?: string;
  event_team_name?: string;
}

// Create Excel workbook for team members
export function createTeamMembersWorkbook(
  members: TeamMemberForExport[],
  teamName?: string,
): XLSX.WorkBook {
  // Prepare data for Excel
  const excelData = members.map((member, index) => ({
    'STT': index + 1,
    'Họ và tên': member.full_name || '',
    'Giới tính': formatGender(member.gender),
    'Nhóm tuổi': formatAgeGroup(member.age_group),
    'Kích thước áo': member.shirt_size || '',
    'Tỉnh/Thành phố': member.province || '',
    'Giáo phận': member.diocese || '',
    'Email': member.email || '',
    'Số điện thoại': member.phone || '',
    'Facebook': member.facebook_link || '',
    'Vai trò': member.event_role_name || '',
    'Trạng thái đăng ký': getStatusLabel(member.registration_status) || '',
    'Mã hóa đơn': member.invoice_code || '',
    'Tham gia chỉ một ngày': member.second_day_only ? 'Có' : 'Không',
    'Ngày tham gia': member.selected_attendance_day ? formatDate(member.selected_attendance_day) : '',
    'Tên đội': member.event_team_name || '',
    'Ngày tham gia đội': member.joined_date ? formatDate(member.joined_date) : ''
  }));

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const columnWidths = [
    { wch: 5 },   // STT
    { wch: 25 },  // Họ và tên
    { wch: 10 },  // Giới tính
    { wch: 12 },  // Nhóm tuổi
    { wch: 20 },  // Tỉnh/Thành phố
    { wch: 20 },  // Giáo phận
    { wch: 30 },  // Email
    { wch: 15 },  // Số điện thoại
    { wch: 30 },  // Facebook
    { wch: 20 },  // Vai trò
    { wch: 18 },  // Trạng thái đăng ký
    { wch: 15 },  // Mã hóa đơn
    { wch: 20 },  // Kích thước áo
    { wch: 20 },  // Tham gia chỉ một ngày
    { wch: 25 },  // Tên đội
    { wch: 15 }   // Ngày tham gia
  ];
  worksheet['!cols'] = columnWidths;

  // Add header styling (basic)
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;
    
    // Make header bold (basic styling)
    worksheet[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "E6E6FA" } },
      alignment: { horizontal: "center" }
    };
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, `Danh sách ${teamName}`);

  return workbook;
}

// Generate filename for team export
export function generateTeamExportFilename(teamName?: string): string {
  const today = format(new Date(), 'yyyy-MM-dd-HHmm');
  const sanitizedTeamName = teamName
    ?.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') || ''; // Remove leading/trailing underscores
  
  return `Danh_sach_${sanitizedTeamName}_${today}.xlsx`;
}

// Export team members to Excel file
export function exportTeamMembersToExcel(
  members: TeamMemberForExport[],
  teamName?: string,
): void {
  if (!members || members.length === 0) {
    throw new Error('Không có dữ liệu thành viên để xuất');
  }

  try {
    // Create workbook
    const workbook = createTeamMembersWorkbook(members, teamName);
    
    // Generate filename
    const filename = generateTeamExportFilename(teamName);
    
    // Write and download file
    XLSX.writeFile(workbook, filename);
  } catch (error) {
    console.error('Error exporting team members to Excel:', error);
    throw new Error('Không thể xuất file Excel');
  }
}

// Helper function to format date
function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), 'dd/MM/yyyy');
  } catch {
    return dateString;
  }
}

// Helper function to get status label in Vietnamese
function getStatusLabel(status?: string): string {
  const statusLabels: Record<string, string> = {
    'pending': 'Chờ xử lý',
    'confirmed': 'Đã xác nhận',
    'confirm_paid': 'Đã thanh toán',
    'temp_confirmed': 'Tạm xác nhận',
    'checked_in': 'Đã check-in',
    'checked_out': 'Đã check-out',
    'cancelled': 'Đã hủy',
    'rejected': 'Bị từ chối'
  };

  return statusLabels[status || ''] || status || '';
}

// Helper function to format gender in Vietnamese
function formatGender(gender?: string): string {
  const genderLabels: Record<string, string> = {
    'male': 'Nam',
    'female': 'Nữ'
  };

  return genderLabels[gender || ''] || gender || '';
}

// Helper function to format age group in Vietnamese
function formatAgeGroup(ageGroup?: string): string {
  const ageGroupLabels: Record<string, string> = {
    '18_25': '18-25 tuổi',
    '26_35': '26-35 tuổi',
    '36_45': '36-45 tuổi',
    '46_55': '46-55 tuổi',
    '56_65': '56-65 tuổi',
    '66_plus': '66+ tuổi'
  };

  return ageGroupLabels[ageGroup || ''] || ageGroup || '';
}
