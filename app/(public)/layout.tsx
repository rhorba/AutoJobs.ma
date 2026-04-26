import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="font-semibold">AutoJobs.ma</Link>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/jobs"       className="hover:text-foreground">Offres</Link>
            <Link href="/connexion"  className="hover:text-foreground">Connexion</Link>
            <Link href="/inscription/candidat" className="hover:text-foreground">Créer un compte</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
