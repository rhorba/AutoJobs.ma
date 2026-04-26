import { createClient, createServiceClient } from "@/lib/supabase/server";
import { err, ok } from "@/lib/api-response";
import { uniqueSlug } from "@/lib/slugify";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const profileType = searchParams.get("type");

  if (profileType !== "employer" && profileType !== "candidate") {
    return err("Invalid type. Must be 'employer' or 'candidate'.", 400);
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) return err("Unauthorized", 401);

  const service = await createServiceClient();

  // Idempotency: skip if profile already exists
  const { data: existing } = await service
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (existing) {
    return ok({ profile: existing });
  }

  const meta = user.user_metadata ?? {};

  if (profileType === "employer") {
    // 1. Profile — role hardcoded, never from request body
    const { error: profileErr } = await service
      .from("profiles")
      .insert({ id: user.id, role: "employer" });
    if (profileErr) return err("Failed to create profile", 500);

    // 2. Company
    const companyName = (meta.company_name as string | undefined) ?? "Unnamed Company";
    const { data: company, error: companyErr } = await service
      .from("companies")
      .insert({
        name: companyName,
        slug: uniqueSlug(companyName),
        city: (meta.city as string | undefined) ?? "",
      })
      .select()
      .single();
    if (companyErr || !company) return err("Failed to create company", 500);

    // 3. Recruiter (company owner)
    const { error: recruiterErr } = await service
      .from("recruiters")
      .insert({
        user_id: user.id,
        company_id: company.id,
        first_name: (meta.first_name as string | undefined) ?? "",
        last_name: (meta.last_name as string | undefined) ?? "",
        is_company_owner: true,
      });
    if (recruiterErr) return err("Failed to create recruiter", 500);

    return ok({ role: "employer", company_id: company.id });
  }

  // profileType === "candidate"
  const { error: profileErr } = await service
    .from("profiles")
    .insert({ id: user.id, role: "candidate" });
  if (profileErr) return err("Failed to create profile", 500);

  const { error: candidateErr } = await service
    .from("candidates")
    .insert({
      user_id: user.id,
      first_name: (meta.first_name as string | undefined) ?? "",
      last_name: (meta.last_name as string | undefined) ?? "",
      city: (meta.city as string | undefined) ?? "",
      profile_completeness: 20, // first_name + last_name baseline
    });
  if (candidateErr) return err("Failed to create candidate", 500);

  return ok({ role: "candidate" });
}
