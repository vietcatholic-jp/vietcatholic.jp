"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, User, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface PortraitUploadProps {
  registrantId: string;
  onUploadComplete: () => void;
}

export function PortraitUpload({ registrantId, onUploadComplete }: PortraitUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const supabase = createClient();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        toast.error("Vui lòng chọn file ảnh");
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("File quá lớn. Vui lòng chọn file dưới 5MB");
        return;
      }
      setUploadedFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024
  });

  const uploadPortrait = async () => {
    if (!uploadedFile) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Không thể xác thực người dùng");

      const fileExt = uploadedFile.name.split('.').pop();
      const fileName = `${user.id}/${registrantId}-portrait.${fileExt}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('portraits')
        .upload(fileName, uploadedFile, {
          upsert: true // Allow overwriting existing file
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('portraits')
        .getPublicUrl(fileName);

      // Update registrant with portrait URL
      const { error: updateError } = await supabase
        .from('registrants')
        .update({ portrait_url: publicUrl })
        .eq('id', registrantId);

      if (updateError) throw updateError;

      toast.success("Upload ảnh thành công!");
      onUploadComplete();

    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Có lỗi xảy ra khi upload ảnh. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
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
        {!uploadedFile ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            {isDragActive ? (
              <p className="text-sm text-primary">Thả ảnh vào đây...</p>
            ) : (
              <div>
                <p className="text-sm font-medium mb-1">
                  Kéo thả ảnh hoặc click để chọn
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG (tối đa 5MB)
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">{uploadedFile.name}</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={uploadPortrait} disabled={isUploading} size="sm">
                {isUploading ? "Đang upload..." : "Upload ảnh"}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setUploadedFile(null)}
              >
                Chọn lại
              </Button>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Ảnh chân dung rõ nét, chụp thẳng</p>
          <p>• Nền sáng, tránh bóng đổ</p>
          <p>• Kích thước tối thiểu 300x300px</p>
        </div>
      </CardContent>
    </Card>
  );
}
