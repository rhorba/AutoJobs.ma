import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type JobPosting = Database["public"]["Tables"]["job_postings"]["Row"];

const STATUS_LABELS: Record<JobPosting["status"], string> = {
  draft:           "Brouillon",
  pending_payment: "En attente de paiement",
  active:          "Active",
  closed:          "Clôturée",
  expired:         "Expirée",
};

const STATUS_VARIANT: Record<JobPosting["status"], "default" | "secondary" | "outline" | "destructive"> = {
  draft:           "secondary",
  pending_payment: "outline",
  active:          "default",
  closed:          "secondary",
  expired:         "destructive",
};

export default async function OffresPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const service = await createServiceClient();
  const { data: recruiter } = await service
    .from("recruiters").select("id, company_id").eq("user_id", user.id).single();
  if (!recruiter) redirect("/connexion");

  const { data: jobs } = await service
    .from("job_postings")
    .select("id, title, city, contract_type, status, created_at, views_count")
    .eq("company_id", recruiter.company_id)
    .order("created_at", { ascending: false });

  const postings = (jobs ?? []) as Pick<JobPosting, "id" | "title" | "city" | "contract_type" | "status" | "created_at" | "views_count">[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mes offres d&apos;emploi</h1>
        <Link href="/offres/nouvelle" className={cn(buttonVariants({ size: "sm" }))}>
          + Nouvelle offre
        </Link>
      </div>

      {postings.length === 0 ? (
        <div className="rounded-lg border bg-background p-8 text-center">
          <p className="text-muted-foreground">Aucune offre publiée pour l&apos;instant.</p>
          <Link href="/offres/nouvelle" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}>
            Créer votre première offre
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {postings.map((job) => (
            <div key={job.id} className="flex items-center justify-between rounded-lg border bg-background p-4">
              <div>
                <p className="font-medium">{job.title}</p>
                <p className="text-sm text-muted-foreground">
                  {job.city} · {job.contract_type} · {new Date(job.created_at).toLocaleDateString("fr-MA")}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">{job.views_count} vue{job.views_count !== 1 ? "s" : ""}</span>
                <Badge variant={STATUS_VARIANT[job.status]}>{STATUS_LABELS[job.status]}</Badge>
                {job.status === "active" && (
                  <Link href={`/offres/${job.id}/candidatures`} className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
                    Candidatures
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
