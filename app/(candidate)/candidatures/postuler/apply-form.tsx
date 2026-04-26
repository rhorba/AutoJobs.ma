"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface Props {
  jobId: string;
  candidateName: string;
  hasCv: boolean;
}

export function ApplyForm({ jobId, candidateName, hasCv }: Props) {
  const router = useRouter();
  const [coverNote, setCoverNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId, cover_note: coverNote || undefined }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success("Candidature envoyée !");
        router.push("/candidatures");
      } else {
        toast.error(json.error?.message ?? "Erreur lors de l'envoi");
      }
    } catch {
      toast.error("Erreur réseau — veuillez réessayer");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-muted-foreground">Votre candidature</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Candidat :</span>
            <span className="font-medium">{candidateName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">CV :</span>
            <span className={hasCv ? "font-medium text-green-600" : "text-amber-600"}>
              {hasCv ? "Joint automatiquement" : "Aucun CV — ajoutez-en un dans votre profil"}
            </span>
          </div>
          <div>
            <Label htmlFor="cover_note">
              Message de motivation <span className="text-muted-foreground">(optionnel)</span>
            </Label>
            <Textarea
              id="cover_note"
              rows={5}
              maxLength={1000}
              placeholder="Présentez-vous brièvement et expliquez pourquoi vous correspondez à ce poste..."
              value={coverNote}
              onChange={(e) => setCoverNote(e.target.value)}
              className="mt-1"
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">{coverNote.length}/1000</p>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Envoi en cours..." : "Envoyer ma candidature"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Votre profil et votre CV seront transmis à l'employeur.
      </p>
    </form>
  );
}
