import { requireRole } from "@/lib/auth";
import { Navbar } from "@/components/navbar";

export default async function AdminLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  // Allow access for various admin roles
  await requireRole(['registration_manager', 'super_admin']);

  return (
	<main className="min-h-screen bg-background">
	  <Navbar />
	  {children}
	</main>
  );
}