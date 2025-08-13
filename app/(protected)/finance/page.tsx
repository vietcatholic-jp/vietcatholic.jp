import { requireRole, getServerUserProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import FinanceOverview from '@/components/finance/finance-overview';

export default async function FinancePage() {
  try {
    await requireRole(['cashier_role', 'super_admin', 'regional_admin', 'event_organizer']);
  } catch {
    redirect('/dashboard');
  }

  const profile = await getServerUserProfile();

  return <FinanceOverview userRole={profile?.role} />;
}