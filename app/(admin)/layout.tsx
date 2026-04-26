import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center gap-6">
          <span className="font-semibold">AutoJobs.ma Admin</span>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <a href="/admin/entreprises" className="hover:text-foreground">Entreprises</a>
            <a href="/admin/offres"      className="hover:text-foreground">Offres</a>
            <a href="/admin/taxonomie"   className="hover:text-foreground">Taxonomie</a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-6">{children}</main>
    </div>
  );
}
