import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Briefcase, Building2, CheckCircle, MapPin, Zap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AutoJobs.ma — L'emploi automobile & EV au Maroc",
  description:
    "Trouvez votre prochain poste dans l'industrie automobile, batteries et véhicules électriques au Maroc. Gotion, Stellantis, Renault, Yazaki, Aptiv et plus.",
  openGraph: {
    title: "AutoJobs.ma — L'emploi automobile & EV au Maroc",
    description:
      "Le job board vertical du secteur automobile, batteries et EV au Maroc. Kenitra, Tanger, Jorf Lasfar.",
    url: "https://autojobs.ma",
    siteName: "AutoJobs.ma",
    locale: "fr_MA",
    type: "website",
  },
};

export default async function HomePage() {
  const service = await createServiceClient();

  const [countRes, jobsRes] = await Promise.all([
    service
      .from("job_postings")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString()),
    service
      .from("job_postings")
      .select("id, title, city, contract_type, company_id")
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const jobCount = countRes.count ?? 0;
  const recentJobs = jobsRes.data ?? [];

  const companyIds = [...new Set(recentJobs.map((j) => j.company_id))];
  const { data: companies } = companyIds.length
    ? await service.from("companies").select("id, name").in("id", companyIds)
    : { data: [] };
  const companyMap = new Map((companies ?? []).map((c) => [c.id, c.name]));

  return (
    <div className="min-h-screen bg-background">

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-30 px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="font-bold text-lg tracking-tight">AutoJobs.ma</Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/jobs" className="text-muted-foreground hover:text-foreground">Offres</Link>
            <Link href="/connexion" className="text-muted-foreground hover:text-foreground">Connexion</Link>
            <Link href="/inscription/employeur" className={cn(buttonVariants({ size: "sm" }))}>
              Publier une offre
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="border-b bg-zinc-50 dark:bg-zinc-950 px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <span className="inline-block rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            Automobile · Batteries · Véhicules électriques · Maroc
          </span>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Votre carrière dans<br />l'industrie automobile au Maroc
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            {jobCount > 0
              ? `${jobCount} offre${jobCount > 1 ? "s" : ""} d'emploi disponible${jobCount > 1 ? "s" : ""} — `
              : ""}
            Gotion, Stellantis, Renault, Yazaki, Aptiv et plus recrutent sur AutoJobs.ma.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/jobs" className={cn(buttonVariants({ size: "lg" }), "min-w-44")}>
              Voir les offres
            </Link>
            <Link href="/inscription/candidat" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "min-w-44")}>
              Créer mon profil
            </Link>
          </div>
        </div>
      </section>

      {/* ── Companies strip ─────────────────────────────────────────── */}
      <section className="border-b px-6 py-5">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Ils recrutent dans le secteur
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-semibold text-muted-foreground">
            {["Gotion High-Tech", "Stellantis", "Renault Group", "Yazaki", "Aptiv", "Sumitomo"].map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Value props ─────────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl grid gap-8 sm:grid-cols-2">

          {/* Candidates */}
          <div className="rounded-xl border p-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Pour les candidats</h2>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                "Offres exclusives dans l'automobile, l'EV et les batteries",
                "Créez votre profil en 10 minutes — CV inclus",
                "Postulez en un clic à toutes les offres",
                "Recevez les nouvelles offres par email",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/inscription/candidat" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
              Créer mon compte gratuit
            </Link>
          </div>

          {/* Employers */}
          <div className="rounded-xl border p-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Pour les employeurs</h2>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                "Publiez votre offre en moins de 5 minutes",
                "Candidats qualifiés du secteur automobile",
                "Gestion des candidatures intégrée",
                "Visible pendant 30 jours",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/inscription/employeur" className={cn(buttonVariants(), "w-full")}>
              Publier une offre
            </Link>
          </div>
        </div>
      </section>

      {/* ── Recent jobs preview ─────────────────────────────────────── */}
      {recentJobs.length > 0 && (
        <section className="border-t bg-zinc-50 dark:bg-zinc-950 px-6 py-16">
          <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Dernières offres publiées</h2>
              <Link href="/jobs" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                Voir tout →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="rounded-lg border bg-background p-5 hover:border-foreground/30 transition-colors space-y-2"
                >
                  <p className="font-semibold leading-snug">{job.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {companyMap.get(job.company_id) ?? "—"}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{job.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />{job.contract_type}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Pricing ─────────────────────────────────────────────────── */}
      <section className="border-t px-6 py-16">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Tarifs simples et transparents</h2>
            <p className="mt-2 text-muted-foreground">Pas d'abonnement. Payez uniquement pour ce que vous publiez.</p>
          </div>
          <div className="mx-auto max-w-sm rounded-xl border-2 border-foreground p-8 text-center space-y-4">
            <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Par offre</p>
            <div>
              <span className="text-5xl font-bold">490</span>
              <span className="ml-1 text-xl font-medium text-muted-foreground">MAD</span>
            </div>
            <p className="text-sm text-muted-foreground">≈ €45 · Publication pendant 30 jours</p>
            <ul className="space-y-2 text-sm text-left">
              {[
                "Visible sur AutoJobs.ma",
                "Candidatures illimitées",
                "Tableau de bord inclus",
                "Gestion des candidatures",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/inscription/employeur" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
              Commencer maintenant
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t px-6 py-10">
        <div className="mx-auto max-w-5xl flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="font-bold">AutoJobs.ma</p>
            <p className="text-sm text-muted-foreground">
              Le job board vertical de l'industrie automobile au Maroc.
            </p>
          </div>
          <nav className="flex gap-5 text-sm text-muted-foreground">
            <Link href="/jobs"                  className="hover:text-foreground">Offres</Link>
            <Link href="/inscription/candidat"  className="hover:text-foreground">Candidats</Link>
            <Link href="/inscription/employeur" className="hover:text-foreground">Employeurs</Link>
            <Link href="/connexion"             className="hover:text-foreground">Connexion</Link>
          </nav>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} AutoJobs.ma — Tous droits réservés
        </p>
      </footer>

    </div>
  );
}
