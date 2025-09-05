import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { Registration, Registrant, RegistrationStatus } from './types';
import { A4_LAYOUT, CARD_POSITIONS, A4CardPage, CardLayout, CardImageData } from './card-constants';

// Vietnamese font support
const VIETNAMESE_FONT = 'helvetica';

// PDF page settings
const PAGE_WIDTH = 210; // A4 width in mm
const PAGE_HEIGHT = 297; // A4 height in mm
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

// Helper function to get Vietnamese status label
function getStatusLabel(status: RegistrationStatus): string {
  const statusMap: Record<RegistrationStatus, string> = {
    'pending': 'Chờ đóng phí tham dự',
    'report_paid': 'Đã báo đóng phí tham dự',
    'confirm_paid': 'Đã xác nhận đóng phí tham dự',
    'payment_rejected': 'Đóng phí tham dự bị từ chối',
    'donation': 'Đã chuyển thành quyên góp',
    'cancel_pending': 'Chờ xử lý hủy',
    'be_cancelled': 'Đã yêu cầu hủy',
    'cancel_accepted': 'Đã chấp nhận hủy',
    'cancel_rejected': 'Đã từ chối hủy',
    'cancel_processed': 'Đã hoàn tiền',
    'cancelled': 'Đã hủy',
    'confirmed': 'Đã xác nhận',
    'temp_confirmed': 'Đã xác nhận (thanh toán sau)',
    'checked_in': 'Đã check-in',
    'checked_out': 'Đã check-out'
  };
  return statusMap[status] || status;
}

// Helper function to format Vietnamese currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

// Helper function to format participant names
function formatParticipantNames(registrants: Registrant[]): string {
  if (!registrants || registrants.length === 0) return '';
  if (registrants.length === 1) return registrants[0].full_name;
  
  const primary = registrants.find(r => r.is_primary)?.full_name || registrants[0].full_name;
  const others = registrants.filter(r => !r.is_primary).length;
  
  if (others > 0) {
    return `${primary} (+ ${others} người khác)`;
  }
  return primary;
}

// Add text with automatic wrapping
function addTextWithWrap(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight: number = 6): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  let currentY = y;
  
  for (const line of lines) {
    doc.text(line, x, currentY);
    currentY += lineHeight;
  }
  
  return currentY;
}

// Add header with title and current date
function addHeader(doc: jsPDF, title: string): number {
  doc.setFontSize(18);
  doc.text(title, MARGIN, 30);
  
  doc.setFontSize(10);
  doc.text(`Ngày xuất: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, MARGIN, 40);
  
  return 50;
}

// Add table header
function addTableHeader(doc: jsPDF, headers: string[], x: number, y: number, columnWidths: number[]): number {
  doc.setFontSize(10);
  doc.setFont(VIETNAMESE_FONT, 'bold');
  
  let currentX = x;
  for (let i = 0; i < headers.length; i++) {
    doc.rect(currentX, y - 5, columnWidths[i], 10);
    doc.text(headers[i], currentX + 2, y + 1);
    currentX += columnWidths[i];
  }
  
  return y + 10;
}

// Add table row
function addTableRow(doc: jsPDF, values: string[], x: number, y: number, columnWidths: number[], rowHeight: number = 15): number {
  doc.setFont(VIETNAMESE_FONT, 'normal');
  doc.setFontSize(9);
  
  let currentX = x;
  let maxY = y;
  
  for (let i = 0; i < values.length; i++) {
    doc.rect(currentX, y - 5, columnWidths[i], rowHeight);
    const textY = addTextWithWrap(doc, values[i], currentX + 2, y + 1, columnWidths[i] - 4, 4);
    maxY = Math.max(maxY, textY);
    currentX += columnWidths[i];
  }
  
  return y + rowHeight;
}

export async function exportRegistrationList(registrations: Registration[]): Promise<void> {
  const doc = new jsPDF();
  
  let currentY = addHeader(doc, 'DANH SÁCH ĐĂNG KÝ THAM GIA ĐẠI HỘI CÔNG GIÁO VIỆT NAM TẠI NHẬT BẢN 2025');
  
  // Summary statistics
  doc.setFontSize(12);
  doc.text('THỐNG KÊ TỔNG QUAN', MARGIN, currentY + 10);
  
  currentY += 20;
  doc.setFontSize(10);
  
  const totalRegistrations = registrations.length;
  const totalParticipants = registrations.reduce((sum, reg) => sum + reg.participant_count, 0);
  const confirmedRegistrations = registrations.filter(reg => 
    ['confirm_paid', 'confirmed', 'checked_in', 'checked_out'].includes(reg.status)
  ).length;
  const totalAmount = registrations.reduce((sum, reg) => sum + reg.total_amount, 0);
  
  const summaryText = [
    `• Tổng số đăng ký: ${totalRegistrations}`,
    `• Tổng số người tham gia: ${totalParticipants}`,
    `• Số đăng ký đã xác nhận: ${confirmedRegistrations}`,
    `• Tổng số tiền: ${formatCurrency(totalAmount)}`
  ];
  
  for (const text of summaryText) {
    doc.text(text, MARGIN, currentY);
    currentY += 7;
  }
  
  currentY += 15;
  
  // Registration table
  doc.setFontSize(12);
  doc.text('CHI TIẾT ĐĂNG KÝ', MARGIN, currentY);
  currentY += 15;
  
  const headers = ['Mã đăng ký', 'Người đăng ký', 'Số người', 'Trạng thái', 'Số tiền', 'Ngày đăng ký'];
  const columnWidths = [25, 50, 20, 35, 25, 25];
  
  currentY = addTableHeader(doc, headers, MARGIN, currentY, columnWidths);
  
  for (const registration of registrations) {
    // Check if we need a new page
    if (currentY > PAGE_HEIGHT - 30) {
      doc.addPage();
      currentY = 30;
    }
    
    const values = [
      registration.invoice_code,
      formatParticipantNames(registration.registrants || []),
      registration.participant_count.toString(),
      getStatusLabel(registration.status),
      formatCurrency(registration.total_amount),
      format(new Date(registration.created_at), 'dd/MM/yyyy')
    ];
    
    currentY = addTableRow(doc, values, MARGIN, currentY, columnWidths);
  }
  
  // Add footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Trang ${i}/${pageCount}`, PAGE_WIDTH - 30, PAGE_HEIGHT - 10);
  }
  
  // Save the PDF
  const fileName = `danh-sach-dang-ky-${format(new Date(), 'dd-MM-yyyy')}.pdf`;
  doc.save(fileName);
}

export async function exportPaymentReport(registrations: Registration[]): Promise<void> {
  const doc = new jsPDF();

  let currentY = addHeader(doc, 'BÁO CÁO ĐÓNG PHÍ THAM DỰ ĐẠI HỘI CÔNG GIÁO VIỆT NAM TẠI NHẬT BẢN 2025');

  // Payment statistics
  doc.setFontSize(12);
  doc.text('THỐNG KÊ ĐÓNG PHÍ THAM DỰ', MARGIN, currentY + 10);
  
  currentY += 20;
  doc.setFontSize(10);
  
  const paymentStats = {
    pending: registrations.filter(r => r.status === 'pending'),
    reported: registrations.filter(r => r.status === 'report_paid'),
    confirmed: registrations.filter(r => ['confirm_paid', 'confirmed', 'checked_in', 'checked_out'].includes(r.status)),
    rejected: registrations.filter(r => r.status === 'payment_rejected'),
    cancelled: registrations.filter(r => ['cancelled', 'cancel_accepted'].includes(r.status))
  };
  
  const statsText = [
    `• Chờ đóng phí tham dự: ${paymentStats.pending.length} đăng ký - ${formatCurrency(paymentStats.pending.reduce((sum, r) => sum + r.total_amount, 0))}`,
    `• Đã báo đóng phí tham dự: ${paymentStats.reported.length} đăng ký - ${formatCurrency(paymentStats.reported.reduce((sum, r) => sum + r.total_amount, 0))}`,
    `• Đã xác nhận đóng phí tham dự: ${paymentStats.confirmed.length} đăng ký - ${formatCurrency(paymentStats.confirmed.reduce((sum, r) => sum + r.total_amount, 0))}`,
    `• Đóng phí tham dự bị từ chối: ${paymentStats.rejected.length} đăng ký - ${formatCurrency(paymentStats.rejected.reduce((sum, r) => sum + r.total_amount, 0))}`,
    `• Đã hủy: ${paymentStats.cancelled.length} đăng ký - ${formatCurrency(paymentStats.cancelled.reduce((sum, r) => sum + r.total_amount, 0))}`
  ];
  
  for (const text of statsText) {
    currentY = addTextWithWrap(doc, text, MARGIN, currentY, CONTENT_WIDTH, 7);
    currentY += 3;
  }
  
  currentY += 15;
  
  // Payment status breakdown
  doc.setFontSize(12);
  doc.text('CHI TIẾT THEO TRẠNG THÁI ĐÓNG PHÍ THAM DỰ', MARGIN, currentY);
  currentY += 15;

  const statusGroups = [
    { title: 'ĐÃ XÁC NHẬN ĐÓNG PHÍ THAM DỰ', data: paymentStats.confirmed },
    { title: 'ĐÃ BÁO ĐÓNG PHÍ THAM DỰ (CHỜ XÁC NHẬN)', data: paymentStats.reported },
    { title: 'CHỜ ĐÓNG PHÍ THAM DỰ', data: paymentStats.pending },
    { title: 'ĐÓNG PHÍ THAM DỰ BỊ TỪ CHỐI', data: paymentStats.rejected }
  ];
  
  for (const group of statusGroups) {
    if (group.data.length === 0) continue;
    
    // Check if we need a new page
    if (currentY > PAGE_HEIGHT - 60) {
      doc.addPage();
      currentY = 30;
    }
    
    doc.setFontSize(11);
    doc.setFont(VIETNAMESE_FONT, 'bold');
    doc.text(group.title, MARGIN, currentY);
    currentY += 10;
    
    const headers = ['Mã đăng ký', 'Người đăng ký', 'Số tiền', 'Ngày tạo', 'Ghi chú'];
    const columnWidths = [30, 60, 30, 30, 20];
    
    currentY = addTableHeader(doc, headers, MARGIN, currentY, columnWidths);
    
    for (const registration of group.data) {
      // Check if we need a new page
      if (currentY > PAGE_HEIGHT - 30) {
        doc.addPage();
        currentY = 30;
      }
      
      const values = [
        registration.invoice_code,
        formatParticipantNames(registration.registrants || []),
        formatCurrency(registration.total_amount),
        format(new Date(registration.created_at), 'dd/MM/yyyy'),
        registration.notes || ''
      ];
      
      currentY = addTableRow(doc, values, MARGIN, currentY, columnWidths);
    }
    
    currentY += 10;
  }
  
  // Add footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Trang ${i}/${pageCount}`, PAGE_WIDTH - 30, PAGE_HEIGHT - 10);
  }
  
  // Save the PDF
  const fileName = `bao-cao-thanh-toan-${format(new Date(), 'dd-MM-yyyy')}.pdf`;
  doc.save(fileName);
}

// ===== CARD PDF GENERATION FUNCTIONS =====

// CardImageData interface is now imported from card-constants.ts

/**
 * Generate PDF with cards arranged in A4 layout (4 cards per page)
 */
export async function generateCardsPDF(cards: CardImageData[]): Promise<Blob> {
  const doc = new jsPDF();

  // Create A4 card layout
  const cardPages = createA4CardLayout(cards);

  // Add cards to PDF pages
  for (let pageIndex = 0; pageIndex < cardPages.length; pageIndex++) {
    if (pageIndex > 0) {
      doc.addPage();
    }

    const page = cardPages[pageIndex];
    await addCardsToPage(doc, page);
  }

  // Return PDF as blob
  return new Promise((resolve) => {
    const blob = doc.output('blob') as Blob;
    resolve(blob);
  });
}

/**
 * Create A4 card layout - arrange cards into pages with 4 cards each
 */
export function createA4CardLayout(cards: CardImageData[]): A4CardPage[] {
  const pages: A4CardPage[] = [];

  // Group cards into pages of 4
  for (let i = 0; i < cards.length; i += 4) {
    const pageCards = cards.slice(i, i + 4);
    const layout: CardLayout[] = [];

    // Assign positions to cards
    pageCards.forEach((card, index) => {
      if (index < CARD_POSITIONS.length) {
        layout.push({
          card,
          position: CARD_POSITIONS[index]
        });
      }
    });

    pages.push({
      cards: pageCards,
      layout
    });
  }

  return pages;
}

/**
 * Add cards to a PDF page
 */
async function addCardsToPage(doc: jsPDF, page: A4CardPage): Promise<void> {
  for (const cardLayout of page.layout) {
    await addCardToPage(doc, cardLayout.card, cardLayout.position.x, cardLayout.position.y);
  }
}

/**
 * Add a single card image to PDF page at specified position
 */
async function addCardToPage(
  doc: jsPDF,
  card: CardImageData,
  x: number,
  y: number
): Promise<void> {
  try {
    // Add card image to PDF
    doc.addImage(
      card.imageDataUrl,
      'PNG',
      x,
      y,
      A4_LAYOUT.CARD_WIDTH,
      A4_LAYOUT.CARD_HEIGHT,
      undefined,
      'FAST'
    );
  } catch (error) {
    console.error(`Error adding card ${card.id} to PDF:`, error);

    // Add placeholder rectangle if image fails
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(240, 240, 240);
    doc.rect(x, y, A4_LAYOUT.CARD_WIDTH, A4_LAYOUT.CARD_HEIGHT, 'FD');

    // Add error text
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Lỗi tải ảnh', x + A4_LAYOUT.CARD_WIDTH / 2, y + A4_LAYOUT.CARD_HEIGHT / 2, {
      align: 'center'
    });
  }
}

/**
 * Download cards PDF with specified filename
 */
export async function downloadCardsPDF(cards: CardImageData[], filename?: string): Promise<void> {
  const pdfBlob = await generateCardsPDF(cards);

  // Create download link
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `the-id-cards-${format(new Date(), 'dd-MM-yyyy-HH-mm')}.pdf`;

  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Preview cards layout for debugging
 */
export function previewCardsLayout(cards: CardImageData[]): A4CardPage[] {
  return createA4CardLayout(cards);
}