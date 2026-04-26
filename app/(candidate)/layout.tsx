import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function CandidateLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "candidate") redirect("/");

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background px-6 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="font-semibold">AutoJobs.ma</Link>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/profil"       className="hover:text-foreground">Mon profil</Link>
            <Link href="/candidatures" className="hover:text-foreground">Candidatures</Link>
            <Link href="/jobs"         className="hover:text-foreground">Offres</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl p-6">{children}</main>
    </div>
  );
}
