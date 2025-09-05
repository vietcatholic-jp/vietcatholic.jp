"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";


interface BadgeData {
  id: string;
  full_name: string;
  saint_name?: string;
  team_name?: string;
  portrait_url?: string | null;
  event_role?: {
    name: string;
    description?: string;
  };
}

// AutoSizeText component - giống AutoSizeText trong Flutter
interface AutoSizeTextProps {
  text: string;
  className?: string;
  maxFontSize?: number;
  minFontSize?: number;
  containerWidth?: number;
}

const AutoSizeText: React.FC<AutoSizeTextProps> = ({
  text,
  className = "",
  maxFontSize = 24,
  minFontSize = 12,
  containerWidth = 300
}) => {
  const [fontSize, setFontSize] = useState(maxFontSize);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const adjustFontSize = () => {
      if (!textRef.current) return;

      let currentSize = maxFontSize;
      textRef.current.style.fontSize = `${currentSize}px`;

      // Giảm font size cho đến khi text vừa với container
      while (textRef.current.scrollWidth > containerWidth && currentSize > minFontSize) {
        currentSize -= 1;
        textRef.current.style.fontSize = `${currentSize}px`;
      }

      setFontSize(currentSize);
    };

    adjustFontSize();

    // Điều chỉnh lại khi window resize
    window.addEventListener('resize', adjustFontSize);
    return () => window.removeEventListener('resize', adjustFontSize);
  }, [text, maxFontSize, minFontSize, containerWidth]);

  return (
    <span
      ref={textRef}
      className={`whitespace-nowrap ${className}`}
      style={{
        fontSize: `${fontSize}px`,
        lineHeight: '1.4',
        display: 'block',
        width: '100%',
        textAlign: 'center',
        overflow: 'visible'
      }}
    >
      {text}
    </span>
  );
};

interface BadgeGeneratorProps {
  registrant: BadgeData;
  onDownload?: (imageUrl: string) => void;
  isTestPage?: boolean; // For test page specific styling
}

export function BadgeGenerator({ registrant, onDownload, isTestPage = false }: BadgeGeneratorProps) {
  const badgeRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Determine background type
  const isOrganizer = registrant.event_role?.name;
  const backgroundImage = isOrganizer
    ? '/assets/organizer-with-photo.png'
    : '/assets/no-organizer.png';





  const handleGenerateBadge = async () => {
    setIsGenerating(true);
    try {
      const html2canvas = (await import('html2canvas')).default;

      // Sử dụng chính element hiển thị trên web thay vì tạo element mới
      if (!badgeRef.current) {
        throw new Error('Badge element not found');
      }

      // Đảm bảo tất cả ảnh đã load xong trước khi capture
      const images = badgeRef.current.querySelectorAll('img');
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

      const canvas = await html2canvas(badgeRef.current, {
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
            img.crossOrigin = 'anonymous';
            // Đảm bảo object-fit: cover hoạt động
            if (img.style.objectFit === 'cover') {
              img.style.objectFit = 'cover';
              img.style.objectPosition = 'center';
            }
          });

          // Đảm bảo line-height alignment hoạt động đúng cho role badges
          const roleBadges = clonedDoc.querySelectorAll('[data-role-badge]');
          roleBadges.forEach((badge) => {
            const badgeElement = badge as HTMLElement;
            const w = badgeElement.offsetWidth;
            const h = badgeElement.offsetHeight || 40;
            const label = (badgeElement.textContent || '').trim();

            // Giữ box-shadow/border của wrapper, nhưng bỏ padding để tránh lệch khi render
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

          // Đảm bảo AutoSizeText hiển thị đầy đủ khi export
          const autoSizeTexts = clonedDoc.querySelectorAll('span[style*="fontSize"]');
          autoSizeTexts.forEach((textElement) => {
            const spanElement = textElement as HTMLElement;
            if (spanElement.textContent && spanElement.textContent.trim()) {
              spanElement.style.overflow = 'visible';
              spanElement.style.lineHeight = '1.4';
              spanElement.style.paddingTop = '2px';
              spanElement.style.paddingBottom = '2px';
            }
          });

          // Đảm bảo spacing đều nhau cho organizer layout khi export
          const organizerContainers = clonedDoc.querySelectorAll('div[style*="justify-between"]');
          organizerContainers.forEach((container) => {
            const containerElement = container as HTMLElement;
            containerElement.style.display = 'flex';
            containerElement.style.flexDirection = 'column';
            containerElement.style.justifyContent = 'space-between';
            containerElement.style.alignItems = 'center';
            containerElement.style.height = '200px';

            // Đảm bảo các child elements có height cố định
            const children = containerElement.children;
            for (let i = 0; i < children.length; i++) {
              const child = children[i] as HTMLElement;
              if (child.style.height === '60px') {
                child.style.display = 'flex';
                child.style.alignItems = 'center';
                child.style.justifyContent = child.style.justifyContent || 'center';
              }
            }
          });

          // Điều chỉnh font size để bù trừ cho scale = 4
          const SCALE_FACTOR = 4;

          // Điều chỉnh font size cho các text elements cụ thể

          // 1. Saint name và Full name (có fontSize trong style)
          const textDivs = clonedDoc.querySelectorAll('div.text-blue-800[style*="fontSize"]');
          textDivs.forEach((textElement) => {
            if (!textElement) return;
            const element = textElement as HTMLElement;
            if (!element || !element.style) return;
            const style = element.style.fontSize;
            if (style === '24px') { // Saint name
              element.style.fontSize = '6px'; // 24/4 = 6
            } else if (style === '28px') { // Full name
              element.style.fontSize = '7px'; // 28/4 = 7
            }
          });

          // 2. Role badge text (fontSize: 16px)
          const roleBadgeTexts = clonedDoc.querySelectorAll('[data-role-badge][style*="fontSize: 16px"]');
          roleBadgeTexts.forEach((badge) => {
            if (!badge) return;
            const badgeElement = badge as HTMLElement;
            if (!badgeElement || !badgeElement.style) return;
            badgeElement.style.fontSize = '4px'; // 16/4 = 4
          });

          // 3. AutoSizeText elements (dynamic fontSize)
          const autoSizeSpans = clonedDoc.querySelectorAll('span[style*="fontSize"][style*="lineHeight: 1.4"]');
          autoSizeSpans.forEach((span) => {
            if (!span) return;
            const spanElement = span as HTMLElement;
            if (!spanElement || !spanElement.style) return;
            const currentSize = spanElement.style.fontSize;
            if (currentSize && currentSize.includes('px')) {
              const sizeValue = parseInt(currentSize.replace('px', ''));
              spanElement.style.fontSize = `${sizeValue / SCALE_FACTOR}px`;
            }
          });
        }
      });

      const imageUrl = canvas.toDataURL('image/png');

      if (onDownload) {
        onDownload(imageUrl);
      } else {
        // Default download behavior
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `Badge-${registrant.full_name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error generating badge:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Badge Design */}
      <div
        ref={badgeRef}
        data-badge-content
        className={`relative ${isTestPage ? 'border-2 border-gray-400' : ''}`}
        style={{
          width: '400px',
          height: '600px',
          fontFamily: 'Arial, sans-serif',
          position: 'relative'
        }}
      >
        {/* Background Image as IMG element for better html2canvas compatibility */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={backgroundImage}
          alt="Badge background"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0
          }}
          crossOrigin="anonymous"
        />
        {/* Content overlay */}
        <div className="h-full flex flex-col relative z-10">
            {/* Section 1: Top 1/3 (200px) - Text Information */}
            <div className="flex flex-col items-center px-6 text-center" style={{ height: '200px' }}>
              {isOrganizer ? (
                /* Organizer layout với spacing đều nhau */
                <div className="h-full flex flex-col justify-between">
                  {/* Saint name - phần trên */}
                  <div className="text-blue-800 font-bold flex items-center justify-center" style={{ fontSize: '24px', height: '60px' }}>
                    {registrant.saint_name || '\u00A0'}
                  </div>

                  {/* Full name - phần giữa */}
                  <div className="text-blue-800 font-bold leading-tight flex items-center justify-center" style={{ fontSize: '28px', height: '60px' }}>
                    {registrant.full_name.toUpperCase()}
                  </div>

                  {/* Role - phần dưới, aligned to right */}
                  {/* Role container với height cố định */}
                  <div style={{ height: '60px', width: '100%', display: 'flex', alignItems: 'center' }}>
                    {/* Div trống bên trái chiếm hết chiều ngang */}
                    <div style={{ flex: 1 }}></div>
                    {/* Badge bên phải */}
                    {registrant.event_role?.name && (
                      <div
                        data-role-badge
                        style={{
                          backgroundColor: 'white',
                          border: '2px solid #16a34a',
                          borderRadius: '9999px',
                          paddingLeft: '24px',
                          paddingRight: '24px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          height: '40px',
                          whiteSpace: 'nowrap',
                          color: '#15803d',
                          fontWeight: 'bold',
                          fontSize: '16px',
                          lineHeight: 1,
                        }}
                      >
                        {registrant.event_role.name.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Regular participant layout, mỗi 1 item chiếm 1/3 chiều cao cố định, chữ dc căn giữa theo trục ngang và dọc */
                <>
                  {/* Team name, 1/3 chiều cao, tối đa 1 dòng */}
                  {registrant.team_name && (
                    /* Tối đa 1 dòng text, tự co nhỏ text theo kích thước (giống tính năng auto_size_text Flutter)*/
                    <div className="text-blue-800 font-bold mb-2 flex items-center justify-center max-w-full" style={{ minHeight: '50px', paddingTop: '5px', paddingBottom: '5px' }}>
                      <AutoSizeText
                        text={registrant.team_name.toUpperCase()}
                        className="text-blue-800 font-bold"
                        maxFontSize={20}
                        minFontSize={12}
                        containerWidth={350} // Chiều rộng container badge (400px - padding)
                      />
                    </div>
                  )}

                  {/* Saint name - always reserve space, 1/3 chiều cao, item */}
                  <div className="text-blue-800 font-bold mb-3 h-1/4 flex items-center justify-center" style={{ fontSize: '24px' }}>
                    {registrant.saint_name || '\u00A0'}
                  </div>

                  {/* Full name, 1/3 chiều cao, item */}
                  <div className="text-blue-800 font-bold leading-tight mb-3 h-1/4 flex items-center justify-center" style={{ fontSize: '28px' }}>
                    {registrant.full_name.toUpperCase()}
                  </div>
                  {/* Participant badge - aligned to right, and in bottom of section 1 */}
                  <div style={{ width: '100%', display: 'flex' }}>
                    {/* Div trống bên trái chiếm hết chiều ngang */}
                    <div style={{ flex: 1 }}></div>
                    {/* Badge bên phải */}
                    <div
                      data-role-badge
                      style={{
                        backgroundColor: 'white',
                        border: '2px solid #16a34a',
                        borderRadius: '9999px',
                        paddingLeft: '24px',
                        paddingRight: '24px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        height: '40px',
                        whiteSpace: 'nowrap',
                        color: '#15803d',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        lineHeight: 1,
                      }}
                    >
                      THAM DỰ VIÊN
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Section 2: Middle 1/2 (300px) - Avatar or Logo */}
            <div className="flex items-center justify-center px-6" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {registrant.portrait_url ? (
                /* Avatar - circular, 60% width of card (240px) */
                <div
                  className="overflow-hidden border-2 border-white shadow-xl"
                  style={{
                    width: '240px',
                    height: '240px',
                    borderRadius: '50%',
                    position: 'relative'
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={registrant.portrait_url}
                    alt={`${registrant.full_name} portrait`}
                    crossOrigin="anonymous"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      display: 'block'
                    }}
                  />
                </div>
              ) : (
                /* Fallback Logo - circular, 60% width of card (240px) */
                <div
                  className="overflow-hidden shadow-xl"
                  style={{
                    width: '240px',
                    height: '240px',
                    borderRadius: '50%',
                    position: 'relative'
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo-dh-2025.jpg"
                    alt="Logo Đại hội Năm Thánh 2025"
                    crossOrigin="anonymous"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      display: 'block'
                    }}
                  />
                </div>
              )}
            </div>

          {/* Section 3: Bottom 1/6 (100px) - Empty (background only) */}
          <div style={{ height: '100px' }}>
            {/* Empty section - only background image visible */}
          </div>
        </div>
      </div>

      {/* Download Button */}
      <Button 
        onClick={handleGenerateBadge} 
        disabled={isGenerating}
        className="w-full max-w-md"
      >
        <Download className="w-4 h-4 mr-2" />
        {isGenerating ? 'Đang tạo...' : 'Tải ảnh thẻ'}
      </Button>
    </div>
  );
}
