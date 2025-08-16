import RequireAuth from "@/components/auth/RequireAuth";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { Navigation } from "@/components/layout/Navigation";

export default async function DashboardPage() {
  return (
    <RequireAuth>
      <Navigation />
      <Dashboard />
    </RequireAuth>
  );
}
