import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe, PRICE_EUR_CENTS } from "@/lib/stripe";
import { ok, err } from "@/lib/api-response";
import { z } from "zod";

const schema = z.object({ job_id: z.string().uuid() });

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err("Unauthorized", 401);

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "employer") return err("Forbidden", 403);

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err("Invalid input", 422);

  const service = await createServiceClient();

  const { data: recruiter } = await service
    .from("recruiters").select("company_id").eq("user_id", user.id).single();
  if (!recruiter) return err("Recruiter not found", 404);

  const { data: job } = await service
    .from("job_postings")
    .select("id, title, status, company_id")
    .eq("id", parsed.data.job_id)
    .eq("company_id", recruiter.company_id)
    .single();
  if (!job) return err("Job not found", 404);
  if (!["draft", "pending_payment"].includes(job.status)) {
    return err("Job is not awaiting payment", 409);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const priceId = process.env.STRIPE_PRICE_ID_PAY_PER_POST;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: priceId
      ? [{ price: priceId, quantity: 1 }]
      : [{
          price_data: {
            currency: "eur",
            product_data: { name: "Publication d'offre — 30 jours" },
            unit_amount: PRICE_EUR_CENTS,
          },
          quantity: 1,
        }],
    metadata: { job_posting_id: job.id, company_id: recruiter.company_id },
    success_url: `${appUrl}/offres/succes?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/offres/${job.id}/paiement?cancelled=1`,
  });

  await service
    .from("job_postings")
    .update({ status: "pending_payment" })
    .eq("id", job.id);

  return ok({ url: session.url });
}
