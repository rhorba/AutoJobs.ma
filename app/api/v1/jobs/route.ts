import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ok, err } from "@/lib/api-response";
import { z } from "zod";

const postSchema = z.object({
  title:          z.string().min(2).max(200),
  city:           z.string().min(1),
  contract_type:  z.enum(["CDI", "CDD", "Interim", "Stage", "Freelance"]),
  description_fr: z.string().min(50).max(5000),
  role_family_id: z.string().uuid().nullable().optional(),
  salary_min:     z.number().int().min(0).max(999999).nullable().optional(),
  salary_max:     z.number().int().min(0).max(999999).nullable().optional(),
});

// Public job listing — only active, non-expired jobs
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city         = searchParams.get("city");
  const contractType = searchParams.get("contract_type");
  const page         = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit        = 20;
  const offset       = (page - 1) * limit;

  const service = await createServiceClient();
  let query = service
    .from("job_postings")
    .select("id, title, city, contract_type, salary_min, salary_max, created_at, company_id, is_featured", { count: "exact" })
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (city)         query = query.eq("city", city);
  if (contractType) query = query.eq("contract_type", contractType as "CDI" | "CDD" | "Interim" | "Stage" | "Freelance");

  const { data, count, error } = await query;
  if (error) return err("Failed to fetch jobs", 500);

  return ok({ jobs: data ?? [], total: count ?? 0, page, limit });
}

// Employer creates a draft job posting
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err("Unauthorized", 401);

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "employer") return err("Forbidden", 403);

  const body = await request.json().catch(() => ({}));
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input", 422);

  const service = await createServiceClient();
  const { data: recruiter } = await service
    .from("recruiters").select("id, company_id").eq("user_id", user.id).single();
  if (!recruiter) return err("Recruiter not found", 404);

  // Only verified companies can post
  const { data: company } = await service
    .from("companies").select("verified_at").eq("id", recruiter.company_id).single();
  if (!company?.verified_at) return err("Company not verified", 403);

  const { data: job, error } = await service
    .from("job_postings")
    .insert({
      title:          parsed.data.title,
      city:           parsed.data.city,
      contract_type:  parsed.data.contract_type,
      description_fr: parsed.data.description_fr,
      role_family_id: parsed.data.role_family_id ?? null,
      salary_min:     parsed.data.salary_min ?? null,
      salary_max:     parsed.data.salary_max ?? null,
      company_id:     recruiter.company_id,
      recruiter_id:   recruiter.id,
      status:         "draft",
    })
    .select()
    .single();

  if (error) return err("Failed to create job posting", 500);

  return ok({ job }, 201);
}
