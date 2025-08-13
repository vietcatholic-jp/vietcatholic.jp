import { requireRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CashierDashboard from '@/components/finance/cashier-dashboard';

export default async function CashierPage() {
  try {
    await requireRole(['cashier_role', 'super_admin']);
  } catch {
    redirect('/finance');
  }

  return <CashierDashboard />;
}