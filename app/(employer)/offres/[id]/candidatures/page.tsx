import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ApplicationActions } from "./application-actions";

interface Props { params: Promise<{ id: string }> }

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  submitted:   { label: "Nouvelle",    color: "bg-blue-100 text-blue-700" },
  viewed:      { label: "Vue",         color: "bg-yellow-100 text-yellow-700" },
  shortlisted: { label: "Sélectionné", color: "bg-green-100 text-green-700" },
  rejected:    { label: "Refusée",     color: "bg-red-100 text-red-700" },
};

const AVAILABILITY_LABELS: Record<string, string> = {
  immediately:      "Disponible immédiatement",
  within_1_month:   "Disponible dans 1 mois",
  within_3_months:  "Disponible dans 3 mois",
  not_looking:      "Pas en recherche active",
};

export default async function CandidaturesPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const service = await createServiceClient();

  const { data: recruiter } = await service
    .from("recruiters").select("company_id").eq("user_id", user.id).single();
  if (!recruiter) redirect("/offres");

  const { data: job } = await service
    .from("job_postings")
    .select("id, title, city, contract_type, status")
    .eq("id", id)
    .eq("company_id", recruiter.company_id)
    .single();
  if (!job) redirect("/offres");

  const { data: applications } = await service
    .from("applications")
    .select("id, status, cover_note, applied_at, candidate_id")
    .eq("job_posting_id", id)
    .order("applied_at", { ascending: false });

  const candidateIds = (applications ?? []).map((a) => a.candidate_id);

  const { data: candidates } = candidateIds.length
    ? await service
        .from("candidates")
        .select("id, first_name, last_name, city, years_experience, availability, cv_file_path")
        .in("id", candidateIds)
    : { data: [] };

  // Generate signed CV URLs (5-min expiry — server-rendered, suitable for immediate download)
  const cvUrls = new Map<string, string>();
  for (const c of candidates ?? []) {
    if (c.cv_file_path) {
      const { data } = await service.storage
        .from("candidate-cvs")
        .createSignedUrl(c.cv_file_path, 300);
      if (data?.signedUrl) cvUrls.set(c.id, data.signedUrl);
    }
  }

  const candidateMap = new Map((candidates ?? []).map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/offres" className="text-sm text-muted-foreground hover:text-foreground">
            ← Mes offres
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{job.title}</h1>
          <p className="text-sm text-muted-foreground">{job.city} · {job.contract_type}</p>
        </div>
        <span className="text-sm text-muted-foreground">
          {(applications ?? []).length} candidature{(applications ?? []).length !== 1 ? "s" : ""}
        </span>
      </div>

      {!applications?.length ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <p className="font-medium">Aucune candidature reçue pour l'instant</p>
          <p className="mt-1 text-sm">Partagez votre offre pour attirer des candidats.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const candidate = candidateMap.get(app.candidate_id);
            const statusInfo = STATUS_LABELS[app.status] ?? STATUS_LABELS.submitted;
            const cvUrl = candidate ? cvUrls.get(candidate.id) : undefined;
            return (
              <div key={app.id} className="rounded-lg border bg-background p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      {candidate ? `${candidate.first_name} ${candidate.last_name}` : "Candidat inconnu"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {candidate?.city}
                      {candidate?.years_experience != null ? ` · ${candidate.years_experience} an${candidate.years_experience > 1 ? "s" : ""} d'exp.` : ""}
                      {candidate?.availability ? ` · ${AVAILABILITY_LABELS[candidate.availability] ?? candidate.availability}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Postulé le {new Date(app.applied_at).toLocaleDateString("fr-MA")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {cvUrl && (
                      <a
                        href={cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                      >
                        CV
                      </a>
                    )}
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", statusInfo.color)}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {/* Cover note */}
                {app.cover_note && (
                  <p className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground italic">
                    "{app.cover_note}"
                  </p>
                )}

                {/* Actions */}
                <ApplicationActions applicationId={app.id} currentStatus={app.status} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
