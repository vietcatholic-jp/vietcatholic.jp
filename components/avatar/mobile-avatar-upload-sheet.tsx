"use client";

import React, { useState, useRef } from 'react';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Camera,
  Image as ImageIcon,
  Trash2,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { toast } from 'sonner';
// import { cn } from '@/lib/utils';
import { validateAvatarFile } from '@/lib/utils/avatar-validation';
import { formatFileSize } from '@/lib/image-compression';

export interface MobileAvatarUploadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registrantId?: string; // Optional for future use
  registrantName: string;
  currentAvatarUrl?: string;
  onUploadComplete: (file: File) => void;
  onDeleteAvatar?: () => void;
  onCancel?: () => void;
}

/**
 * Mobile avatar upload sheet with camera and gallery options
 * Provides touch-friendly interface with native mobile integration
 */
export function MobileAvatarUploadSheet({
  open,
  onOpenChange,
  registrantName,
  currentAvatarUrl,
  onUploadComplete,
  onDeleteAvatar,
  onCancel,
}: Omit<MobileAvatarUploadSheetProps, 'registrantId'>) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setValidationError(null);

    try {
      // Validate file
      const validation = validateAvatarFile(file);
      if (!validation.valid) {
        setValidationError(validation.error || 'File không hợp lệ');
        setIsProcessing(false);
        return;
      }

      // Create preview
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setSelectedFile(file);
      
      toast.success('Đã chọn ảnh thành công!');
    } catch (error) {
      console.error('File processing error:', error);
      setValidationError('Có lỗi xảy ra khi xử lý file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleGallerySelect = () => {
    galleryInputRef.current?.click();
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleContinue = () => {
    if (selectedFile) {
      onUploadComplete(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationError(null);
  };

  const handleDeleteAvatar = () => {
    onDeleteAvatar?.();
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationError(null);
    onCancel?.();
    onOpenChange(false);
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Avatar cho {registrantName}
          </SheetTitle>
          <SheetDescription>
            Chọn ảnh từ camera hoặc thư viện
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Current Avatar */}
          {currentAvatarUrl && !selectedFile && (
            <div className="space-y-3">
              <h3 className="font-medium">Avatar hiện tại</h3>
              <div className="flex items-center gap-4">
                <img
                  src={currentAvatarUrl}
                  alt="Current avatar"
                  className="w-16 h-16 rounded-full object-cover border-2 border-border"
                />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Avatar đã được thiết lập
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* File Selection */}
          {!selectedFile && (
            <div className="space-y-4">
              <h3 className="font-medium">Chọn ảnh mới</h3>
              
              {/* Camera Button */}
              <Button
                variant="outline"
                size="lg"
                className="w-full h-16 flex items-center gap-4 text-left justify-start"
                onClick={handleCameraCapture}
                disabled={isProcessing}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">Chụp ảnh</div>
                  <div className="text-sm text-muted-foreground">Sử dụng camera</div>
                </div>
              </Button>

              {/* Gallery Button */}
              <Button
                variant="outline"
                size="lg"
                className="w-full h-16 flex items-center gap-4 text-left justify-start"
                onClick={handleGallerySelect}
                disabled={isProcessing}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">Chọn từ thư viện</div>
                  <div className="text-sm text-muted-foreground">Ảnh đã lưu</div>
                </div>
              </Button>

              {/* Delete Option */}
              {currentAvatarUrl && onDeleteAvatar && (
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-16 flex items-center gap-4 text-left justify-start text-destructive border-destructive/20 hover:bg-destructive/5"
                  onClick={handleDeleteAvatar}
                >
                  <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <div className="font-medium">Xóa avatar</div>
                    <div className="text-sm text-muted-foreground">Gỡ bỏ ảnh hiện tại</div>
                  </div>
                </Button>
              )}
            </div>
          )}

          {/* File Preview */}
          {selectedFile && previewUrl && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Ảnh đã chọn</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Preview Image */}
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Selected image"
                  className="w-full h-64 object-cover rounded-lg border"
                />
              </div>

              {/* File Info */}
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{selectedFile.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <span className="text-sm text-destructive">{validationError}</span>
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-2 p-4 bg-muted/50 rounded-lg">
            <p className="font-medium">Lưu ý:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Chọn ảnh chân dung rõ nét</li>
              <li>Nền sáng, tránh bóng đổ</li>
              <li>Định dạng: JPG, PNG, WEBP</li>
              <li>Kích thước tối đa: 5MB</li>
              <li>Ảnh sẽ được crop thành hình vuông</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="flex-1"
            disabled={isProcessing}
          >
            Hủy
          </Button>
          
          {selectedFile && (
            <Button 
              onClick={handleContinue}
              className="flex-1"
              disabled={isProcessing}
            >
              {isProcessing ? 'Đang xử lý...' : 'Tiếp tục'}
            </Button>
          )}
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraChange}
          className="hidden"
        />
        
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleGalleryChange}
          className="hidden"
        />
      </SheetContent>
    </Sheet>
  );
}