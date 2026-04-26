import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ok, err } from "@/lib/api-response";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["viewed", "shortlisted", "rejected"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err("Unauthorized", 401);

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "employer") return err("Forbidden", 403);

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err("Invalid status", 422);

  const service = await createServiceClient();

  const { data: recruiter } = await service
    .from("recruiters").select("company_id").eq("user_id", user.id).single();
  if (!recruiter) return err("Recruiter not found", 404);

  // Verify the application belongs to a job owned by this company
  const { data: application } = await service
    .from("applications")
    .select("id, job_posting_id")
    .eq("id", id)
    .single();
  if (!application) return err("Application not found", 404);

  const { data: job } = await service
    .from("job_postings")
    .select("id")
    .eq("id", application.job_posting_id)
    .eq("company_id", recruiter.company_id)
    .single();
  if (!job) return err("Forbidden", 403);

  const { data: updated, error } = await service
    .from("applications")
    .update({ status: parsed.data.status })
    .eq("id", id)
    .select()
    .single();

  if (error) return err("Failed to update application", 500);

  return ok({ application: updated });
}
