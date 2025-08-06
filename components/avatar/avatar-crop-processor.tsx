"use client";

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { compressAvatarImage, CropData, CompressionResult } from '@/lib/image-compression';
import { formatFileSize } from '@/lib/image-compression';

export interface AvatarCropProcessorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File;
  cropData: CropData;
  registrantName: string;
  onProcessComplete: (result: CompressionResult) => void;
  onError: (error: string) => void;
}

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
}

/**
 * Avatar crop and compression processor with real-time progress
 * Handles the crop-then-compress workflow with visual feedback
 */
export function AvatarCropProcessor({
  open,
  onOpenChange,
  imageFile,
  cropData,
  registrantName,
  onProcessComplete,
  onError,
}: AvatarCropProcessorProps) {
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: 'crop', label: 'Crop ảnh theo vùng đã chọn', status: 'pending', progress: 0 },
    { id: 'resize', label: 'Resize về 512x512px', status: 'pending', progress: 0 },
    { id: 'compress', label: 'Nén ảnh để tối ưu dung lượng', status: 'pending', progress: 0 },
    { id: 'validate', label: 'Kiểm tra chất lượng', status: 'pending', progress: 0 },
  ]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Start processing when dialog opens
  React.useEffect(() => {
    if (open && !isProcessing && !result) {
      startProcessing();
    }
  }, [open]);

  const updateStep = (stepIndex: number, status: ProcessingStep['status'], progress: number = 0) => {
    setSteps(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, status, progress } : step
    ));
  };

  const startProcessing = async () => {
    setIsProcessing(true);
    setCurrentStep(0);

    try {
      // Step 1: Crop
      updateStep(0, 'processing', 25);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing time
      updateStep(0, 'completed', 100);

      // Step 2: Resize
      setCurrentStep(1);
      updateStep(1, 'processing', 50);
      await new Promise(resolve => setTimeout(resolve, 300));
      updateStep(1, 'completed', 100);

      // Step 3: Compress
      setCurrentStep(2);
      updateStep(2, 'processing', 0);

      // Perform actual compression with crop data
      const compressionResult = await compressAvatarImage(imageFile, cropData);
      
      updateStep(2, 'processing', 75);
      await new Promise(resolve => setTimeout(resolve, 200));
      updateStep(2, 'completed', 100);

      // Step 4: Validate
      setCurrentStep(3);
      updateStep(3, 'processing', 90);
      
      // Create preview URL
      const url = URL.createObjectURL(compressionResult.file);
      setPreviewUrl(url);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      updateStep(3, 'completed', 100);

      setResult(compressionResult);
      
      toast.success(
        `Avatar đã được xử lý thành công! Giảm ${Math.round(compressionResult.compressionRatio * 100)}% dung lượng`
      );

    } catch (error) {
      console.error('Processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi xử lý ảnh';
      
      updateStep(currentStep, 'error', 0);
      onError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = () => {
    if (result) {
      onProcessComplete(result);
    }
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    onOpenChange(false);
  };

  // Clean up preview URL
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const getStepIcon = (step: ProcessingStep) => {
    switch (step.status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />;
    }
  };

  const overallProgress = steps.reduce((sum, step) => sum + step.progress, 0) / steps.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Xử lý Avatar
          </DialogTitle>
          <DialogDescription>
            Đang xử lý avatar cho <strong>{registrantName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Tiến độ tổng</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          {/* Processing Steps */}
          <div className="space-y-3">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3">
                {getStepIcon(step)}
                <div className="flex-1">
                  <div className="text-sm font-medium">{step.label}</div>
                  {step.status === 'processing' && (
                    <Progress value={step.progress} className="h-1 mt-1" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Preview and Results */}
          {result && previewUrl && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Kết quả:</div>
              
              {/* Preview Image */}
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border">
                  <img
                    src={previewUrl}
                    alt="Processed avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Compression Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="text-muted-foreground">Kích thước gốc:</div>
                  <div className="font-medium">{formatFileSize(result.originalSize)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">Sau xử lý:</div>
                  <div className="font-medium text-green-600">{formatFileSize(result.compressedSize)}</div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 p-2 bg-green-50 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">
                  Tiết kiệm {Math.round(result.compressionRatio * 100)}% dung lượng
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? 'Hủy' : 'Đóng'}
            </Button>
            
            {result && (
              <Button 
                onClick={handleComplete}
                className="flex-1"
              >
                Hoàn tất
              </Button>
            )}
          </div>

          {/* Processing Info */}
          {isProcessing && (
            <div className="text-xs text-muted-foreground text-center">
              Đang xử lý... Vui lòng không đóng cửa sổ này
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}