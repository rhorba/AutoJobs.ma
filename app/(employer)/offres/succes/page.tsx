import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export default function SuccesPage() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center space-y-6">
      <CheckCircle className="mx-auto h-16 w-16 text-green-500" />

      <div>
        <h1 className="text-2xl font-bold">Paiement réussi !</h1>
        <p className="mt-2 text-muted-foreground">
          Votre offre est maintenant publiée et visible par les candidats pendant 30 jours.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/offres" className={cn(buttonVariants())}>
          Voir mes offres
        </Link>
        <Link href="/offres/nouvelle" className={cn(buttonVariants({ variant: "outline" }))}>
          Publier une autre offre
        </Link>
      </div>
    </div>
  );
}
