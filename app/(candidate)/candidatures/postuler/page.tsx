import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { ApplyForm } from "./apply-form";

interface Props {
  searchParams: Promise<{ job_id?: string }>;
}

export default async function PostulerPage({ searchParams }: Props) {
  const { job_id } = await searchParams;
  if (!job_id) redirect("/jobs");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const service = await createServiceClient();

  const { data: candidate } = await service
    .from("candidates")
    .select("id, first_name, last_name, profile_completeness, cv_file_path")
    .eq("user_id", user.id)
    .single();
  if (!candidate) redirect("/profil");

  const { data: job } = await service
    .from("job_postings")
    .select("id, title, city, contract_type, salary_min, salary_max, company_id")
    .eq("id", job_id)
    .eq("status", "active")
    .single();
  if (!job) redirect("/jobs");

  const { data: company } = await service
    .from("companies").select("name").eq("id", job.company_id).single();

  const { data: existing } = await service
    .from("applications")
    .select("id")
    .eq("job_posting_id", job_id)
    .eq("candidate_id", candidate.id)
    .maybeSingle();

  const canApply = candidate.profile_completeness >= 80;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Postuler</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-muted-foreground">Offre</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="font-semibold">{job.title}</p>
          <p className="text-sm text-muted-foreground">
            {company?.name ?? "—"} · {job.city} · {job.contract_type}
          </p>
          {(job.salary_min || job.salary_max) && (
            <p className="text-sm font-medium">
              {job.salary_min ? `${job.salary_min.toLocaleString("fr-MA")} MAD` : ""}
              {job.salary_min && job.salary_max ? " – " : ""}
              {job.salary_max ? `${job.salary_max.toLocaleString("fr-MA")} MAD` : ""}
              /mois
            </p>
          )}
        </CardContent>
      </Card>

      {existing ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Vous avez déjà postulé à cette offre.{" "}
          <Link href="/candidatures" className="underline">Voir mes candidatures</Link>
        </div>
      ) : !canApply ? (
        <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-700">
            Profil incomplet — {candidate.profile_completeness}% / 80% requis
          </p>
          <p className="text-sm text-amber-600">
            Complétez votre profil pour pouvoir postuler.
          </p>
          <Link href="/profil" className={cn(buttonVariants({ size: "sm", variant: "outline" }), "mt-1")}>
            Compléter mon profil
          </Link>
        </div>
      ) : (
        <ApplyForm
          jobId={job_id}
          candidateName={`${candidate.first_name} ${candidate.last_name}`}
          hasCv={!!candidate.cv_file_path}
        />
      )}
    </div>
  );
}
