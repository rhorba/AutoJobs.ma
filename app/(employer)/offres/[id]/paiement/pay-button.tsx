"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function PayButton({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId }),
      });
      const json = await res.json();
      if (res.ok && json.data?.url) {
        window.location.href = json.data.url;
      } else {
        toast.error(json.error?.message ?? "Erreur lors de la création du paiement");
        setLoading(false);
      }
    } catch {
      toast.error("Erreur réseau — veuillez réessayer");
      setLoading(false);
    }
  }

  return (
    <Button size="lg" className="w-full" onClick={handlePay} disabled={loading}>
      {loading ? "Redirection vers Stripe..." : "Payer par carte — 490 MAD"}
    </Button>
  );
}
