import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PH_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.posthog.com";

function buildCSP(): string {
  const ph = new URL(PH_HOST).hostname;
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' https://${ph}`,  // TODO: replace unsafe-inline with nonce
    `connect-src 'self' https://${ph} https://*.supabase.co`,
    "img-src 'self' data: blob:",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

// Routes that require a specific role
const EMPLOYER_PREFIXES = ["/tableau-de-bord", "/offres", "/talents", "/facturation"];
const CANDIDATE_PREFIXES = ["/profil", "/candidatures"];
const ADMIN_PREFIXES = ["/admin"];

// Routes that logged-in users should be bounced away from
const AUTH_PREFIXES = ["/connexion", "/inscription"];

type Role = "employer" | "candidate" | "admin";

function roleHome(role: Role): string {
  if (role === "employer") return "/tableau-de-bord";
  if (role === "admin") return "/admin/entreprises";
  return "/profil";
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Always pass through public API routes and auth callback
  if (pathname.startsWith("/api") || pathname.startsWith("/auth")) {
    return supabaseResponse;
  }

  const isEmployerRoute = EMPLOYER_PREFIXES.some((p) => pathname.startsWith(p));
  const isCandidateRoute = CANDIDATE_PREFIXES.some((p) => pathname.startsWith(p));
  const isAdminRoute = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_PREFIXES.some((p) => pathname.startsWith(p));
  const isProtected = isEmployerRoute || isCandidateRoute || isAdminRoute;

  // Unauthenticated → redirect to login for protected routes
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    return NextResponse.redirect(url);
  }

  // No role enforcement needed for public/auth routes without a user
  if (!user) return supabaseResponse;

  // Get role from profiles table (one PK lookup, fast)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role as Role | undefined;

  // Logged-in user visiting auth pages → send to their home
  if (isAuthRoute && role) {
    const url = request.nextUrl.clone();
    url.pathname = roleHome(role);
    return NextResponse.redirect(url);
  }

  if (!isProtected || !role) return supabaseResponse;

  // Enforce role-based access
  if (isAdminRoute && role !== "admin") {
    return new NextResponse(null, { status: 403 });
  }

  if (isEmployerRoute && role !== "employer" && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = roleHome(role);
    return NextResponse.redirect(url);
  }

  if (isCandidateRoute && role !== "candidate" && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = roleHome(role);
    return NextResponse.redirect(url);
  }

  supabaseResponse.headers.set("Content-Security-Policy", buildCSP());
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
