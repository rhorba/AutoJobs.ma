"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function CompanyActions({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"verify" | "reject" | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState("");

  async function verify() {
    setLoading("verify");
    await fetch(`/api/v1/admin/companies/${companyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify" }),
    });
    setLoading(null);
    router.refresh();
  }

  async function reject() {
    if (!reason.trim()) return;
    setLoading("reject");
    await fetch(`/api/v1/admin/companies/${companyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", reason: reason.trim() }),
    });
    setLoading(null);
    setShowRejectForm(false);
    router.refresh();
  }

  if (showRejectForm) {
    return (
      <div className="flex flex-col gap-2">
        <textarea
          className="w-56 rounded border p-2 text-xs"
          placeholder="Raison du refus…"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex gap-2">
          <Button size="sm" variant="destructive" disabled={!reason.trim() || loading === "reject"} onClick={reject}>
            {loading === "reject" ? "..." : "Confirmer"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowRejectForm(false)}>
            Annuler
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={loading === "verify"} onClick={verify}>
        {loading === "verify" ? "..." : "Vérifier"}
      </Button>
      <Button size="sm" variant="outline" onClick={() => setShowRejectForm(true)}>
        Rejeter
      </Button>
    </div>
  );
}
