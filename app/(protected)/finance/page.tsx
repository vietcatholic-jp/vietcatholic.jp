import { getServerUserProfile } from '@/lib/auth';
import FinanceOverview from '@/components/finance/finance-overview';

export default async function FinancePage() {

  const profile = await getServerUserProfile();

  return <FinanceOverview userRole={profile?.role} />;
}