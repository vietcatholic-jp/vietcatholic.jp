import QRCode from "qrcode";
import html2canvas from "html2canvas";
import { RegistrantWithRoleAndRegistration } from "@/lib/csv-export";
import { Registrant } from "@/lib/types";

// Generate QR code for a registrant
export async function generateQRCodeForRegistrant(registrant: RegistrantWithRoleAndRegistration | Registrant): Promise<string> {
  try {
    const qrData = {
      id: registrant.id,
      name: registrant.full_name,
      event: "Đại hội Năm Thánh 2025",
    };

    const url = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return url;
  } catch (error) {
    console.error('QR code generation error:', error);
    return '';
  }
}

// Create ticket element with proper avatar sizing
export function createTicketElement(
  registrant: RegistrantWithRoleAndRegistration | Registrant, 
  qrCodeUrl: string
): HTMLDivElement {
  const ticketDiv = document.createElement('div');
  ticketDiv.style.width = '400px';
  ticketDiv.style.fontFamily = 'Arial, sans-serif';
  ticketDiv.style.backgroundColor = 'white';
  ticketDiv.style.borderRadius = '16px';
  ticketDiv.style.overflow = 'hidden';
  ticketDiv.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';

  // Handle different types of registrant objects
  const eventRoleId = 'event_role_id' in registrant ? registrant.event_role_id : registrant.event_roles?.id;
  const headerColor = eventRoleId ? '#3b82f6' : '#10b981';
  
  ticketDiv.innerHTML = `
    <div style="background-color: ${headerColor}; color: white; padding: 16px; text-align: center;">
      <h1 style="font-size: 20px; font-weight: bold; margin: 0;">ĐẠI HỘI NĂM THÁNH TOÀN QUỐC 2025</h1>
    </div>
    <div style="padding: 24px;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
        ${registrant.portrait_url ? `
          <div style="width: 128px; height: 128px; border-radius: 50%; overflow: hidden; border: 4px solid #e5e7eb;">
            <img src="${registrant.portrait_url}" alt="Portrait" style="width: 100%; height: 100%; object-fit: cover;" crossorigin="anonymous" />
          </div>
        ` : ''}
        <div style="text-align: center;">
          ${registrant.saint_name ? `<p style="color: #6b7280; margin: 0 0 8px 0;">(${registrant.saint_name})</p>` : ''}
          <p style="font-size: 24px; font-weight: 600; margin: 0;">${registrant.full_name}</p>
          ${registrant.second_day_only ? `
            <div style="margin-top: 8px; display: inline-block; padding: 8px 8px; background-color: #fed7aa; color: #9a3412; font-size: 14px; font-weight: 500; border-radius: 9999px; border: 1px solid #fdba74;">
              Chỉ tham dự: ${new Date(registrant.selected_attendance_day || '2025-09-15').toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          ` : ''}
        </div>
        <div style="display: flex; align-items: center; color: #6b7280;">
          <svg style="width: 20px; height: 20px; margin-right: 8px;" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
          </svg>
          <span>Kamiozuki, Hanado, Kanagawa</span>
        </div>
        ${qrCodeUrl ? `
          <div style="padding: 8px; background-color: white; border-radius: 8px; border: 1px solid #e5e7eb;">
            <img src="${qrCodeUrl}" alt="QR Code" style="width: 200px; height: 200px;" />
          </div>
        ` : ''}
        <div style="text-align: center; font-size: 14px; color: #6b7280; padding-top: 8px;">
          <p style="margin: 0;">Sử dụng mã QR này để check-in tại sự kiện.</p>
        </div>
      </div>
    </div>
  `;

  return ticketDiv;
}

// Generate ticket image from registrant data
export async function generateTicketImage(registrant: RegistrantWithRoleAndRegistration | Registrant): Promise<Blob | null> {
  try {
    const qrCodeUrl = await generateQRCodeForRegistrant(registrant);
    const ticketElement = createTicketElement(registrant, qrCodeUrl);
    
    // Temporarily add to DOM for rendering
    document.body.appendChild(ticketElement);
    
    const canvas = await html2canvas(ticketElement, { 
      useCORS: true,
      allowTaint: true,
      scale: 2,
      backgroundColor: '#ffffff'
    });
    
    // Remove from DOM
    document.body.removeChild(ticketElement);
    
    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/png');
    });
  } catch (error) {
    console.error('Error generating ticket image:', error);
    return null;
  }
}
