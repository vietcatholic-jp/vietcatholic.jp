import { Registration, SHIRT_SIZES, JAPANESE_PROVINCES } from "@/lib/types";

// Analytics helper functions - extracted from export page
export function generateShirtSizeStats(registrations: Registration[]) {
  const stats: { [size: string]: number } = {};
  
  registrations.forEach(reg => {
    reg.registrants?.forEach(registrant => {
      if (registrant.shirt_size) {
        stats[registrant.shirt_size] = (stats[registrant.shirt_size] || 0) + 1;
      }
    });
  });
  
  return Object.entries(stats)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([size, count]) => ({ 
      size, 
      count, 
      label: SHIRT_SIZES.find(s => s.value === size)?.label || size 
    }));
}

export function generateProvinceStats(registrations: Registration[]) {
  const stats: { [province: string]: number } = {};
  
  registrations.forEach(reg => {
    reg.registrants?.forEach(registrant => {
      if (registrant.province) {
        stats[registrant.province] = (stats[registrant.province] || 0) + 1;
      }
    });
  });
  
  return Object.entries(stats)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([province, count]) => ({ 
      province, 
      count, 
      label: JAPANESE_PROVINCES.find(p => p.value === province)?.label || province 
    }));
}

export function generateDioceseStats(registrations: Registration[]) {
  const stats: { [diocese: string]: { total: number; goWith: number; individual: number } } = {};
  
  registrations.forEach(reg => {
    reg.registrants?.forEach(registrant => {
      if (registrant.diocese) {
        if (!stats[registrant.diocese]) {
          stats[registrant.diocese] = { total: 0, goWith: 0, individual: 0 };
        }
        stats[registrant.diocese].total += 1;
        
        if (registrant.go_with) {
          stats[registrant.diocese].goWith += 1;
        } else {
          stats[registrant.diocese].individual += 1;
        }
      }
    });
  });
  
  return Object.entries(stats)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([diocese, counts]) => ({ diocese, ...counts }));
}

export function calculateSummaryStats(registrations: Registration[]) {
  const totalRegistrations = registrations.length;
  const totalParticipants = registrations.reduce((sum, reg) => sum + reg.participant_count, 0);
  const totalAmount = registrations.filter(r => 
    ['confirm_paid', 'confirmed', 'checked_in', 'checked_out','donation'].includes(r.status)
  ).reduce((sum, reg) => sum + reg.total_amount, 0);
  const confirmedRegistrations = registrations.filter(r => 
    ['confirm_paid', 'confirmed', 'checked_in', 'checked_out'].includes(r.status)
  ).length;
  const pendingPayments = registrations.filter(r => r.status === 'pending').length;
  const reportedPayments = registrations.filter(r => r.status === 'report_paid').length;
  const rejectedPayments = registrations.filter(r => r.status === 'payment_rejected').length;
  
  // Additional metrics
  const totalRegistrants = registrations.reduce((sum, reg) => sum + (reg.registrants?.length || 0), 0);
  const goWithCount = registrations.reduce((sum, reg) => 
    sum + (reg.registrants?.filter(r => r.go_with).length || 0), 0
  );
  const individualCount = totalRegistrants - goWithCount;
  
  return {
    totalRegistrations,
    totalParticipants,
    totalAmount,
    confirmedRegistrations,
    pendingPayments,
    reportedPayments,
    rejectedPayments,
    totalRegistrants,
    goWithCount,
    individualCount,
    averageParticipantsPerRegistration: totalRegistrations > 0 ? 
      Math.round((totalParticipants / totalRegistrations) * 10) / 10 : 0
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);
}

export function getStatusLabel(status: string): string {
  const statusMap: { [key: string]: string } = {
    'pending': 'Chờ thanh toán',
    'report_paid': 'Đã báo thanh toán',
    'confirm_paid': 'Đã xác nhận thanh toán',
    'payment_rejected': 'Thanh toán bị từ chối',
    'donation': 'Đã chuyển thành quyên góp',
    'cancel_pending': 'Chờ xử lý hủy',
    'cancel_accepted': 'Đã chấp nhận hủy',
    'cancel_rejected': 'Đã từ chối hủy',
    'cancel_processed': 'Đã hoàn tiền',
    'cancelled': 'Đã hủy',
    'confirmed': 'Đã xác nhận',
    'checked_in': 'Đã check-in',
    'checked_out': 'Đã check-out'
  };
  return statusMap[status] || status;
}