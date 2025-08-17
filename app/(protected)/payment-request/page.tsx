import { requireRole, getServerUserProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PaymentRequestForm from '../../../components/finance/payment-request-page';

export default async function PaymentRequestPage() {
  try {
    await requireRole(['event_organizer','super_admin','cashier_role']);
  } catch {
    redirect('/dashboard');
  }

  await getServerUserProfile();

  return <PaymentRequestForm />;
}