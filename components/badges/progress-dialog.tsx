"use client";


import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Download, X } from "lucide-react";

interface ProgressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  total: number;
  current: number;
  status: 'processing' | 'success' | 'error';
  statusText: string;
  errorMessage?: string;
  onCancel?: () => void;
  canCancel?: boolean;
}

export function ProgressDialog({
  isOpen,
  onClose,
  title,
  total,
  current,
  status,
  statusText,
  errorMessage,
  onCancel,
  canCancel = true
}: ProgressDialogProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'error':
        return <XCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Download className="h-6 w-6 text-blue-600 animate-pulse" />;
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case 'success':
        return '#16a34a'; // green-600
      case 'error':
        return '#dc2626'; // red-600
      default:
        return '#2563eb'; // blue-600
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            {title}
          </DialogTitle>
          <DialogDescription>
            {status === 'error' && errorMessage ? errorMessage : statusText}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Tiến độ</span>
              <span>{current}/{total} ({percentage}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: getProgressColor()
                }}
              />
            </div>
          </div>

          {/* Status Text */}
          <div className="text-center py-2">
            <p className="text-sm font-medium">{statusText}</p>
            {status === 'processing' && (
              <p className="text-xs text-muted-foreground mt-1">
                Vui lòng không đóng cửa sổ này...
              </p>
            )}
          </div>

          {/* Error Details */}
          {status === 'error' && errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            {status === 'processing' && canCancel && onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Hủy
              </Button>
            )}
            
            {(status === 'success' || status === 'error') && (
              <Button
                variant={status === 'success' ? 'default' : 'outline'}
                size="sm"
                onClick={onClose}
              >
                {status === 'success' ? 'Hoàn thành' : 'Đóng'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
