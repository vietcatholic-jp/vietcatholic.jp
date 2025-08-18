import { requireRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ExpensesManager from '@/components/finance/expenses-manager';

export default async function FinanceExpensesPage() {
  try {
    await requireRole(['super_admin', 'cashier_role']);
  } catch {
    redirect('/finance');
  }

  return <ExpensesManager />;
}