"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  AlertCircle, 
  User, 
  Mail, 
  MapPin,
  Clock
} from "lucide-react";

interface ScanResult {
  success: boolean;
  registrant?: {
    id: string;
    full_name: string;
    saint_name?: string;
    email: string;
    diocese: string;
    is_checked_in: boolean;
    checked_in_at?: string;
  };
  message: string;
}

interface CheckInDialogProps {
  open: boolean;
  result: ScanResult | null;
  onClose: () => void;
}

export function CheckInDialog({ open, result, onClose }: CheckInDialogProps) {
  if (!result) return null;

  const isSuccess = result.success;
  const registrant = result.registrant;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {isSuccess ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-600" />
            )}
            <span>
              {isSuccess ? "Check-in thành công!" : "Lỗi check-in"}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Result Message */}
          <div className={`p-4 rounded-lg ${isSuccess ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-sm ${isSuccess ? 'text-green-800' : 'text-red-800'}`}>
              {result.message}
            </p>
          </div>

          {/* Registrant Information */}
          {registrant && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Thông tin người tham gia</span>
              </h4>
              
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                {/* Name */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-lg">{registrant.full_name}</p>
                    {registrant.saint_name && (
                      <p className="text-sm text-muted-foreground">({registrant.saint_name})</p>
                    )}
                  </div>
                  <Badge 
                    variant={registrant.is_checked_in ? "default" : "secondary"}
                    className={registrant.is_checked_in ? "bg-green-600" : ""}
                  >
                    {registrant.is_checked_in ? "Đã check-in" : "Chưa check-in"}
                  </Badge>
                </div>

                {/* Email */}
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{registrant.email}</span>
                </div>

                {/* Diocese */}
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{registrant.diocese}</span>
                </div>

                {/* Check-in Time */}
                {registrant.checked_in_at && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Check-in lúc: {new Date(registrant.checked_in_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                )}

                {/* ID for troubleshooting */}
                <div className="text-xs text-muted-foreground">
                  ID: {registrant.id}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button onClick={onClose} variant="outline">
              Tiếp tục quét
            </Button>
            {isSuccess && (
              <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
                Hoàn tất
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
