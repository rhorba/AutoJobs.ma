import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ok, err } from "@/lib/api-response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err("Unauthorized", 401);

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "employer") return err("Forbidden", 403);

  const service = await createServiceClient();

  const { data: recruiter } = await service
    .from("recruiters").select("company_id").eq("user_id", user.id).single();
  if (!recruiter) return err("Recruiter not found", 404);

  // Verify job belongs to this company
  const { data: job } = await service
    .from("job_postings").select("id").eq("id", id).eq("company_id", recruiter.company_id).single();
  if (!job) return err("Job not found", 404);

  const { data: applications, error } = await service
    .from("applications")
    .select("id, status, cover_note, applied_at")
    .eq("job_posting_id", id)
    .order("applied_at", { ascending: false });

  if (error) return err("Failed to fetch applications", 500);

  return ok({ applications: applications ?? [], total: (applications ?? []).length });
}
