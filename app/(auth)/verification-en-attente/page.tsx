import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function VerificationEnAttentePage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl">
            ⏳
          </div>
          <CardTitle>Compte en cours de vérification</CardTitle>
          <CardDescription>
            Votre compte est en cours de vérification par notre équipe (24–48h).
            Vous recevrez un email dès que votre entreprise sera validée.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Nous vérifions les informations de votre entreprise pour garantir la
            qualité des offres publiées sur AutoJobs.ma.
          </p>
          <p className="text-sm text-muted-foreground">
            Une question ? Contactez-nous à{" "}
            <a
              href="mailto:contact@autojobs.ma"
              className="underline underline-offset-4"
            >
              contact@autojobs.ma
            </a>
          </p>
          <Link
            href="/connexion"
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            Retour à la connexion
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
