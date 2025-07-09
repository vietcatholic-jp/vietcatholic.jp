"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  X,
  AlertCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface ReceiptUploadProps {
  invoiceCode: string;
  hasExistingReceipts: boolean;
}

export function ReceiptUpload({ 
  invoiceCode, 
  hasExistingReceipts 
}: ReceiptUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedReceipts, setUploadedReceipts] = useState<string[]>([]);
  const supabase = createClient();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Filter for valid file types
    const validFiles = acceptedFiles.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB limit
    });

    if (validFiles.length !== acceptedFiles.length) {
      toast.error("Một số file không hợp lệ. Chỉ chấp nhận JPG, PNG, PDF dưới 10MB");
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (uploadedFiles.length === 0) {
      toast.error("Vui lòng chọn file để upload");
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Không thể xác thực người dùng");

      // Upload files to storage first
      const uploadPromises = uploadedFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${invoiceCode}/${Date.now()}.${fileExt}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('receipts')
          .getPublicUrl(uploadData.path);

        return {
          path: uploadData.path,
          url: publicUrl,
          fileName: file.name,
          size: file.size
        };
      });

      const uploadedData = await Promise.all(uploadPromises);
      
      // Use the payments API to create receipt record
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceCode,
          receiptUrl: uploadedData[0].url, // Use first uploaded file
          amount: 6000, // This should be calculated based on registration
          notes: uploadedData.length > 1 ? `Multiple files uploaded: ${uploadedData.map(d => d.fileName).join(', ')}` : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit payment');
      }
      
      setUploadedReceipts(prev => [...prev, ...uploadedData.map(d => d.path)]);
      setUploadedFiles([]);
      
      toast.success("Upload hóa đơn thành công! Đăng ký sẽ được xem xét trong vòng 24 giờ.");
      
      // Refresh the page to show updated status
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra khi upload. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload hóa đơn thanh toán
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasExistingReceipts ? (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800">
              Bạn đã upload hóa đơn. Đăng ký đang được xem xét.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-800">
              Vui lòng upload hóa đơn thanh toán để hoàn tất đăng ký
            </span>
          </div>
        )}

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          {isDragActive ? (
            <p className="text-primary">Thả file vào đây...</p>
          ) : (
            <div>
              <p className="text-lg font-medium mb-2">
                Kéo thả file hoặc click để chọn
              </p>
              <p className="text-sm text-muted-foreground">
                Hỗ trợ JPG, PNG, PDF (tối đa 10MB mỗi file)
              </p>
            </div>
          )}
        </div>

        {/* File List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">File đã chọn:</h4>
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{file.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {(file.size / 1024 / 1024).toFixed(1)}MB
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {uploadedFiles.length > 0 && (
          <Button 
            onClick={uploadFiles} 
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? "Đang upload..." : `Upload ${uploadedFiles.length} file`}
          </Button>
        )}

        {/* Successfully uploaded files */}
        {uploadedReceipts.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-green-700">File đã upload thành công:</h4>
            {uploadedReceipts.map((path, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">
                  Hóa đơn {index + 1} - {path.split('/').pop()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Upload ảnh chụp màn hình xác nhận chuyển khoản hoặc hóa đơn ngân hàng</p>
          <p>• Đảm bảo thông tin tài khoản và số tiền hiển thị rõ ràng</p>
          <p>• Có thể upload nhiều file nếu cần</p>
        </div>
      </CardContent>
    </Card>
  );
}
