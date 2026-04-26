import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "employer") redirect("/");

  const service = await createServiceClient();
  const { data: recruiter } = await service
    .from("recruiters").select("first_name, company_id").eq("user_id", user.id).single();
  const { data: company } = recruiter
    ? await service.from("companies").select("name, verified_at").eq("id", recruiter.company_id).single()
    : { data: null };

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-semibold">AutoJobs.ma</Link>
            {company && (
              <span className="text-sm text-muted-foreground">· {company.name}</span>
            )}
          </div>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/tableau-de-bord" className="hover:text-foreground">Tableau de bord</Link>
            <Link href="/offres"          className="hover:text-foreground">Mes offres</Link>
            <Link href="/talents"         className="hover:text-foreground">Talents</Link>
            <Link href="/facturation"     className="hover:text-foreground">Facturation</Link>
          </nav>
        </div>
      </header>

      {company && !company.verified_at && (
        <div className="border-b bg-amber-50 px-6 py-2 text-center text-sm text-amber-700">
          Votre entreprise est en cours de vérification. Vous pourrez publier des offres une fois approuvé.
        </div>
      )}

      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
