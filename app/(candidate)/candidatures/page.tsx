import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  submitted:   { label: "Envoyée",      variant: "bg-blue-100 text-blue-700" },
  viewed:      { label: "Vue",          variant: "bg-yellow-100 text-yellow-700" },
  shortlisted: { label: "Sélectionné",  variant: "bg-green-100 text-green-700" },
  rejected:    { label: "Refusée",      variant: "bg-red-100 text-red-700" },
};

export default async function CandidaturesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const service = await createServiceClient();
  const { data: candidate } = await service
    .from("candidates").select("id").eq("user_id", user.id).single();
  if (!candidate) redirect("/profil");

  const { data: applications } = await service
    .from("applications")
    .select("id, status, applied_at, job_posting_id")
    .eq("candidate_id", candidate.id)
    .order("applied_at", { ascending: false });

  const jobIds = (applications ?? []).map((a) => a.job_posting_id);

  const [jobsRes, companiesRes] = await Promise.all([
    jobIds.length
      ? service.from("job_postings").select("id, title, city, contract_type, company_id").in("id", jobIds)
      : Promise.resolve({ data: [] }),
    Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const jobs = jobsRes.data ?? [];
  const companyIds = jobs.map((j) => j.company_id);

  const { data: companies } = companyIds.length
    ? await service.from("companies").select("id, name").in("id", companyIds)
    : { data: [] };

  const jobMap = new Map(jobs.map((j) => [j.id, j]));
  const companyMap = new Map((companies ?? []).map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mes candidatures</h1>
        <Link href="/jobs" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Voir les offres
        </Link>
      </div>

      {!applications?.length ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="font-medium text-muted-foreground">Aucune candidature pour l'instant</p>
          <p className="mt-1 text-sm text-muted-foreground">Parcourez les offres et postulez !</p>
          <Link href="/jobs" className={cn(buttonVariants({ size: "sm" }), "mt-4")}>
            Voir les offres
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const job = jobMap.get(app.job_posting_id);
            const company = job ? companyMap.get(job.company_id) : null;
            const statusInfo = STATUS_LABELS[app.status] ?? STATUS_LABELS.submitted;
            return (
              <div key={app.id} className="flex items-center justify-between rounded-lg border bg-background p-4">
                <div className="space-y-0.5">
                  <p className="font-medium">{job?.title ?? "Offre supprimée"}</p>
                  <p className="text-sm text-muted-foreground">
                    {company?.name ?? "—"} · {job?.city} · {job?.contract_type}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(app.applied_at).toLocaleDateString("fr-MA")}
                  </p>
                </div>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", statusInfo.variant)}>
                  {statusInfo.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
