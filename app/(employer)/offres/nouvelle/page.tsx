import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { JobForm } from "./job-form";

export default async function NouvelleOffrePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const service = await createServiceClient();

  // Verify employer + company verified
  const { data: recruiter } = await service
    .from("recruiters").select("company_id").eq("user_id", user.id).single();
  if (!recruiter) redirect("/connexion");

  const { data: company } = await service
    .from("companies").select("verified_at").eq("id", recruiter.company_id).single();
  if (!company?.verified_at) redirect("/offres");

  const { data: tags } = await service
    .from("skill_tags")
    .select("id, name")
    .eq("category", "role_family")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nouvelle offre d&apos;emploi</h1>
        <p className="text-sm text-muted-foreground">
          L&apos;offre sera créée en brouillon. Un paiement de 490 MAD est requis pour la publier.
        </p>
      </div>
      <JobForm roleFamilies={tags ?? []} />
    </div>
  );
}
