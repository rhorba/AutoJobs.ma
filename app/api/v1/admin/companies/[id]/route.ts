import { createClient, createServiceClient } from "@/lib/supabase/server";
import { err, ok } from "@/lib/api-response";
import { sendEmployerVerified, sendEmployerRejected } from "@/lib/email";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Auth check — admin only
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err("Unauthorized", 401);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return err("Forbidden", 403);

  const body = await request.json().catch(() => ({})) as { action?: string; reason?: string };
  const { action, reason } = body;

  if (action !== "verify" && action !== "reject") {
    return err("action must be 'verify' or 'reject'", 400);
  }
  if (action === "reject" && !reason?.trim()) {
    return err("reason is required when rejecting", 400);
  }

  const service = await createServiceClient();

  // Get company + owner recruiter email
  const { data: company } = await service
    .from("companies")
    .select("id, name, verified_at")
    .eq("id", id)
    .single();

  if (!company) return err("Company not found", 404);

  // Find owner recruiter's auth user id to get email
  const { data: owner } = await service
    .from("recruiters")
    .select("user_id")
    .eq("company_id", id)
    .eq("is_company_owner", true)
    .single();

  if (action === "verify") {
    if (company.verified_at) return ok({ message: "Already verified" });

    const { error } = await service
      .from("companies")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return err("Failed to verify company", 500);

    // Send email (non-blocking — failure doesn't roll back)
    if (owner?.user_id) {
      const { data: authUser } = await service.auth.admin.getUserById(owner.user_id);
      if (authUser.user?.email) {
        await sendEmployerVerified(authUser.user.email, company.name);
      }
    }

    return ok({ message: "Company verified" });
  }

  // action === "reject"
  const { error } = await service
    .from("companies")
    .update({ verified_at: null })
    .eq("id", id);
  if (error) return err("Failed to update company", 500);

  if (owner?.user_id) {
    const { data: authUser } = await service.auth.admin.getUserById(owner.user_id);
    if (authUser.user?.email) {
      await sendEmployerRejected(authUser.user.email, company.name, reason!);
    }
  }

  return ok({ message: "Company rejected" });
}
