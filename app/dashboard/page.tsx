import { createSupabaseServerClient } from "@/lib/supabase/server";

import RequireAuth from "@/components/auth/RequireAuth";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { Navigation } from "@/components/layout/Navigation";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  console.log("USER FROM SERVER:", data.user);

  return (
    <RequireAuth>
      <Navigation />
      <Dashboard />
    </RequireAuth>
  );
}
