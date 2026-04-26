import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ok, err } from "@/lib/api-response";
import { calcCompleteness } from "@/lib/completeness";
import { z } from "zod";

const schema = z.object({
  company_name: z.string().min(1).optional(),
  title:        z.string().min(1).optional(),
  start_date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  description:  z.string().max(1000).nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err("Unauthorized", 401);

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input", 422);

  const service = await createServiceClient();
  const { data: candidate } = await service
    .from("candidates").select("*").eq("user_id", user.id).single();
  if (!candidate) return err("Candidate not found", 404);

  // Verify ownership
  const { data: exp } = await service
    .from("candidate_experiences").select("id").eq("id", id).eq("candidate_id", candidate.id).single();
  if (!exp) return err("Experience not found", 404);

  const { data: updated, error } = await service
    .from("candidate_experiences").update(parsed.data).eq("id", id).select().single();
  if (error) return err("Failed to update experience", 500);

  return ok({ experience: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err("Unauthorized", 401);

  const service = await createServiceClient();
  const { data: candidate } = await service
    .from("candidates").select("*").eq("user_id", user.id).single();
  if (!candidate) return err("Candidate not found", 404);

  const { data: exp } = await service
    .from("candidate_experiences").select("id").eq("id", id).eq("candidate_id", candidate.id).single();
  if (!exp) return err("Experience not found", 404);

  await service.from("candidate_experiences").delete().eq("id", id);

  // Recalculate completeness
  const { count: expCount } = await service
    .from("candidate_experiences").select("id", { count: "exact", head: true }).eq("candidate_id", candidate.id);
  const { count: skillCount } = await service
    .from("candidate_skills").select("skill_tag_id", { count: "exact", head: true }).eq("candidate_id", candidate.id);
  const completeness = calcCompleteness(candidate, skillCount ?? 0, expCount ?? 0);
  await service.from("candidates").update({ profile_completeness: completeness }).eq("id", candidate.id);

  return ok({ profile_completeness: completeness });
}
