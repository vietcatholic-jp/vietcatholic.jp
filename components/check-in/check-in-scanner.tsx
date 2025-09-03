"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Camera, 
  CameraOff, 
  QrCode, 
  CheckCircle, 
  Clock,
  UserCheck,
  Users
} from "lucide-react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { CheckInDialog } from "./check-in-dialog";
import { useCheckInStats } from "@/hooks/use-checkin-stats";

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

export function CheckInScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState<string>("");
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerElementRef = useRef<HTMLDivElement>(null);
  const scannerElementId = "qr-scanner";
  const lastQRDataRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);
  const processingQueueRef = useRef<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Get overall check-in statistics
  const { stats, loading: statsLoading, refetch: refetchStats } = useCheckInStats();

  useEffect(() => {
    const processingQueue = processingQueueRef.current;
    const abortController = abortControllerRef.current;
    
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch {
          // Ignore cleanup errors
        }
      }
      
      // Cleanup processing queue and abort controller
      processingQueue.clear();
      if (abortController) {
        abortController.abort();
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setIsScanning(true);
      
      // Wait for the DOM element to be available
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if element exists using ref or getElementById
      const element = scannerElementRef.current || document.getElementById(scannerElementId);
      if (!element) {
        throw new Error("Scanner element not found - please try again");
      }
      
      if (scannerRef.current) {
        await scannerRef.current.clear();
      }

      scannerRef.current = new Html5QrcodeScanner(
        scannerElementId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        },
        false
      );

                  // Add throttling to scanner callback level
            let lastCallbackTime = 0;
            const CALLBACK_THROTTLE_MS = 1000; // 1 second between callbacks
            
            scannerRef.current.render(
              async (qrData) => {
                const now = Date.now();
                if (now - lastCallbackTime < CALLBACK_THROTTLE_MS) {
                  return; // Throttle at callback level
                }
                lastCallbackTime = now;
                await processQRCode(qrData);
              },
              (errorMessage) => {
                // Ignore frequent errors - they're normal during scanning
                if (!errorMessage.includes('QR code parse error') &&
                    !errorMessage.includes('Unable to detect a QR code')) {
                  // Scanner errors are expected during normal operation
                }
              }
            );
      
    } catch (error) {
      setScanResult({
        success: false,
        message: error instanceof Error ? error.message : "Không thể mở camera. Vui lòng kiểm tra quyền truy cập camera."
      });
      setDialogOpen(true);
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    setIsScanning(false);
    
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
        scannerRef.current = null;
      } catch {
        // Ignore cleanup errors
      }
    }
  };

  const processQRCode = async (qrData: string) => {
    const currentTime = Date.now();
    const timeSinceLastScan = currentTime - lastScanTimeRef.current;
    
    // Enhanced debouncing: Ignore scans within 3 seconds of the same QR code
    if (lastQRDataRef.current === qrData && timeSinceLastScan < 3000) {
      return;
    }
    
    // Parse QR data to get registrant ID for queue checking
    let registrantId;
    try {
      const parsedData = JSON.parse(qrData);
      registrantId = parsedData.id || parsedData.registrantId;
    } catch {
      registrantId = qrData;
    }
    
    if (!registrantId) {
      setScanResult({
        success: false,
        message: "Mã QR không hợp lệ - không tìm thấy ID"
      });
      setDialogOpen(true);
      return;
    }
    
    // Check if this registrant ID is already being processed
    if (processingQueueRef.current.has(registrantId)) {
      return; // Silently ignore duplicate
    }
    
    // Global processing lock
    if (isProcessing) {
      return;
    }

    try {
      // Add to processing queue and set global processing state
      processingQueueRef.current.add(registrantId);
      setIsProcessing(true);
      setProcessingMessage("Đang xử lý check-in...");
      
      // Update refs
      lastQRDataRef.current = qrData;
      lastScanTimeRef.current = currentTime;
      
      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      
      // Call check-in API with abort signal
      const response = await fetch('/api/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ registrantId }),
        signal: abortControllerRef.current.signal
      });

      // Check if request was aborted
      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      const result = await response.json();
      
      setScanResult(result);
      setDialogOpen(true);
      
      if (result.success) {
        setScanCount(prev => prev + 1);
        setLastScanTime(new Date());
        // Refetch overall statistics when a new check-in is successful
        refetchStats();
      }

    } catch (error) {
      // Ignore aborted requests
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      
      setScanResult({
        success: false,
        message: error instanceof Error ? error.message : "Có lỗi xảy ra khi xử lý mã QR"
      });
      setDialogOpen(true);
    } finally {
      // Remove from processing queue
      processingQueueRef.current.delete(registrantId);
      
      // Reset processing state after a longer delay
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingMessage("");
        abortControllerRef.current = null;
      }, 2000);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setScanResult(null);
    
    // Clear processing queue and reset state
    processingQueueRef.current.clear();
    setIsProcessing(false);
    setProcessingMessage("");
    
    // Abort any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <QrCode className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Phiên quét này</p>
                <p className="text-2xl font-bold">{scanCount}</p>
                <p className="text-xs text-muted-foreground">
                  {lastScanTime ? `Lần cuối: ${lastScanTime.toLocaleTimeString('vi-VN')}` : 'Chưa quét'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Tổng đã check-in</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? '...' : stats.totalCheckedIn.toLocaleString()}
                </p>
                <Badge variant="default" className="text-xs bg-green-100 text-green-700">
                  {isProcessing ? "Đang xử lý..." : isScanning ? "Đang quét" : "Sẵn sàng"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Chờ check-in</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? '...' : stats.waitingCheckIn.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Tổng: {statsLoading ? '...' : stats.totalConfirmed.toLocaleString()} người
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scanner Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <QrCode className="h-6 w-6" />
            <span>Quét mã QR check-in</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera View */}
          <div className="relative">
            <div 
              ref={scannerElementRef}
              id={scannerElementId} 
              className={`w-full ${isScanning ? 'block' : 'hidden'}`}
            ></div>
            {!isScanning && (
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center">
                    <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Camera chưa được kích hoạt</p>
                    <p className="text-sm opacity-75">Nhấn nút bên dưới để bắt đầu quét</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Processing Message in Center */}
            {isProcessing && processingMessage && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className="text-sm font-medium">{processingMessage}</span>
                </div>
              </div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={isScanning ? stopScanning : startScanning}
              size="lg"
              className={isScanning ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
            >
              {isScanning ? (
                <>
                  <CameraOff className="h-5 w-5 mr-2" />
                  Dừng quét
                </>
              ) : (
                <>
                  <Camera className="h-5 w-5 mr-2" />
                  Bắt đầu quét
                </>
              )}
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-center text-sm text-muted-foreground space-y-2">
            {isProcessing ? (
              <div className="text-green-600 font-medium">
                <p>✅ Đã quét thành công!</p>
                <p className="text-xs mt-1">Bạn có thể di chuyển QR code khỏi camera</p>
              </div>
            ) : (
              <>
                <p>• Đưa mã QR vào khung hình để quét</p>
                <p>• Giữ thiết bị ổn định và đảm bảo ánh sáng đủ</p>
                <p>• Mã QR sẽ được xử lý tự động sau khi quét thành công</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Check-in Result Dialog */}
      <CheckInDialog
        open={dialogOpen}
        result={scanResult}
        onClose={handleDialogClose}
      />
    </div>
  );
}
