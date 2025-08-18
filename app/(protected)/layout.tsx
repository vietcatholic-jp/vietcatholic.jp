import { requireRole } from "@/lib/auth";
import { UserProvider } from "./components/user-provider";
import { Header } from "./components/header";
import { Footer } from "./components/footer";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Basic authentication check - specific role checks are done in sub-layouts
  await requireRole(['participant', 'cashier_role', 'registration_manager', 'event_organizer', 'group_leader', 'regional_admin', 'super_admin']);

  return (
    <UserProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </UserProvider>
  );
}