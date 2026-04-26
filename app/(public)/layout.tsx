import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-30 px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="font-bold text-lg tracking-tight">AutoJobs.ma</Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/jobs"      className="text-muted-foreground hover:text-foreground">Offres</Link>
            <Link href="/connexion" className="text-muted-foreground hover:text-foreground">Connexion</Link>
            <Link href="/inscription/employeur" className={cn(buttonVariants({ size: "sm" }))}>
              Publier une offre
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
