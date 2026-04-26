import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

export const PRICE_EUR_CENTS = 4500; // €45 ≈ 490 MAD
export const PRICE_MAD = 490;
