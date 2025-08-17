"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";
import { AvatarManager } from "@/components/avatar";

interface AvatarPortraitUploadProps {
  registrantId: string;
  registrantName: string;
  currentAvatarUrl?: string;
  onUploadComplete?: () => void;
}

/**
 * Enhanced portrait upload component using AvatarManager
 * Replaces the old PortraitUpload component with modern avatar system
 */
export function AvatarPortraitUpload({ 
  registrantId, 
  registrantName,
  currentAvatarUrl,
  onUploadComplete 
}: AvatarPortraitUploadProps) {
  const handleAvatarChange = () => {
    if (onUploadComplete) {
      onUploadComplete();
    } else {
      // Refresh the page for server-side components
      window.location.reload();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <User className="h-4 w-4" />
          Upload ảnh chân dung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Avatar Manager with large size for portrait upload */}
        <div className="flex flex-col items-center space-y-4">
          <AvatarManager
            registrantId={registrantId}
            registrantName={registrantName}
            currentAvatarUrl={currentAvatarUrl}
            size="lg"
            editable={true}
            onAvatarChange={handleAvatarChange}
            showUploadHint={true}
            className="w-32 h-32"
          />
          
          {/* Upload hints */}
          <div className="text-xs text-muted-foreground space-y-1 text-center">
            <p>• Ảnh chân dung rõ nét, chụp thẳng</p>
            <p>• Nền sáng, tránh bóng đổ</p>
            <p>• Kích thước tối thiểu 300x300px</p>
            <p>• JPG, PNG (tối đa 5MB)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}