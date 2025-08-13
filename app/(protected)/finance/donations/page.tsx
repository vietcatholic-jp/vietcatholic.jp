import { requireRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DonationsManager from '@/components/finance/donations-manager';

export default async function FinanceDonationsPage() {
  try {
    await requireRole(['super_admin', 'regional_admin']);
  } catch {
    redirect('/finance');
  }

  return <DonationsManager />;
}