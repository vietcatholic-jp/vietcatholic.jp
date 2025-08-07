"use client";

import React, { useState } from 'react';
import { AvatarDisplay } from './avatar-display';
import { DesktopAvatarWorkflow } from './desktop-avatar-workflow';
import { MobileAvatarWorkflow } from './mobile-avatar-workflow';
import { useBreakpoint } from '@/lib/utils/responsive';
import { CompressionResult } from '@/lib/image-compression';
import { AvatarSize, AvatarManagerConfig } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export interface AvatarManagerProps extends AvatarManagerConfig {
  registrantId: string;
  registrantName: string;
  currentAvatarUrl?: string;
  size?: AvatarSize;
  editable?: boolean;
  onAvatarChange?: (newUrl: string | null) => void;
  className?: string;
}

/**
 * Unified avatar manager component
 * Handles device detection and conditional rendering for desktop/mobile workflows
 */
export function AvatarManager({
  registrantId,
  registrantName,
  currentAvatarUrl,
  size = 'md',
  editable = false,
  onAvatarChange,
  className,
  showUploadHint = false,
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png'],
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  compressionQuality = 0.8,
}: AvatarManagerProps) {
  // Prevent unused variable warnings for future enhancement props
  void showUploadHint;
  void acceptedFormats;
  void maxFileSize;
  void compressionQuality;
  // Use cn utility for consistent styling
  const containerClasses = cn(
    "relative inline-block",
    className
  );
  const { isMobile } = useBreakpoint();
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(currentAvatarUrl);

  // Generate fallback initials from registrant name
  const fallbackInitials = React.useMemo(() => {
    if (!registrantName) return '?';
    const names = registrantName.trim().split(/\s+/);
    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }, [registrantName]);

  const handleEditClick = () => {
    setIsWorkflowOpen(true);
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleWorkflowComplete = async (result: CompressionResult) => {
    setIsProcessing(true);
    
    try {
      // Create form data for API call
      const formData = new FormData();
      formData.append('file', result.file);

      // Call API to upload avatar
      const response = await fetch(`/api/registrants/${registrantId}/avatar`, {
        method: currentAvatarUrl ? 'PUT' : 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Tải lên thất bại');
      }

      // Update local state
      setAvatarUrl(data.avatarUrl);
      onAvatarChange?.(data.avatarUrl);

      toast.success(
        `Avatar đã ${currentAvatarUrl ? 'cập nhật' : 'tải lên'} thành công! ` +
        `Tiết kiệm ${Math.round(result.compressionRatio * 100)}% dung lượng.`
      );

      setIsWorkflowOpen(false);
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Tải lên thất bại');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsProcessing(true);
    
    try {
      const response = await fetch(`/api/registrants/${registrantId}/avatar`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Xóa thất bại');
      }

      // Update local state
      setAvatarUrl(undefined);
      onAvatarChange?.(null);

      toast.success('Đã xóa avatar thành công');
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Avatar delete error:', error);
      toast.error(error instanceof Error ? error.message : 'Xóa thất bại');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleWorkflowCancel = () => {
    setIsWorkflowOpen(false);
  };

  return (
    <div className={containerClasses}>
      {/* Avatar Display */}
      <AvatarDisplay
        src={avatarUrl}
        alt={`Avatar for ${registrantName}`}
        size={size}
        fallbackInitials={fallbackInitials}
        editable={editable}
        onEditClick={handleEditClick}
        onDeleteClick={avatarUrl ? handleDeleteClick : undefined}
        loading={isProcessing}
      />

      {/* Desktop Workflow */}
      {!isMobile && (
        <DesktopAvatarWorkflow
          open={isWorkflowOpen}
          onOpenChange={setIsWorkflowOpen}
          registrantName={registrantName}
          onComplete={handleWorkflowComplete}
          onCancel={handleWorkflowCancel}
        />
      )}

      {/* Mobile Workflow */}
      {isMobile && (
        <MobileAvatarWorkflow
          open={isWorkflowOpen}
          onOpenChange={setIsWorkflowOpen}
          registrantName={registrantName}
          currentAvatarUrl={avatarUrl}
          onComplete={handleWorkflowComplete}
          onDeleteAvatar={avatarUrl ? handleDeleteClick : undefined}
          onCancel={handleWorkflowCancel}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Xóa Avatar
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa avatar của <strong>{registrantName}</strong>? 
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleDeleteCancel}
              disabled={isProcessing}
            >
              Hủy
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? 'Đang xóa...' : 'Xóa Avatar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}