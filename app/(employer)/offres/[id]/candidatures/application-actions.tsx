"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Status = "viewed" | "shortlisted" | "rejected";

interface Props {
  applicationId: string;
  currentStatus: string;
}

export function ApplicationActions({ applicationId, currentStatus }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(currentStatus);

  async function updateStatus(next: Status) {
    const res = await fetch(`/api/v1/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const json = await res.json();
    if (res.ok) {
      setStatus(next);
      startTransition(() => router.refresh());
      toast.success("Statut mis à jour");
    } else {
      toast.error(json.error?.message ?? "Erreur lors de la mise à jour");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "viewed" && status !== "shortlisted" && status !== "rejected" && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => updateStatus("viewed")}>
          Marquer vue
        </Button>
      )}
      {status !== "shortlisted" && (
        <Button size="sm" variant="default" disabled={pending} onClick={() => updateStatus("shortlisted")}>
          Sélectionner
        </Button>
      )}
      {status !== "rejected" && (
        <Button size="sm" variant="destructive" disabled={pending} onClick={() => updateStatus("rejected")}>
          Refuser
        </Button>
      )}
    </div>
  );
}
