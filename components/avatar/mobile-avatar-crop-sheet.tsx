"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  Crop,
  Move,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
// import { cn } from '@/lib/utils';
import { CropData } from '@/lib/image-compression';

export interface MobileAvatarCropSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File;
  registrantName: string;
  onCropComplete: (cropData: CropData) => void;
  onCancel?: () => void;
}

interface TouchState {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface TouchPoint {
  x: number;
  y: number;
}

/**
 * Mobile avatar crop sheet with touch gestures
 * Supports pinch-to-zoom, drag-to-pan, and double-tap-to-fit
 */
export function MobileAvatarCropSheet({
  open,
  onOpenChange,
  imageFile,
  registrantName,
  onCropComplete,
  onCancel,
}: MobileAvatarCropSheetProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [touchState, setTouchState] = useState<TouchState>({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [initialDistance, setInitialDistance] = useState(0);
  const [initialScale, setInitialScale] = useState(1);
  const [lastTouchCenter, setLastTouchCenter] = useState<TouchPoint>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Initialize image
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);

      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
        
        // Center the image initially
        setTouchState({
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
        });
      };
      img.src = url;

      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  // Touch event handlers
  const getTouchDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    
    const touch1 = touches[0];
    const touch2 = touches[1];
    
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const getTouchCenter = (touches: React.TouchList): TouchPoint => {
    if (touches.length === 1) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    
    const touch1 = touches[0];
    const touch2 = touches[1];
    
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };



  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    const touches = e.touches;
    
    if (touches.length === 1) {
      // Single touch - pan
      const currentCenter = getTouchCenter(touches);
      const deltaX = currentCenter.x - lastTouchCenter.x;
      const deltaY = currentCenter.y - lastTouchCenter.y;
      
      setTouchState(prev => ({
        ...prev,
        x: prev.x + deltaX / prev.scale,
        y: prev.y + deltaY / prev.scale,
      }));
      
      setLastTouchCenter(currentCenter);
    } else if (touches.length === 2) {
      // Pinch - zoom and pan
      const currentDistance = getTouchDistance(touches);
      const currentCenter = getTouchCenter(touches);
      
      if (initialDistance > 0) {
        const scaleChange = currentDistance / initialDistance;
        const newScale = Math.max(0.5, Math.min(3, initialScale * scaleChange));
        
        const deltaX = currentCenter.x - lastTouchCenter.x;
        const deltaY = currentCenter.y - lastTouchCenter.y;
        
        setTouchState(prev => ({
          ...prev,
          scale: newScale,
          x: prev.x + deltaX / newScale,
          y: prev.y + deltaY / newScale,
        }));
      }
      
      setLastTouchCenter(currentCenter);
    }
  }, [initialDistance, initialScale, lastTouchCenter]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 0) {
      setInitialDistance(0);
      setInitialScale(1);
    }
  }, []);

  // Control functions
  const handleZoomIn = () => {
    setTouchState(prev => ({ 
      ...prev, 
      scale: Math.min(3, prev.scale + 0.2) 
    }));
  };

  const handleZoomOut = () => {
    setTouchState(prev => ({ 
      ...prev, 
      scale: Math.max(0.5, prev.scale - 0.2) 
    }));
  };

  const handleRotate = () => {
    setTouchState(prev => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360
    }));
  };

  const handleReset = () => {
    setTouchState({
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
    });
  };

  const handleFitToScreen = useCallback(() => {
    if (containerRef.current && imageDimensions.width && imageDimensions.height) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerAspect = containerRect.width / containerRect.height;
      const imageAspect = imageDimensions.width / imageDimensions.height;

      let scale = 1;
      if (imageAspect > containerAspect) {
        scale = containerRect.width / imageDimensions.width;
      } else {
        scale = containerRect.height / imageDimensions.height;
      }

      setTouchState(prev => ({
        ...prev,
        scale: Math.max(0.5, Math.min(3, scale * 0.9)),
        x: 0,
        y: 0,
      }));
    }
  }, [imageDimensions]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();

    const touches = e.touches;

    if (touches.length === 1) {
      // Single touch - check for double tap
      const now = Date.now();
      const timeDiff = now - lastTap;

      if (timeDiff < 300 && timeDiff > 0) {
        // Double tap - fit to screen
        handleFitToScreen();
      }

      setLastTap(now);
      setLastTouchCenter(getTouchCenter(touches));
    } else if (touches.length === 2) {
      // Pinch start
      const distance = getTouchDistance(touches);
      setInitialDistance(distance);
      setInitialScale(touchState.scale);
      setLastTouchCenter(getTouchCenter(touches));
    }
  }, [lastTap, touchState.scale, handleFitToScreen]);

  const handleScaleChange = (value: number[]) => {
    setTouchState(prev => ({ ...prev, scale: value[0] }));
  };

  const handleCropConfirm = async () => {
    setIsProcessing(true);
    
    try {
      // Calculate crop area based on current view
      const cropSize = Math.min(imageDimensions.width, imageDimensions.height);
      const cropX = (imageDimensions.width - cropSize) / 2 - touchState.x;
      const cropY = (imageDimensions.height - cropSize) / 2 - touchState.y;
      
      const cropData: CropData = {
        x: Math.max(0, Math.min(imageDimensions.width - cropSize, cropX)),
        y: Math.max(0, Math.min(imageDimensions.height - cropSize, cropY)),
        width: cropSize,
        height: cropSize,
        scale: touchState.scale,
      };

      onCropComplete(cropData);
      toast.success('Crop settings applied!');
    } catch (error) {
      console.error('Crop error:', error);
      toast.error('Có lỗi xảy ra khi crop ảnh');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[95vh] flex flex-col">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            Crop Avatar
          </SheetTitle>
          <SheetDescription>
            Điều chỉnh vùng crop cho <strong>{registrantName}</strong>
          </SheetDescription>
        </SheetHeader>

        {/* Crop Area */}
        <div className="flex-1 flex flex-col gap-4">
          <div 
            ref={containerRef}
            className="flex-1 relative bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {imageUrl && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Crop preview"
                  className="absolute inset-0 w-full h-full object-contain select-none"
                  style={{
                    transform: `translate(${touchState.x}px, ${touchState.y}px) scale(${touchState.scale}) rotate(${touchState.rotation}deg)`,
                    transformOrigin: 'center',
                  }}
                  draggable={false}
                />
                
                {/* Crop Overlay - Center Square */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 border-2 border-primary bg-primary/10 rounded-lg">
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="border border-primary/30" />
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Touch Instructions */}
          <div className="text-xs text-muted-foreground text-center p-2 bg-muted/50 rounded">
            <p className="flex items-center justify-center gap-2">
              <Move className="h-3 w-3" />
              Chạm để di chuyển • Véo để zoom • Chạm đôi để fit màn hình
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4 pt-4 border-t">
          {/* Zoom Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Zoom</span>
              <span>{Math.round(touchState.scale * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Slider
                value={[touchState.scale]}
                onValueChange={handleScaleChange}
                min={0.5}
                max={3}
                step={0.1}
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRotate}
              className="flex-1"
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Xoay
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleReset}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="flex-1"
              disabled={isProcessing}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleCropConfirm}
              className="flex-1"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận'
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}