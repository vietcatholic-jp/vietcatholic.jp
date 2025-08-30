import { requireRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import IncomeSourcesManager from '@/components/finance/income-sources-manager';

export default async function FinanceIncomeSourcesPage() {
  try {
    await requireRole(['super_admin', 'regional_admin', 'cashier_role', 'event_organizer']);
  } catch {
    redirect('/finance');
  }

  return <IncomeSourcesManager />;
}
