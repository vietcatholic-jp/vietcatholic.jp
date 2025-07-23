import { requireRole } from "@/lib/auth";
import { TeamsAssignmentPage } from "@/components/admin/teams/teams-assignment-page";

export default async function TeamAssignmentPage() {
  await requireRole(['event_organizer', 'super_admin']);

  return <TeamsAssignmentPage />;
}
