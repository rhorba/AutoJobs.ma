import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ok, err } from "@/lib/api-response";
import { calcCompleteness } from "@/lib/completeness";
import { z } from "zod";

const schema = z.object({
  company_name: z.string().min(1),
  title:        z.string().min(1),
  start_date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD required"),
  end_date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  description:  z.string().max(1000).nullable().optional(),
});

async function getCandidate(userId: string) {
  const service = await createServiceClient();
  const { data } = await service
    .from("candidates")
    .select("*")
    .eq("user_id", userId)
    .single();
  return { candidate: data, service };
}

async function recalcCompleteness(candidateId: string, service: Awaited<ReturnType<typeof createServiceClient>>, candidate: NonNullable<Awaited<ReturnType<typeof getCandidate>>["candidate"]>) {
  const { count: expCount } = await service
    .from("candidate_experiences")
    .select("id", { count: "exact", head: true })
    .eq("candidate_id", candidateId);

  const { count: skillCount } = await service
    .from("candidate_skills")
    .select("skill_tag_id", { count: "exact", head: true })
    .eq("candidate_id", candidateId);

  const completeness = calcCompleteness(candidate, skillCount ?? 0, expCount ?? 0);
  await service.from("candidates").update({ profile_completeness: completeness }).eq("id", candidateId);
  return completeness;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err("Unauthorized", 401);

  const { candidate, service } = await getCandidate(user.id);
  if (!candidate) return err("Candidate not found", 404);

  const { data } = await service
    .from("candidate_experiences")
    .select("*")
    .eq("candidate_id", candidate.id)
    .order("start_date", { ascending: false });

  return ok({ experiences: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err("Unauthorized", 401);

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input", 422);

  const { candidate, service } = await getCandidate(user.id);
  if (!candidate) return err("Candidate not found", 404);

  const { data: experience, error } = await service
    .from("candidate_experiences")
    .insert({ candidate_id: candidate.id, ...parsed.data })
    .select()
    .single();

  if (error) return err("Failed to create experience", 500);

  const completeness = await recalcCompleteness(candidate.id, service, candidate);
  return ok({ experience, profile_completeness: completeness }, 201);
}
