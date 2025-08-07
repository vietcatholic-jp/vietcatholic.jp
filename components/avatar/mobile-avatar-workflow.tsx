"use client";

import React, { useState } from 'react';
import { MobileAvatarUploadSheet } from './mobile-avatar-upload-sheet';
import { MobileAvatarCropSheet } from './mobile-avatar-crop-sheet';
import { AvatarCropProcessor } from './avatar-crop-processor';
import { CropData, CompressionResult } from '@/lib/image-compression';
import { toast } from 'sonner';

export interface MobileAvatarWorkflowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registrantId?: string; // Optional for future use
  registrantName: string;
  currentAvatarUrl?: string;
  onComplete: (result: CompressionResult) => void;
  onDeleteAvatar?: () => void;
  onCancel?: () => void;
}

type WorkflowStep = 'upload' | 'crop' | 'process' | 'complete';

/**
 * Mobile avatar workflow orchestrator with smooth transitions
 * Manages the complete mobile upload → crop → compress → complete flow
 */
export function MobileAvatarWorkflow({
  open,
  onOpenChange,
  registrantName,
  currentAvatarUrl,
  onComplete,
  onDeleteAvatar,
  onCancel,
}: Omit<MobileAvatarWorkflowProps, 'registrantId'>) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cropData, setCropData] = useState<CropData | null>(null);

  // Reset workflow when dialog opens
  React.useEffect(() => {
    if (open) {
      setCurrentStep('upload');
      setSelectedFile(null);
      setCropData(null);
    }
  }, [open]);

  // Haptic feedback helper
  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
      };
      navigator.vibrate(patterns[type]);
    }
  };

  const handleUploadComplete = (file: File) => {
    triggerHapticFeedback('light');
    setSelectedFile(file);
    
    // Smooth transition to crop step
    setTimeout(() => {
      setCurrentStep('crop');
    }, 150);
  };

  const handleCropComplete = (data: CropData) => {
    triggerHapticFeedback('medium');
    setCropData(data);
    
    // Smooth transition to process step
    setTimeout(() => {
      setCurrentStep('process');
    }, 150);
  };

  const handleProcessComplete = (result: CompressionResult) => {
    triggerHapticFeedback('heavy');
    setCurrentStep('complete');
    
    // Complete the workflow
    setTimeout(() => {
      onComplete(result);
    }, 300);
  };

  const handleProcessError = (error: string) => {
    triggerHapticFeedback('heavy');
    toast.error(error);
    
    // Go back to crop step to allow retry
    setTimeout(() => {
      setCurrentStep('crop');
    }, 500);
  };

  const handleDeleteAvatar = () => {
    triggerHapticFeedback('medium');
    onDeleteAvatar?.();
  };

  const handleCancel = () => {
    triggerHapticFeedback('light');
    onCancel?.();
    onOpenChange(false);
  };

  // const handleBackToCrop = () => {
  //   triggerHapticFeedback('light');
  //   setCurrentStep('crop');
  // };

  const handleBackToUpload = () => {
    triggerHapticFeedback('light');
    setCurrentStep('upload');
    setSelectedFile(null);
  };

  return (
    <>
      {/* Upload Step */}
      <MobileAvatarUploadSheet
        open={open && currentStep === 'upload'}
        onOpenChange={onOpenChange}
        registrantName={registrantName}
        currentAvatarUrl={currentAvatarUrl}
        onUploadComplete={handleUploadComplete}
        onDeleteAvatar={handleDeleteAvatar}
        onCancel={handleCancel}
      />

      {/* Crop Step */}
      {selectedFile && (
        <MobileAvatarCropSheet
          open={open && currentStep === 'crop'}
          onOpenChange={onOpenChange}
          imageFile={selectedFile}
          registrantName={registrantName}
          onCropComplete={handleCropComplete}
          onCancel={handleBackToUpload}
        />
      )}

      {/* Process Step */}
      {selectedFile && cropData && (
        <AvatarCropProcessor
          open={open && currentStep === 'process'}
          onOpenChange={onOpenChange}
          imageFile={selectedFile}
          cropData={cropData}
          registrantName={registrantName}
          onProcessComplete={handleProcessComplete}
          onError={handleProcessError}
        />
      )}
    </>
  );
}