import { requireRole } from "@/lib/auth";
import { CheckInScanner } from "@/components/check-in/check-in-scanner";

export default async function CheckInPage() {
  // Only allow registration managers and admins
  await requireRole(['registration_manager', 'event_organizer', 'super_admin']);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-4">
              Check-in Tham Gia Sự Kiện
            </h1>
            <p className="text-muted-foreground">
              Quét mã QR từ vé tham gia để check-in cho người tham dự
            </p>
          </div>

          {/* Scanner Component */}
          <CheckInScanner />
        </div>
      </div>
    </div>
  );
}
