import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ok, err } from "@/lib/api-response";
import { z } from "zod";

const schema = z.object({
  job_id:     z.string().uuid(),
  cover_note: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err("Unauthorized", 401);

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "candidate") return err("Forbidden", 403);

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input", 422);

  const service = await createServiceClient();

  const { data: candidate } = await service
    .from("candidates")
    .select("id, profile_completeness")
    .eq("user_id", user.id)
    .single();
  if (!candidate) return err("Candidate profile not found", 404);
  if (candidate.profile_completeness < 80) {
    return err("Complétez votre profil à 80% avant de postuler", 403);
  }

  const { data: job } = await service
    .from("job_postings")
    .select("id, expires_at")
    .eq("id", parsed.data.job_id)
    .eq("status", "active")
    .single();
  if (!job) return err("Offre introuvable ou non active", 404);
  if (job.expires_at && new Date(job.expires_at) < new Date()) {
    return err("Cette offre a expiré", 410);
  }

  // Idempotency: already applied?
  const { data: existing } = await service
    .from("applications")
    .select("id")
    .eq("job_posting_id", parsed.data.job_id)
    .eq("candidate_id", candidate.id)
    .maybeSingle();
  if (existing) return err("Vous avez déjà postulé à cette offre", 409);

  const { data: application, error } = await service
    .from("applications")
    .insert({
      job_posting_id: parsed.data.job_id,
      candidate_id:   candidate.id,
      cover_note:     parsed.data.cover_note ?? null,
      status:         "submitted",
    })
    .select()
    .single();

  if (error) return err("Failed to submit application", 500);

  return ok({ application }, 201);
}
