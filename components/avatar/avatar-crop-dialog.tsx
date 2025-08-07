"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  RotateCw, 
  RotateCcw, 
  FlipHorizontal, 
  FlipVertical,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  RefreshCw,
  Crop,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CropData } from '@/lib/image-compression';

export interface AvatarCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File;
  registrantName: string;
  onCropComplete: (cropData: CropData) => void;
  onCancel?: () => void;
}

interface CropState {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
}

/**
 * Desktop avatar crop dialog with advanced controls
 * Supports mouse wheel zoom, drag to pan, and keyboard shortcuts
 */
export function AvatarCropDialog({
  open,
  onOpenChange,
  imageFile,
  registrantName,
  onCropComplete,
  onCancel,
}: AvatarCropDialogProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [cropState, setCropState] = useState<CropState>({
    x: 0,
    y: 0,
    width: 200,
    height: 200,
    scale: 1,
    rotation: 0,
    flipX: false,
    flipY: false,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Canvas ref for future crop functionality
  // const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Initialize image
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);

      // Load image to get dimensions
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
        
        // Initialize crop to center square
        const minDimension = Math.min(img.width, img.height);
        const x = (img.width - minDimension) / 2;
        const y = (img.height - minDimension) / 2;
        
        setCropState(prev => ({
          ...prev,
          x,
          y,
          width: minDimension,
          height: minDimension,
        }));
      };
      img.src = url;

      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!containerRef.current?.contains(e.target as Node)) return;
    
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setCropState(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(3, prev.scale + delta))
    }));
  }, []);

  // Handle mouse drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setCropState(prev => {
      const newX = Math.max(0, Math.min(imageDimensions.width - prev.width, prev.x - deltaX / prev.scale));
      const newY = Math.max(0, Math.min(imageDimensions.height - prev.height, prev.y - deltaY / prev.scale));
      
      return {
        ...prev,
        x: newX,
        y: newY,
      };
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart, imageDimensions]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add event listeners
  useEffect(() => {
    if (open) {
      window.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('wheel', handleWheel);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [open, handleWheel, handleMouseMove, handleMouseUp]);



  // Control functions
  const handleZoomIn = () => {
    setCropState(prev => ({ ...prev, scale: Math.min(3, prev.scale + 0.1) }));
  };

  const handleZoomOut = () => {
    setCropState(prev => ({ ...prev, scale: Math.max(0.1, prev.scale - 0.1) }));
  };

  const handleRotate = (clockwise: boolean = true) => {
    setCropState(prev => ({
      ...prev,
      rotation: (prev.rotation + (clockwise ? 90 : -90)) % 360
    }));
  };

  const handleFlip = (horizontal: boolean) => {
    setCropState(prev => ({
      ...prev,
      [horizontal ? 'flipX' : 'flipY']: !prev[horizontal ? 'flipX' : 'flipY']
    }));
  };

  const handleReset = () => {
    if (imageDimensions.width && imageDimensions.height) {
      const minDimension = Math.min(imageDimensions.width, imageDimensions.height);
      const x = (imageDimensions.width - minDimension) / 2;
      const y = (imageDimensions.height - minDimension) / 2;
      
      setCropState({
        x,
        y,
        width: minDimension,
        height: minDimension,
        scale: 1,
        rotation: 0,
        flipX: false,
        flipY: false,
      });
    }
  };

  const handleScaleChange = (value: number[]) => {
    setCropState(prev => ({ ...prev, scale: value[0] }));
  };

  const handleCropConfirm = useCallback(async () => {
    setIsProcessing(true);

    try {
      const cropData: CropData = {
        x: cropState.x,
        y: cropState.y,
        width: cropState.width,
        height: cropState.height,
        scale: cropState.scale,
      };

      onCropComplete(cropData);
      toast.success('Crop settings applied successfully!');
    } catch (error) {
      console.error('Crop error:', error);
      toast.error('Có lỗi xảy ra khi crop ảnh');
    } finally {
      setIsProcessing(false);
    }
  }, [cropState, onCropComplete]);

  const handleCancel = useCallback(() => {
    onCancel?.();
    onOpenChange(false);
  }, [onCancel, onOpenChange]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          handleCancel();
          break;
        case 'Enter':
          handleCropConfirm();
          break;
        case '+':
        case '=':
          setCropState(prev => ({ ...prev, scale: Math.min(3, prev.scale + 0.1) }));
          break;
        case '-':
          setCropState(prev => ({ ...prev, scale: Math.max(0.1, prev.scale - 0.1) }));
          break;
        case 'r':
        case 'R':
          handleRotate();
          break;
        case 'g':
        case 'G':
          setShowGrid(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleCancel, handleCropConfirm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            Crop Avatar
          </DialogTitle>
          <DialogDescription>
            Điều chỉnh vùng crop cho avatar của <strong>{registrantName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 max-h-[60vh]">
          {/* Crop Canvas */}
          <div className="flex-1">
            <div 
              ref={containerRef}
              className="relative bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300"
              style={{ height: '400px' }}
              onMouseDown={handleMouseDown}
            >
              {imageUrl && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Crop preview"
                    className={cn(
                      'absolute inset-0 w-full h-full object-contain cursor-move select-none',
                      isDragging && 'cursor-grabbing'
                    )}
                    style={{
                      transform: `scale(${cropState.scale}) rotate(${cropState.rotation}deg) scaleX(${cropState.flipX ? -1 : 1}) scaleY(${cropState.flipY ? -1 : 1})`,
                      transformOrigin: 'center',
                    }}
                    draggable={false}
                  />
                  
                  {/* Crop Overlay */}
                  <div 
                    className="absolute border-2 border-primary bg-primary/10"
                    style={{
                      left: `${(cropState.x / imageDimensions.width) * 100}%`,
                      top: `${(cropState.y / imageDimensions.height) * 100}%`,
                      width: `${(cropState.width / imageDimensions.width) * 100}%`,
                      height: `${(cropState.height / imageDimensions.height) * 100}%`,
                    }}
                  >
                    {/* Grid Overlay */}
                    {showGrid && (
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                        {Array.from({ length: 9 }).map((_, i) => (
                          <div key={i} className="border border-primary/30" />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Keyboard Shortcuts Help */}
            <div className="mt-2 text-xs text-muted-foreground">
              <p><strong>Shortcuts:</strong> Wheel = Zoom, Drag = Pan, +/- = Zoom, R = Rotate, G = Grid, Enter = Confirm, Esc = Cancel</p>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="w-64 space-y-4">
            {/* Zoom Controls */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Zoom: {Math.round(cropState.scale * 100)}%</label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Slider
                  value={[cropState.scale]}
                  onValueChange={handleScaleChange}
                  min={0.1}
                  max={3}
                  step={0.1}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Transform Controls */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Transform</label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleRotate(false)}
                  title="Rotate Left (R)"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleRotate(true)}
                  title="Rotate Right (R)"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleFlip(true)}
                  title="Flip Horizontal"
                >
                  <FlipHorizontal className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleFlip(false)}
                  title="Flip Vertical"
                >
                  <FlipVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* View Controls */}
            <div className="space-y-2">
              <label className="text-sm font-medium">View</label>
              <div className="flex gap-2">
                <Button 
                  variant={showGrid ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setShowGrid(!showGrid)}
                  title="Toggle Grid (G)"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleReset}
                  title="Reset All"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Crop Info */}
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              <label className="text-sm font-medium">Crop Info</label>
              <div className="text-xs space-y-1">
                <p>Position: {Math.round(cropState.x)}, {Math.round(cropState.y)}</p>
                <p>Size: {Math.round(cropState.width)} × {Math.round(cropState.height)}</p>
                <p>Output: 512 × 512px</p>
                <p>Rotation: {cropState.rotation}°</p>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Preview</label>
              <div className="w-24 h-24 bg-muted rounded-full overflow-hidden border-2 border-border mx-auto">
                {imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                    style={{
                      transform: `scale(${cropState.scale}) rotate(${cropState.rotation}deg) scaleX(${cropState.flipX ? -1 : 1}) scaleY(${cropState.flipY ? -1 : 1})`,
                      transformOrigin: `${-cropState.x + cropState.width/2}px ${-cropState.y + cropState.height/2}px`,
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
            Hủy
          </Button>
          <Button onClick={handleCropConfirm} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Xác nhận crop'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}