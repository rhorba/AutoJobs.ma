import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PayButton } from "./pay-button";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cancelled?: string }>;
}

export default async function PaiementPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { cancelled } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const service = await createServiceClient();
  const { data: recruiter } = await service
    .from("recruiters").select("company_id").eq("user_id", user.id).single();
  if (!recruiter) redirect("/offres");

  const { data: job } = await service
    .from("job_postings")
    .select("id, title, city, contract_type, status")
    .eq("id", id)
    .eq("company_id", recruiter.company_id)
    .single();
  if (!job) redirect("/offres");

  if (job.status === "active") redirect(`/jobs/${job.id}`);
  if (!["draft", "pending_payment"].includes(job.status)) redirect("/offres");

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Paiement de l'offre</h1>

      {cancelled === "1" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Paiement annulé — votre offre est sauvegardée. Vous pouvez réessayer quand vous voulez.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-muted-foreground">Votre offre</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="font-semibold">{job.title}</p>
          <p className="text-sm text-muted-foreground">{job.city} · {job.contract_type}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-muted-foreground">Résumé de la commande</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Publication d'offre — 30 jours</span>
            <span className="font-semibold">490 MAD</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Équivalent EUR</span>
            <span>≈ €45</span>
          </div>
          <hr />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>490 MAD</span>
          </div>
        </CardContent>
      </Card>

      <PayButton jobId={job.id} />

      <p className="text-center text-xs text-muted-foreground">
        Paiement sécurisé par Stripe · L'offre sera publiée immédiatement après confirmation.
      </p>
    </div>
  );
}
