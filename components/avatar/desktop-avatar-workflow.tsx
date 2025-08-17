"use client";

import React, { useState } from 'react';
import { AvatarUploadDialog } from './avatar-upload-dialog';
import { AvatarCropDialog } from './avatar-crop-dialog';
import { AvatarCropProcessor } from './avatar-crop-processor';
import { CropData, CompressionResult } from '@/lib/image-compression';
import { toast } from 'sonner';

export interface DesktopAvatarWorkflowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registrantId?: string; // Optional for future use
  registrantName: string;
  onComplete: (result: CompressionResult) => void;
  onCancel?: () => void;
}

type WorkflowStep = 'upload' | 'crop' | 'process' | 'complete';

/**
 * Desktop avatar workflow orchestrator
 * Manages the complete upload → crop → compress → complete flow
 */
export function DesktopAvatarWorkflow({
  open,
  onOpenChange,
  registrantName,
  onComplete,
  onCancel,
}: Omit<DesktopAvatarWorkflowProps, 'registrantId'>) {
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

  const handleUploadComplete = (file: File) => {
    setSelectedFile(file);
    setCurrentStep('crop');
  };

  const handleCropComplete = (data: CropData) => {
    setCropData(data);
    setCurrentStep('process');
  };

  const handleProcessComplete = (result: CompressionResult) => {
    setCurrentStep('complete');
    onComplete(result);
  };

  const handleProcessError = (error: string) => {
    toast.error(error);
    // Go back to crop step to allow retry
    setCurrentStep('crop');
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  // const handleBackToCrop = () => {
  //   setCurrentStep('crop');
  // };

  const handleBackToUpload = () => {
    setCurrentStep('upload');
    setSelectedFile(null);
  };

  return (
    <>
      {/* Upload Step */}
      <AvatarUploadDialog
        open={open && currentStep === 'upload'}
        onOpenChange={onOpenChange}
        registrantName={registrantName}
        onUploadComplete={handleUploadComplete}
        onCancel={handleCancel}
      />

      {/* Crop Step */}
      {selectedFile && (
        <AvatarCropDialog
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