"use client";

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileImage, 
  CheckCircle, 
  X, 
  AlertCircle,
  Loader2,
  Camera
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { validateAvatarFile } from '@/lib/utils/avatar-validation';
import { formatFileSize } from '@/lib/image-compression';

export interface AvatarUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registrantId?: string; // Optional for future use
  registrantName: string;
  onUploadComplete: (file: File) => void;
  onCancel?: () => void;
}

/**
 * Desktop avatar upload dialog with drag-drop functionality
 * Handles file validation and preview before proceeding to crop
 */
export function AvatarUploadDialog({
  open,
  onOpenChange,
  registrantName,
  onUploadComplete,
  onCancel,
}: Omit<AvatarUploadDialogProps, 'registrantId'>) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsValidating(true);
    setValidationError(null);

    try {
      // Validate file
      const validation = validateAvatarFile(file);
      if (!validation.valid) {
        setValidationError(validation.error || 'Invalid file');
        setIsValidating(false);
        return;
      }

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setSelectedFile(file);
      
      toast.success('File đã được chọn thành công!');
    } catch (error) {
      console.error('File processing error:', error);
      setValidationError('Có lỗi xảy ra khi xử lý file');
    } finally {
      setIsValidating(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
    onDropRejected: (fileRejections) => {
      const rejection = fileRejections[0];
      if (rejection) {
        const error = rejection.errors[0];
        if (error.code === 'file-too-large') {
          setValidationError('File quá lớn. Vui lòng chọn file dưới 5MB');
        } else if (error.code === 'file-invalid-type') {
          setValidationError('Định dạng file không hỗ trợ. Vui lòng chọn JPG, PNG hoặc WEBP');
        } else {
          setValidationError('File không hợp lệ');
        }
      }
    }
  });

  const handleContinue = () => {
    if (selectedFile) {
      onUploadComplete(selectedFile);
    }
  };

  const handleCancel = () => {
    // Clean up preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationError(null);
    onCancel?.();
    onOpenChange(false);
  };

  const removeFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationError(null);
  };

  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Upload Avatar
          </DialogTitle>
          <DialogDescription>
            Chọn ảnh avatar cho <strong>{registrantName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Area */}
          {!selectedFile && (
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200',
                isDragActive && !isDragReject && 'border-primary bg-primary/5 scale-105',
                isDragReject && 'border-destructive bg-destructive/5',
                !isDragActive && 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/25'
              )}
            >
              <input {...getInputProps()} />
              
              {isValidating ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Đang xử lý file...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className={cn(
                    'h-8 w-8 transition-colors',
                    isDragActive && !isDragReject ? 'text-primary' : 'text-muted-foreground'
                  )} />
                  
                  {isDragActive ? (
                    isDragReject ? (
                      <p className="text-sm text-destructive">File không hợp lệ</p>
                    ) : (
                      <p className="text-sm text-primary">Thả ảnh vào đây...</p>
                    )
                  ) : (
                    <div>
                      <p className="text-sm font-medium mb-1">
                        Kéo thả ảnh hoặc click để chọn
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG, WEBP (tối đa 5MB)
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* File Preview */}
          {selectedFile && previewUrl && (
            <div className="space-y-3">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Avatar preview"
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <FileImage className="h-4 w-4 text-green-600" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{selectedFile.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type}
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Hợp lệ
                </Badge>
              </div>
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{validationError}</span>
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/50 rounded-lg">
            <p className="font-medium">Lưu ý:</p>
            <p>• Chọn ảnh chân dung rõ nét, chụp thẳng</p>
            <p>• Nền sáng, tránh bóng đổ</p>
            <p>• Ảnh sẽ được crop thành hình vuông (1:1)</p>
            <p>• Kích thước cuối cùng: 512x512px</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Hủy
          </Button>
          <Button 
            onClick={handleContinue} 
            disabled={!selectedFile || isValidating}
          >
            {isValidating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Tiếp tục crop'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}