"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Download, MapPin } from "lucide-react";
import QRCode from "qrcode";
import { Registrant, Ticket } from "@/lib/types";
import Image from "next/image";
import { Button } from "../ui/button";
import html2canvas from "html2canvas";

interface TicketGeneratorProps {
  registrant: Registrant;
  existingTicket?: Ticket;
}

export function TicketGenerator({ registrant }: TicketGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generateQRCode = async () => {
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
        setQrCodeUrl(url);
      } catch (error) {
        console.error('QR code generation error:', error);
      }
    };

    generateQRCode();
  }, [registrant]);

  const handleSaveTicket = () => {
    if (typeof window !== 'undefined' && ticketRef.current) {
      html2canvas(ticketRef.current, {
        useCORS: true,
        allowTaint: true,
        scale: 2, // Higher resolution
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
        removeContainer: true
      }).then(canvas => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png', 1.0); // Max quality
        link.download = `DaiHoiCongGiao2025-Ticket-${registrant.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }).catch(error => {
        console.error('Error generating ticket image:', error);
        alert('Có lỗi xảy ra khi tạo ảnh vé. Vui lòng thử lại.');
      });
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto font-sans">
      <Card ref={ticketRef} className="bg-white shadow-lg rounded-2xl overflow-hidden">
        <div className={(registrant.event_role_id ? "bg-blue-500 " : "bg-green-500 ") + `text-white p-4 text-center`}>
          <h1 className="text-xl font-bold">ĐẠI HỘI NĂM THÁNH TOÀN QUỐC 2025</h1>
        </div>
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            {registrant.portrait_url && (
              <div className="size-48 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100">
                <Image
                  src={registrant.portrait_url}
                  alt="Portrait"
                  width={192}
                  height={192}
                  className="object-cover w-full h-full"
                  crossOrigin="anonymous"
                  priority
                  unoptimized
                />
              </div>
            )}
            <div className="text-center">
              {registrant.saint_name && <p className="text-gray-500">({registrant.saint_name})</p>}
              <p className="text-2xl font-semibold">{registrant.full_name}</p>
              {registrant.second_day_only && (
                <div className="mt-2 inline-block px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full border border-orange-200">
                  Chỉ tham dự :
                  {new Date(registrant.selected_attendance_day || '2025-09-15').toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center text-gray-600">
              <MapPin className="w-5 h-5 mr-2" />
              <span>Kamiozuki, Hanado, Kanagawa</span>
            </div>

            {qrCodeUrl && (
              <div className="p-2 bg-white rounded-lg border">
                <Image
                  src={qrCodeUrl}
                  alt="QR Code"
                  width={200}
                  height={200}
                />
              </div>
            )}
            
            <div className="text-center text-sm text-gray-500 pt-2">
              <p>Sử dụng mã QR này để check-in tại sự kiện.</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="p-4 bg-gray-50 border-t">
          <Button onClick={handleSaveTicket} className="w-full" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Lưu vé vào máy
          </Button>
      </div>
    </div>
  );
}
