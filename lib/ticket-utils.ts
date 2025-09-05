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



// Helper function to get optimal object position for avatar images
  const getOptimalObjectPosition = async (imageUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        
        if (aspectRatio < 0.8) {
          // Portrait image (taller than wide) - focus on upper part for faces
          resolve('center 25%');
        } else if (aspectRatio > 1.2) {
          // Landscape image (wider than tall) - center it
          resolve('center center');
        } else {
          // Square-ish image (0.8-1.2) - keep as center, user cropped it correctly
          resolve('center center');
        }
      };
      
      img.onerror = () => {
        // Fallback to center for any errors
        resolve('center center');
      };
      
      // Set a timeout to avoid hanging
      setTimeout(() => resolve('center center'), 5000);
      
      img.src = imageUrl;
    });
  };

export const generateBadgeImage = async (registrant: Registrant): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Tạo element tạm thời để render badge
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        tempDiv.style.width = '400px';
        tempDiv.style.height = '600px';
        tempDiv.style.fontFamily = 'Arial, sans-serif';

        // Determine background type - SAME AS BadgeGenerator
        const isOrganizer = registrant.event_role?.name;
        const backgroundImage = isOrganizer
          ? '/assets/organizer-with-photo.png'
          : '/assets/no-organizer.png';

        // Escape HTML to prevent template string issues
        const escapeHtml = (text: string) => {
          return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        };

        const safeName = escapeHtml(registrant.full_name);
        const safeSaintName = registrant.saint_name ? escapeHtml(registrant.saint_name) : '';
        const safeRoleName = registrant.event_role?.name ? escapeHtml(registrant.event_role.name) : '';

        // Get optimal object position for portrait images
        const objectPosition = registrant.portrait_url 
          ? await getOptimalObjectPosition(registrant.portrait_url)
          : 'center';

        // Create EXACT same structure as BadgeGenerator
        const htmlContent = `
          <div style="position: relative; width: 400px; height: 600px; font-family: Arial, sans-serif;">
            <!-- Background Image -->
            <img src="${backgroundImage}" alt="Badge background" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0;" crossorigin="anonymous" />

            <!-- Content overlay -->
            <div style="height: 100%; display: flex; flex-direction: column; position: relative; z-index: 10;">
              <!-- Section 1: Top 1/3 (200px) - Text Information -->
              <div style="display: flex; flex-direction: column; align-items: center; padding: 0 24px; text-align: center; height: 200px;">
                ${isOrganizer ? `
                  <!-- Organizer layout với spacing đều nhau -->
                  <div style="height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
                    <!-- Saint name - phần trên -->
                    <div style="color: #1e40af; font-weight: bold; display: flex; align-items: center; justify-content: center; font-size: 24px; height: 60px;">
                      ${safeSaintName || '\u00A0'}
                    </div>

                    <!-- Full name - phần giữa -->
                    <div style="color: #1e40af; font-weight: bold; line-height: 1.2; display: flex; align-items: center; justify-content: center; font-size: 28px; height: 60px;">
                      ${safeName.toUpperCase()}
                    </div>

                    <!-- Role - phần dưới, aligned to right -->
                    <div style="height: 60px; width: 100%; display: flex; align-items: center;">
                      <!-- Div trống bên trái chiếm hết chiều ngang -->
                      <div style="flex: 1;"></div>
                      <!-- Badge bên phải -->
                      ${registrant.event_role?.name ? `
                        <div data-role-badge style="background-color: white; border: 2px solid #16a34a; border-radius: 9999px; padding: 0 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); display: flex; align-items: center; justify-content: center; text-align: center; height: 40px; white-space: nowrap; color: #15803d; font-weight: bold; font-size: 16px; line-height: 1;">
                          ${safeRoleName.toUpperCase()}
                        </div>
                      ` : ''}
                    </div>
                  </div>
                ` : `
                  <!-- Regular participant layout -->
                  <!-- Team name section temporarily disabled for build -->

                  <!-- Saint name - always reserve space -->
                  <div style="color: #1e40af; font-weight: bold; margin-bottom: 12px; height: 25%; display: flex; align-items: center; justify-content: center; font-size: 24px;">
                    ${safeSaintName || '\u00A0'}
                  </div>

                  <!-- Full name -->
                  <div style="color: #1e40af; font-weight: bold; line-height: 1.2; margin-bottom: 12px; height: 25%; display: flex; align-items: center; justify-content: center; font-size: 28px;">
                    ${safeName.toUpperCase()}
                  </div>

                  <!-- Participant badge - aligned to right -->
                  <div style="width: 100%; display: flex;">
                    <!-- Div trống bên trái chiếm hết chiều ngang -->
                    <div style="flex: 1;"></div>
                    <!-- Badge bên phải -->
                    <div data-role-badge style="background-color: white; border: 2px solid #16a34a; border-radius: 9999px; padding: 0 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); display: flex; align-items: center; justify-content: center; text-align: center; height: 40px; white-space: nowrap; color: #15803d; font-weight: bold; font-size: 16px; line-height: 1;">
                      THAM DỰ VIÊN
                    </div>
                  </div>
                `}
              </div>

              <!-- Section 2: Middle 1/2 (300px) - Avatar or Logo -->
              <div style="display: flex; align-items: center; justify-content: center; padding: 0 24px; height: 300px;">
                ${registrant.portrait_url ? `
                  <!-- Avatar - circular, 60% width of card (240px) -->
                  <div style="width: 240px; height: 240px; border-radius: 50%; overflow: hidden; border: 2px solid white; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); position: relative;">
                    <img src="${registrant.portrait_url}" alt="${safeName} portrait" crossorigin="anonymous" style="width: 100%; height: 100%; object-fit: cover; object-position: ${objectPosition}; display: block;" />
                  </div>
                ` : `
                  <!-- Fallback Logo - circular, 60% width of card (240px) -->
                  <div style="width: 240px; height: 240px; border-radius: 50%; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); position: relative;">
                    <img src="/logo-dh-2025.jpg" alt="Logo Đại hội Năm Thánh 2025" crossorigin="anonymous" style="width: 100%; height: 100%; object-fit: cover; object-position: center; display: block;" />
                  </div>
                `}
              </div>

              <!-- Section 3: Bottom 1/6 (100px) - Empty (background only) -->
              <div style="height: 100px;">
                <!-- Empty section - only background image visible -->
              </div>
            </div>
          </div>
        `;

        // Set innerHTML and validate
        tempDiv.innerHTML = htmlContent;

        document.body.appendChild(tempDiv);

        // Wait for images to load - SAME AS BadgeGenerator
        const images = tempDiv.querySelectorAll('img');
        await Promise.all(
          Array.from(images).map((img) => {
            return new Promise((resolve, reject) => {
              if (img.complete) {
                resolve(img);
              } else {
                img.onload = () => resolve(img);
                img.onerror = reject;
                // Timeout sau 10s
                setTimeout(() => resolve(img), 10000);
              }
            });
          })
        );

        // Capture with html2canvas - SAME SETTINGS AS BadgeGenerator
        const html2canvas = (await import('html2canvas')).default;
        const firstElement = tempDiv.firstElementChild;
        if (!firstElement) {
          throw new Error(`No element found to capture for ${registrant.full_name}`);
        }
        const canvasResult = await html2canvas(firstElement as HTMLElement, {
          scale: 4,
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: true,
          imageTimeout: 30000,
          logging: false,
          // Cải thiện quality cho ảnh
          foreignObjectRendering: false,
          removeContainer: true,
          // Đảm bảo font và ảnh được load đúng
          onclone: (clonedDoc) => {
            // Đảm bảo font family được áp dụng đúng
            const clonedElement = clonedDoc.querySelector('[data-badge-content]') as HTMLElement;
            if (clonedElement) {
              clonedElement.style.fontFamily = 'Arial, sans-serif';
            }

            // Đảm bảo tất cả ảnh có crossOrigin và object-fit
            const images = clonedDoc.querySelectorAll('img');
            images.forEach((img) => {
              if (!img) return;
              img.crossOrigin = 'anonymous';
              if (img.style && img.style.objectFit === 'cover') {
                img.style.objectFit = 'cover';
                img.style.objectPosition = 'center';
              }
            });

            // CRITICAL: Role badge SVG rendering
            const roleBadges = clonedDoc.querySelectorAll('[data-role-badge]');

            roleBadges.forEach((badge) => {
              if (!badge) return;
              const badgeElement = badge as HTMLElement;
              if (!badgeElement) return;
              const w = badgeElement.offsetWidth;
              const h = badgeElement.offsetHeight || 40;
              const label = (badgeElement.textContent || '').trim();

              // Clear HTML content and setup for SVG
              badgeElement.style.display = 'block';
              badgeElement.style.alignItems = '';
              badgeElement.style.justifyContent = '';
              badgeElement.style.textAlign = '';
              badgeElement.style.height = h + 'px';
              badgeElement.style.lineHeight = '1';
              badgeElement.style.paddingLeft = '0px';
              badgeElement.style.paddingRight = '0px';
              badgeElement.style.border = 'none';
              badgeElement.innerHTML = '';

              // Create SVG replacement
              const svgNS = 'http://www.w3.org/2000/svg';
              const svg = clonedDoc.createElementNS(svgNS, 'svg');
              svg.setAttribute('width', String(w));
              svg.setAttribute('height', String(h));
              svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

              const rect = clonedDoc.createElementNS(svgNS, 'rect');
              rect.setAttribute('x', '1');
              rect.setAttribute('y', '1');
              rect.setAttribute('width', String(Math.max(0, w - 2)));
              rect.setAttribute('height', String(Math.max(0, h - 2)));
              rect.setAttribute('rx', String(h / 2));
              rect.setAttribute('ry', String(h / 2));
              rect.setAttribute('fill', 'white');
              rect.setAttribute('stroke', '#16a34a');
              rect.setAttribute('stroke-width', '2');

              const text = clonedDoc.createElementNS(svgNS, 'text');
              text.setAttribute('x', '50%');
              text.setAttribute('y', '50%');
              text.setAttribute('dominant-baseline', 'middle');
              text.setAttribute('text-anchor', 'middle');
              text.setAttribute('fill', '#15803d');
              text.setAttribute('font-family', 'Arial, sans-serif');
              text.setAttribute('font-weight', '700');
              text.setAttribute('font-size', '16');
              text.textContent = label;

              svg.appendChild(rect);
              svg.appendChild(text);
              badgeElement.appendChild(svg);
            });

            // Font size scaling compensation for scale = 4
            const textDivs = clonedDoc.querySelectorAll('div.text-blue-800[style*="fontSize"]');
            textDivs.forEach((textElement) => {
              if (!textElement) return;
              const element = textElement as HTMLElement;
              if (!element || !element.style) return;
              const style = element.style.fontSize;
              if (style === '24px') {
                element.style.fontSize = '6px'; // 24/4 = 6
              } else if (style === '28px') {
                element.style.fontSize = '7px'; // 28/4 = 7
              }
            });
          }
        });

        document.body.removeChild(tempDiv);

        const imageUrl = canvasResult.toDataURL('image/png');
        resolve(imageUrl);
      } catch (error) {
        console.error('Error generating badge for', registrant.full_name, error);
        reject(error);
      }
    });
  };