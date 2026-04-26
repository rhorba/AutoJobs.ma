import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ok, err } from "@/lib/api-response";
import { calcCompleteness } from "@/lib/completeness";
import { z } from "zod";

const patchSchema = z.object({
  city:              z.string().min(1).optional(),
  years_experience:  z.number().int().min(0).max(60).optional(),
  availability:      z.enum(["immediately","within_1_month","within_3_months","not_looking"]).optional(),
  skill_tag_ids:     z.array(z.string().uuid()).max(15).optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err("Unauthorized", 401);

  const { data: candidate } = await supabase
    .from("candidates")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (!candidate) return err("Candidate not found", 404);

  const { data: skills } = await supabase
    .from("candidate_skills")
    .select("skill_tag_id, level")
    .eq("candidate_id", candidate.id);

  const { data: experiences } = await supabase
    .from("candidate_experiences")
    .select("*")
    .eq("candidate_id", candidate.id)
    .order("start_date", { ascending: false });

  return ok({ candidate, skills: skills ?? [], experiences: experiences ?? [] });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err("Unauthorized", 401);

  const body = await request.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input", 422);

  const { skill_tag_ids, ...candidateFields } = parsed.data;

  const service = await createServiceClient();

  // Get current candidate
  const { data: candidate } = await service
    .from("candidates")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (!candidate) return err("Candidate not found", 404);

  // Update candidate fields
  if (Object.keys(candidateFields).length > 0) {
    const { error } = await service
      .from("candidates")
      .update(candidateFields)
      .eq("id", candidate.id);
    if (error) return err("Failed to update profile", 500);
  }

  // Replace skills if provided
  if (skill_tag_ids !== undefined) {
    await service.from("candidate_skills").delete().eq("candidate_id", candidate.id);
    if (skill_tag_ids.length > 0) {
      await service.from("candidate_skills").insert(
        skill_tag_ids.map((id) => ({ candidate_id: candidate.id, skill_tag_id: id }))
      );
    }
  }

  // Recalculate completeness
  const { count: expCount } = await service
    .from("candidate_experiences")
    .select("id", { count: "exact", head: true })
    .eq("candidate_id", candidate.id);

  const { count: skillCount } = await service
    .from("candidate_skills")
    .select("skill_tag_id", { count: "exact", head: true })
    .eq("candidate_id", candidate.id);

  const merged = { ...candidate, ...candidateFields };
  const completeness = calcCompleteness(merged, skillCount ?? 0, expCount ?? 0);

  await service
    .from("candidates")
    .update({ profile_completeness: completeness })
    .eq("id", candidate.id);

  return ok({ profile_completeness: completeness });
}
