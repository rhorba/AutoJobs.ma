"use client";

import { useConsent } from "./posthog-provider";
import { Button } from "@/components/ui/button";

export function CookieConsent() {
  const { consent, accept, decline } = useConsent();

  // null = not yet decided; show banner
  if (consent !== null) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-4 shadow-lg">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          AutoJobs.ma utilise des cookies d&apos;analyse (PostHog) pour améliorer
          votre expérience. Aucune donnée n&apos;est partagée sans votre accord.{" "}
          <a href="/politique-de-confidentialite" className="underline underline-offset-4">
            Politique de confidentialité
          </a>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={decline}>
            Refuser
          </Button>
          <Button size="sm" onClick={accept}>
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
