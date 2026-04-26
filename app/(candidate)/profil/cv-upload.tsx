"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CvUpload({ hasCv }: { hasCv: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Le fichier dépasse 10 Mo");
      return;
    }
    if (file.type !== "application/pdf") {
      toast.error("Seuls les fichiers PDF sont acceptés");
      return;
    }

    setUploading(true);
    const body = new FormData();
    body.append("cv", file);

    const res = await fetch("/api/v1/candidates/me/cv", { method: "POST", body });
    setUploading(false);

    if (res.ok) {
      toast.success("CV téléversé avec succès");
      router.refresh();
    } else {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error ?? "Erreur lors du téléversement");
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>CV (PDF)</CardTitle></CardHeader>
      <CardContent className="flex items-center gap-4">
        <div className="flex-1">
          {hasCv ? (
            <p className="text-sm text-muted-foreground">Un CV est déjà enregistré.</p>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun CV — ajoutez-en un pour compléter votre profil (+15 %).</p>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        <Button
          size="sm"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Envoi..." : hasCv ? "Remplacer" : "Ajouter"}
        </Button>
      </CardContent>
    </Card>
  );
}
