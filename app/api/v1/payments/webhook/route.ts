import { createServiceClient } from "@/lib/supabase/server";
import { stripe, PRICE_EUR_CENTS, PRICE_MAD } from "@/lib/stripe";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing stripe-signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return new NextResponse("Webhook signature verification failed", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const jobPostingId = session.metadata?.job_posting_id;
    const companyId = session.metadata?.company_id;
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? null;

    if (!jobPostingId || !companyId) {
      return new NextResponse("Missing metadata", { status: 400 });
    }

    const service = await createServiceClient();

    // Idempotency: skip if already processed
    if (paymentIntentId) {
      const { data: existing } = await service
        .from("payments")
        .select("id")
        .eq("stripe_payment_intent_id", paymentIntentId)
        .eq("status", "succeeded")
        .maybeSingle();
      if (existing) return new NextResponse("OK", { status: 200 });
    }

    await service.from("payments").insert({
      company_id: companyId,
      job_posting_id: jobPostingId,
      stripe_payment_intent_id: paymentIntentId,
      amount_eur_cents: PRICE_EUR_CENTS,
      amount_mad: PRICE_MAD,
      status: "succeeded",
      payment_method: "stripe_card",
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await service
      .from("job_postings")
      .update({ status: "active", expires_at: expiresAt.toISOString() })
      .eq("id", jobPostingId);
  }

  return new NextResponse("OK", { status: 200 });
}
