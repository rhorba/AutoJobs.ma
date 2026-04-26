import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ok, err } from "@/lib/api-response";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { newApplicationEmail } from "@/emails/new-application";
import { applicationConfirmedEmail } from "@/emails/application-confirmed";
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
    .select("id, first_name, last_name, city, profile_completeness")
    .eq("user_id", user.id)
    .single();
  if (!candidate) return err("Candidate profile not found", 404);
  if (candidate.profile_completeness < 80) {
    return err("Complétez votre profil à 80% avant de postuler", 403);
  }

  const { data: job } = await service
    .from("job_postings")
    .select("id, title, city, expires_at, company_id, recruiter_id")
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

  // Send notifications — errors are non-fatal
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const [recruiterRes, companyRes, candidateUserRes, recruiterUserRes] = await Promise.all([
      service.from("recruiters").select("first_name, user_id").eq("id", job.recruiter_id).single(),
      service.from("companies").select("name").eq("id", job.company_id).single(),
      service.auth.admin.getUserById(user.id),
      service.from("recruiters").select("user_id").eq("id", job.recruiter_id).single(),
    ]);

    const recruiter = recruiterRes.data;
    const company = companyRes.data;
    const candidateEmail = candidateUserRes.data?.user?.email;
    const recruiterUserId = recruiterUserRes.data?.user_id;
    const recruiterEmailRes = recruiterUserId
      ? await service.auth.admin.getUserById(recruiterUserId)
      : null;
    const recruiterEmail = recruiterEmailRes?.data?.user?.email;

    await Promise.all([
      recruiterEmail && recruiter
        ? resend.emails.send({
            from: FROM_EMAIL,
            to: recruiterEmail,
            ...newApplicationEmail({
              recruiterName: recruiter.first_name,
              jobTitle: job.title,
              candidateName: `${candidate.first_name} ${candidate.last_name}`,
              candidateCity: candidate.city,
              candidatureUrl: `${appUrl}/offres/${job.id}/candidatures`,
            }),
          })
        : Promise.resolve(),
      candidateEmail
        ? resend.emails.send({
            from: FROM_EMAIL,
            to: candidateEmail,
            ...applicationConfirmedEmail({
              candidateName: candidate.first_name,
              jobTitle: job.title,
              companyName: company?.name ?? "",
              jobCity: job.city,
              candidaturesUrl: `${appUrl}/candidatures`,
            }),
          })
        : Promise.resolve(),
    ]);
  } catch {
    // Email failure does not fail the application submission
  }

  return ok({ application }, 201);
}
