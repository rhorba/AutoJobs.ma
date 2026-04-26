import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { Database } from "@/types/database";

type JobPosting = Database["public"]["Tables"]["job_postings"]["Row"];
type Company    = Database["public"]["Tables"]["companies"]["Row"];

const CONTRACT_TYPES = ["CDI", "CDD", "Interim", "Stage", "Freelance"] as const;
const CITIES = ["Tanger","Kénitra","Casablanca","Jorf Lasfar","Rabat","Fès","Marrakech","Agadir","Autre"] as const;

interface SearchParams { city?: string; contract_type?: string; page?: string }

export default async function JobsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const city         = params.city;
  const contractType = params.contract_type;
  const page         = Math.max(1, Number(params.page ?? "1"));
  const limit        = 20;
  const offset       = (page - 1) * limit;

  const service = await createServiceClient();
  let query = service
    .from("job_postings")
    .select("id, title, city, contract_type, salary_min, salary_max, created_at, company_id, is_featured, description_fr", { count: "exact" })
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (city)         query = query.eq("city", city);
  if (contractType) query = query.eq("contract_type", contractType as JobPosting["contract_type"]);

  const { data: jobs, count } = await query;

  // Fetch company names for displayed jobs
  const companyIds = [...new Set((jobs ?? []).map((j) => j.company_id))];
  const { data: companies } = companyIds.length
    ? await service.from("companies").select("id, name").in("id", companyIds)
    : { data: [] };
  const companyMap = new Map((companies ?? []).map((c: Pick<Company, "id" | "name">) => [c.id, c.name]));

  const totalPages = Math.ceil((count ?? 0) / limit);

  function buildUrl(overrides: SearchParams) {
    const p = new URLSearchParams();
    const merged = { city, contract_type: contractType, page: String(page), ...overrides };
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, v); });
    return `/jobs?${p.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Offres d&apos;emploi automobile & EV au Maroc</h1>
        <p className="text-sm text-muted-foreground">{count ?? 0} offre{(count ?? 0) !== 1 ? "s" : ""} disponible{(count ?? 0) !== 1 ? "s" : ""}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Link href="/jobs" className={cn(buttonVariants({ variant: !city && !contractType ? "default" : "outline", size: "sm" }))}>
          Toutes
        </Link>
        {CITIES.map((c) => (
          <Link key={c} href={buildUrl({ city: city === c ? undefined : c, page: "1" })}
            className={cn(buttonVariants({ variant: city === c ? "default" : "outline", size: "sm" }))}>
            {c}
          </Link>
        ))}
        {CONTRACT_TYPES.map((ct) => (
          <Link key={ct} href={buildUrl({ contract_type: contractType === ct ? undefined : ct, page: "1" })}
            className={cn(buttonVariants({ variant: contractType === ct ? "default" : "outline", size: "sm" }))}>
            {ct}
          </Link>
        ))}
      </div>

      {/* Job list */}
      {!jobs?.length ? (
        <p className="text-muted-foreground">Aucune offre ne correspond à vos critères.</p>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}
              className="block rounded-lg border bg-background p-5 hover:border-foreground/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {job.is_featured && <Badge>À la une</Badge>}
                    <p className="font-semibold">{job.title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {companyMap.get(job.company_id) ?? "—"} · {job.city} · {job.contract_type}
                  </p>
                  {(job.salary_min || job.salary_max) && (
                    <p className="text-sm">
                      {job.salary_min ? `${job.salary_min.toLocaleString("fr-MA")} MAD` : ""}
                      {job.salary_min && job.salary_max ? " – " : ""}
                      {job.salary_max ? `${job.salary_max.toLocaleString("fr-MA")} MAD` : ""}/mois
                    </p>
                  )}
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{job.description_fr}</p>
                </div>
                <p className="shrink-0 text-xs text-muted-foreground">
                  {new Date(job.created_at).toLocaleDateString("fr-MA")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Link href={buildUrl({ page: String(page - 1) })}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              ← Précédent
            </Link>
          )}
          <span className="flex items-center px-3 text-sm">Page {page} / {totalPages}</span>
          {page < totalPages && (
            <Link href={buildUrl({ page: String(page + 1) })}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Suivant →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
