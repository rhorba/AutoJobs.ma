import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type") as "employer" | "candidate" | null;

  if (!code) {
    return NextResponse.redirect(`${APP_URL}/connexion?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${APP_URL}/connexion?error=auth_callback`);
  }

  // Create profile rows if they don't exist yet (idempotent)
  const profileType = type ?? searchParams.get("next")?.includes("employeur") ? "employer" : "candidate";
  const completeRes = await fetch(
    `${APP_URL}/api/v1/auth/complete-profile?type=${profileType}`,
    { method: "POST", headers: { cookie: request.headers.get("cookie") ?? "" } }
  );

  if (!completeRes.ok) {
    const body = await completeRes.json().catch(() => ({}));
    const msg = body?.error?.message ?? "profile_error";
    return NextResponse.redirect(`${APP_URL}/connexion?error=${encodeURIComponent(msg)}`);
  }

  // Route by role
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role_type as string | undefined;

  if (role === "employer") {
    return NextResponse.redirect(`${APP_URL}/verification-en-attente`);
  }
  return NextResponse.redirect(`${APP_URL}/profil`);
}
