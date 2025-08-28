import { requireRole } from "@/lib/auth";

export default async function AdminLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  // Allow access for various admin roles
  await requireRole(['registration_manager', 'super_admin','cashier_role']);

  return (
	<div className="min-h-screen bg-background">
	  {children}
	</div>
  );
}