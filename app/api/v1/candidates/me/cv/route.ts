import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ok, err } from "@/lib/api-response";
import { calcCompleteness } from "@/lib/completeness";
import { cvLimiter, checkLimit } from "@/lib/ratelimit";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err("Unauthorized", 401);

  if (!await checkLimit(cvLimiter, user.id)) return err("Trop de téléversements. Réessayez plus tard.", 429);

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return err("Expected multipart/form-data", 415);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return err("Failed to parse form data", 400);
  }

  const file = formData.get("cv");
  if (!(file instanceof File)) return err("cv field required", 422);
  if (file.size > MAX_BYTES) return err("File too large (max 10 MB)", 413);

  // Magic bytes check — first 4 bytes must be %PDF
  const buffer = await file.arrayBuffer();
  const header = new Uint8Array(buffer, 0, 4);
  const isPdf =
    header[0] === 0x25 && // %
    header[1] === 0x50 && // P
    header[2] === 0x44 && // D
    header[3] === 0x46;   // F
  if (!isPdf) return err("File must be a PDF", 422);

  const service = await createServiceClient();
  const { data: candidate } = await service
    .from("candidates").select("*").eq("user_id", user.id).single();
  if (!candidate) return err("Candidate not found", 404);

  const path = `cvs/${candidate.id}/${Date.now()}.pdf`;

  const { error: uploadError } = await service.storage
    .from("candidate-cvs")
    .upload(path, buffer, { contentType: "application/pdf", upsert: false });

  if (uploadError) return err("Upload failed", 500);

  // Delete old CV file if it exists
  if (candidate.cv_file_path && candidate.cv_file_path !== path) {
    await service.storage.from("candidate-cvs").remove([candidate.cv_file_path]);
  }

  // Update candidate record + recalc completeness
  const { count: expCount } = await service
    .from("candidate_experiences")
    .select("id", { count: "exact", head: true })
    .eq("candidate_id", candidate.id);
  const { count: skillCount } = await service
    .from("candidate_skills")
    .select("skill_tag_id", { count: "exact", head: true })
    .eq("candidate_id", candidate.id);

  const updatedCandidate = { ...candidate, cv_file_path: path };
  const completeness = calcCompleteness(updatedCandidate, skillCount ?? 0, expCount ?? 0);

  const { error: updateError } = await service
    .from("candidates")
    .update({ cv_file_path: path, profile_completeness: completeness })
    .eq("id", candidate.id);

  if (updateError) return err("Failed to update candidate record", 500);

  return ok({ cv_file_path: path, profile_completeness: completeness });
}
