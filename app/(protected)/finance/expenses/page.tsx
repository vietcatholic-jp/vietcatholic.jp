import { requireRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ExpensesManager from '@/components/finance/expenses-manager';

export default async function FinanceExpensesPage() {
  try {
    await requireRole(['event_organizer', 'super_admin', 'regional_admin']);
  } catch {
    redirect('/finance');
  }

  return <ExpensesManager />;
}