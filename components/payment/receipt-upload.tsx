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
  AlertCircle,
  Zap,
  Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { 
  compressImages, 
  formatFileSize, 
  shouldCompressFile,
  DEFAULT_RECEIPT_COMPRESSION,
  type CompressionResult 
} from "@/lib/image-compression";

interface ReceiptUploadProps {
  invoiceCode: string;
  hasExistingReceipts: boolean;
}

export function ReceiptUpload({ 
  invoiceCode, 
  hasExistingReceipts 
}: ReceiptUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [compressedFiles, setCompressedFiles] = useState<CompressionResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadedReceipts, setUploadedReceipts] = useState<string[]>([]);
  const supabase = createClient();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Filter for valid file types
    const validFiles = acceptedFiles.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB limit
    });

    if (validFiles.length !== acceptedFiles.length) {
      toast.error("Một số file không hợp lệ. Chỉ chấp nhận JPG, PNG, PDF dưới 10MB");
    }

    if (validFiles.length === 0) return;

    setUploadedFiles(prev => [...prev, ...validFiles]);

    // Check if any files need compression
    const filesToCompress = validFiles.filter(file => shouldCompressFile(file));
    
    if (filesToCompress.length > 0) {
      setIsCompressing(true);
      toast.info(`🔧 Đang nén ${filesToCompress.length} ảnh để tối ưu kích thước...`);
      
      try {
        const compressionResults = await compressImages(validFiles, DEFAULT_RECEIPT_COMPRESSION);
        setCompressedFiles(prev => [...prev, ...compressionResults]);
        
        const totalOriginalSize = compressionResults.reduce((sum, result) => sum + result.originalSize, 0);
        const totalCompressedSize = compressionResults.reduce((sum, result) => sum + result.compressedSize, 0);
        const savings = totalOriginalSize - totalCompressedSize;
        
        if (savings > 0) {
          toast.success(`✅ Nén ảnh thành công! Tiết kiệm ${formatFileSize(savings)} dung lượng`);
        }
      } catch (error) {
        console.error('Compression error:', error);
        toast.warning("Không thể nén ảnh, sẽ sử dụng ảnh gốc");
        // Create fallback compression results
        const fallbackResults = validFiles.map(file => ({
          file,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 0
        }));
        setCompressedFiles(prev => [...prev, ...fallbackResults]);
      } finally {
        setIsCompressing(false);
      }
    } else {
      // For non-image files, create compression results without actual compression
      const results = validFiles.map(file => ({
        file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 0
      }));
      setCompressedFiles(prev => [...prev, ...results]);
    }
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
    setCompressedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (compressedFiles.length === 0) {
      toast.error("Vui lòng chọn file để upload");
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Không thể xác thực người dùng");

      // Upload compressed files to storage
      const uploadPromises = compressedFiles.map(async (compressedResult, index) => {
        const originalFile = uploadedFiles[index];
        const fileToUpload = compressedResult.file;
        const fileExt = originalFile.name.split('.').pop();
        const fileName = `${user.id}/${invoiceCode}/${Date.now()}_${index}.${fileExt}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, fileToUpload);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('receipts')
          .getPublicUrl(uploadData.path);

        return {
          path: uploadData.path,
          url: publicUrl,
          fileName: originalFile.name,
          originalSize: compressedResult.originalSize,
          compressedSize: compressedResult.compressedSize,
          compressionRatio: compressedResult.compressionRatio
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
          notes: uploadedData.length > 1 
            ? `Multiple files uploaded: ${uploadedData.map(d => d.fileName).join(', ')}. Compression saved ${formatFileSize(uploadedData.reduce((sum, d) => sum + (d.originalSize - d.compressedSize), 0))} total.`
            : uploadedData[0].compressionRatio > 0 
              ? `File compressed from ${formatFileSize(uploadedData[0].originalSize)} to ${formatFileSize(uploadedData[0].compressedSize)} (${Math.round(uploadedData[0].compressionRatio * 100)}% reduction)`
              : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit payment');
      }
      
      setUploadedReceipts(prev => [...prev, ...uploadedData.map(d => d.path)]);
      setUploadedFiles([]);
      setCompressedFiles([]);
      
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
            <h4 className="font-medium flex items-center gap-2">
              File đã chọn:
              {isCompressing && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
            </h4>
            {uploadedFiles.map((file, index) => {
              const compressionResult = compressedFiles[index];
              const needsCompression = shouldCompressFile(file);
              
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg border">
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{file.name}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Gốc: {formatFileSize(file.size)}</span>
                        {compressionResult && compressionResult.compressionRatio > 0 && (
                          <>
                            <span>→</span>
                            <span className="text-green-600 font-medium">
                              Nén: {formatFileSize(compressionResult.compressedSize)}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              -{Math.round(compressionResult.compressionRatio * 100)}%
                            </Badge>
                          </>
                        )}
                        {needsCompression && !compressionResult && (
                          <Badge variant="outline" className="text-xs text-amber-600">
                            <Zap className="h-3 w-3 mr-1" />
                            Sẽ nén
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={isCompressing}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload Button */}
        {uploadedFiles.length > 0 && (
          <Button 
            onClick={uploadFiles} 
            disabled={isUploading || isCompressing}
            className="w-full"
          >
            {isUploading ? "Đang upload..." : 
             isCompressing ? "Đang nén ảnh..." : 
             `Upload ${uploadedFiles.length} file`}
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
          <p className="flex items-center gap-1 text-green-600">
            <Zap className="h-3 w-3" />
            Ảnh lớn sẽ được tự động nén để tối ưu tốc độ upload
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
