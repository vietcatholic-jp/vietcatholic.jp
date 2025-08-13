import { requireRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import FinanceNavigation from '@/components/finance/finance-navigation';

export default async function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireRole(['cashier_role', 'super_admin', 'regional_admin', 'event_organizer']);
  } catch {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quản lý tài chính
          </h1>
          <p className="text-gray-600">
            Hệ thống quản lý thanh toán, quyên góp và chi tiêu sự kiện
          </p>
        </div>
        
        <FinanceNavigation />
        
        <div className="mt-8">
          {children}
        </div>
      </div>
    </div>
  );
}