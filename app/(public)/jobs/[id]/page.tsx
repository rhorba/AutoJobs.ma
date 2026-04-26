import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";
import type { Database } from "@/types/database";

type Company = Database["public"]["Tables"]["companies"]["Row"];

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const service = await createServiceClient();
  const { data } = await service
    .from("job_postings").select("title, city").eq("id", id).eq("status", "active").single();
  if (!data) return {};
  return { title: `${data.title} – ${data.city} | AutoJobs.ma` };
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params;
  const service = await createServiceClient();

  const { data: job } = await service
    .from("job_postings")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (!job) notFound();

  const { data: company } = await service
    .from("companies")
    .select("id, name, city, website")
    .eq("id", job.company_id)
    .single() as { data: Pick<Company, "id" | "name" | "city" | "website"> | null };

  // Increment view count (fire-and-forget, no await)
  service.from("job_postings").update({ views_count: (job.views_count ?? 0) + 1 }).eq("id", id);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main content */}
      <div className="space-y-6 lg:col-span-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {job.is_featured && <Badge>À la une</Badge>}
            <Badge variant="outline">{job.contract_type}</Badge>
          </div>
          <h1 className="text-2xl font-semibold">{job.title}</h1>
          <p className="text-muted-foreground mt-1">
            {company?.name ?? "—"} · {job.city}
          </p>
          {(job.salary_min || job.salary_max) && (
            <p className="mt-2 font-medium">
              {job.salary_min ? `${job.salary_min.toLocaleString("fr-MA")} MAD` : ""}
              {job.salary_min && job.salary_max ? " – " : ""}
              {job.salary_max ? `${job.salary_max.toLocaleString("fr-MA")} MAD` : ""}
              /mois
            </p>
          )}
        </div>

        <div className="prose prose-sm max-w-none whitespace-pre-wrap rounded-lg border p-5">
          {job.description_fr}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <div className="rounded-lg border p-5 space-y-4">
          <Link
            href={`/candidatures/postuler?job_id=${job.id}`}
            className={cn(buttonVariants({ size: "lg" }), "w-full")}
          >
            Postuler
          </Link>

          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Contrat</dt>
              <dd className="font-medium">{job.contract_type}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Localisation</dt>
              <dd className="font-medium">{job.city}</dd>
            </div>
            {job.expires_at && (
              <div>
                <dt className="text-muted-foreground">Expire le</dt>
                <dd className="font-medium">{new Date(job.expires_at).toLocaleDateString("fr-MA")}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">Publiée le</dt>
              <dd className="font-medium">{new Date(job.created_at).toLocaleDateString("fr-MA")}</dd>
            </div>
          </dl>
        </div>

        {company && (
          <div className="rounded-lg border p-5 space-y-2">
            <p className="font-medium">{company.name}</p>
            {company.city && <p className="text-sm text-muted-foreground">{company.city}</p>}
            {company.website && (
              <a href={company.website} target="_blank" rel="noopener noreferrer"
                className="text-sm text-primary hover:underline">
                {company.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
        )}

        <Link href="/jobs" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full")}>
          ← Retour aux offres
        </Link>
      </div>
    </div>
  );
}
