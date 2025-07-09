"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, Download, RefreshCw } from "lucide-react";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Registrant, Ticket } from "@/lib/types";

interface TicketGeneratorProps {
  registrant: Registrant;
  existingTicket?: Ticket;
}

export function TicketGenerator({ registrant, existingTicket }: TicketGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [ticketPreview, setTicketPreview] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (existingTicket) {
      setQrCodeUrl(`data:image/png;base64,${existingTicket.qr_code}`);
    }
  }, [existingTicket]);

  const generateQRCode = async () => {
    try {
      // Create QR code data with registrant info
      const qrData = {
        id: registrant.id,
        name: registrant.full_name,
        email: registrant.email,
        event: "Đại hội Công giáo Việt Nam 2025",
        timestamp: new Date().toISOString()
      };

      const qrString = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrCodeUrl(qrString);
      return qrString;
    } catch (error) {
      console.error('QR code generation error:', error);
      throw error;
    }
  };

  const generateTicket = async () => {
    setIsGenerating(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not found");

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas context not found");

      // Set canvas size
      canvas.width = 800;
      canvas.height = 500;

      // Generate QR code if not exists
      let qrCode = qrCodeUrl;
      if (!qrCode) {
        qrCode = await generateQRCode();
      }

      // Draw ticket background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw border
      ctx.strokeStyle = '#e5e5e5';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      // Draw header
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('ĐẠI HỘI CÔNG GIÁO VIỆT NAM TẠI NHẬT BẢN 2025', canvas.width / 2, 50);

      // Draw participant info
      ctx.font = '18px Arial';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#374151';
      
      const infoY = 120;
      const lineHeight = 30;
      
      ctx.fillText(`Họ và tên: ${registrant.full_name}`, 50, infoY);
      if (registrant.saint_name) {
        ctx.fillText(`Tên thánh: ${registrant.saint_name}`, 50, infoY + lineHeight);
      }
      ctx.fillText(`Email: ${registrant.email}`, 50, infoY + lineHeight * 2);
      ctx.fillText(`Giáo phận: ${registrant.diocese}`, 50, infoY + lineHeight * 3);

      // Draw QR code
      const qrImg = new Image();
      qrImg.onload = async () => {
        ctx.drawImage(qrImg, canvas.width - 220, 100, 180, 180);
        
        // Draw portrait if available
        if (registrant.portrait_url) {
          const portraitImg = new Image();
          portraitImg.crossOrigin = 'anonymous';
          portraitImg.onload = async () => {
            // Draw portrait in a circle
            ctx.save();
            ctx.beginPath();
            ctx.arc(150, 350, 60, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(portraitImg, 90, 290, 120, 120);
            ctx.restore();
            
            // Draw circle border
            ctx.strokeStyle = '#e5e5e5';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(150, 350, 60, 0, Math.PI * 2);
            ctx.stroke();

            await saveTicket(canvas);
          };
          portraitImg.src = registrant.portrait_url;
        } else {
          await saveTicket(canvas);
        }
      };
      qrImg.src = qrCode;

    } catch (error) {
      console.error('Ticket generation error:', error);
      toast.error("Có lỗi xảy ra khi tạo vé");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveTicket = async (canvas: HTMLCanvasElement) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Không thể xác thực người dùng");

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png');
      });

      // Upload ticket image to storage
      const fileName = `${user.id}/${registrant.id}-ticket.png`;
      const { error: uploadError } = await supabase.storage
        .from('tickets')
        .upload(fileName, blob, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('tickets')
        .getPublicUrl(fileName);

      // Save ticket record to database
      const ticketData = {
        registrant_id: registrant.id,
        qr_code: qrCodeUrl.split(',')[1], // Remove data:image/png;base64, prefix
        ticket_url: publicUrl
      };

      if (existingTicket) {
        const { error } = await supabase
          .from('tickets')
          .update(ticketData)
          .eq('id', existingTicket.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tickets')
          .insert(ticketData);
        if (error) throw error;
      }

      setTicketPreview(canvas.toDataURL());
      toast.success("Tạo vé thành công!");

    } catch (error) {
      console.error('Save ticket error:', error);
      toast.error("Có lỗi khi lưu vé");
    }
  };

  const downloadTicket = () => {
    if (!ticketPreview && !existingTicket?.ticket_url) {
      toast.error("Chưa có vé để tải xuống");
      return;
    }

    const link = document.createElement('a');
    link.download = `ve-${registrant.full_name.replace(/\s+/g, '-')}.png`;
    link.href = ticketPreview || existingTicket?.ticket_url || '';
    link.click();
  };

  const downloadPDF = () => {
    if (!ticketPreview && !existingTicket?.ticket_url) {
      toast.error("Chưa có vé để tải xuống");
      return;
    }

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    pdf.addImage(
      ticketPreview || existingTicket?.ticket_url || '',
      'PNG',
      10,
      10,
      277,
      173
    );

    pdf.save(`ve-${registrant.full_name.replace(/\s+/g, '-')}.pdf`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Vé tham gia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Canvas for ticket generation (hidden) */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />

        {/* Ticket Preview */}
        {(ticketPreview || existingTicket?.ticket_url) && (
          <div className="border rounded-lg p-4 bg-muted/50">
            <img
              src={ticketPreview || existingTicket?.ticket_url}
              alt="Ticket Preview"
              className="w-full max-w-md mx-auto rounded border"
            />
          </div>
        )}

        {/* QR Code Preview */}
        {qrCodeUrl && (
          <div className="text-center">
            <img
              src={qrCodeUrl}
              alt="QR Code"
              className="w-32 h-32 mx-auto border rounded"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Mã QR để check-in
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={generateTicket}
            disabled={isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Đang tạo...
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4 mr-2" />
                {existingTicket ? 'Tạo lại vé' : 'Tạo vé'}
              </>
            )}
          </Button>

          {(ticketPreview || existingTicket?.ticket_url) && (
            <>
              <Button
                variant="outline"
                onClick={downloadTicket}
              >
                <Download className="h-4 w-4 mr-2" />
                Tải PNG
              </Button>
              <Button
                variant="outline"
                onClick={downloadPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                Tải PDF
              </Button>
            </>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          <p>• Vé sẽ được sử dụng để check-in tại sự kiện</p>
          <p>• Vui lòng mang theo vé (in ra hoặc hiển thị trên điện thoại)</p>
          <p>• Mã QR chứa thông tin cá nhân để xác minh</p>
        </div>
      </CardContent>
    </Card>
  );
}
