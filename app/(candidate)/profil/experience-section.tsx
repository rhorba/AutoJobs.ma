"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/types/database";

type Experience = Database["public"]["Tables"]["candidate_experiences"]["Row"];

const schema = z.object({
  company_name: z.string().min(1, "Entreprise requise"),
  title:        z.string().min(1, "Poste requis"),
  start_date:   z.string().min(1, "Date de début requise"),
  end_date:     z.string().optional(),
  description:  z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof schema>;

function ExperienceCard({ exp, onDelete }: { exp: Experience; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/v1/candidates/me/experiences/${exp.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) { toast.success("Expérience supprimée"); onDelete(); }
    else toast.error("Erreur lors de la suppression");
  }

  return (
    <div className="flex items-start justify-between rounded-md border p-4">
      <div>
        <p className="font-medium">{exp.title}</p>
        <p className="text-sm text-muted-foreground">{exp.company_name}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {exp.start_date.slice(0, 7)} — {exp.end_date ? exp.end_date.slice(0, 7) : "Poste actuel"}
        </p>
        {exp.description && <p className="mt-2 text-sm">{exp.description}</p>}
      </div>
      <Button size="sm" variant="ghost" disabled={deleting} onClick={handleDelete}
        className="text-destructive hover:text-destructive">
        {deleting ? "..." : "Supprimer"}
      </Button>
    </div>
  );
}

export function ExperienceSection({ experiences: initial }: {
  experiences: Experience[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [experiences, setExperiences] = useState(initial);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    const res = await fetch("/api/v1/candidates/me/experiences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        end_date: values.end_date || null,
        description: values.description || null,
      }),
    });
    if (res.ok) {
      const { data } = await res.json();
      setExperiences((prev) => [data.experience, ...prev]);
      toast.success("Expérience ajoutée");
      reset();
      setShowForm(false);
      router.refresh();
    } else {
      toast.error("Erreur lors de l'ajout");
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Expériences professionnelles</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Annuler" : "+ Ajouter"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-md border p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="company_name">Entreprise</Label>
                <Input id="company_name" placeholder="Stellantis" {...register("company_name")} />
                {errors.company_name && <p className="mt-1 text-xs text-destructive">{errors.company_name.message}</p>}
              </div>
              <div>
                <Label htmlFor="title">Poste</Label>
                <Input id="title" placeholder="Technicien câblage" {...register("title")} />
                {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
              </div>
              <div>
                <Label htmlFor="start_date">Date de début</Label>
                <Input id="start_date" type="month" {...register("start_date")} />
                {errors.start_date && <p className="mt-1 text-xs text-destructive">{errors.start_date.message}</p>}
              </div>
              <div>
                <Label htmlFor="end_date">Date de fin <span className="text-muted-foreground">(vide = en cours)</span></Label>
                <Input id="end_date" type="month" {...register("end_date")} />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description <span className="text-muted-foreground">(optionnel)</span></Label>
              <Textarea id="description" rows={3} {...register("description")} />
            </div>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Ajout..." : "Ajouter l'expérience"}
            </Button>
          </form>
        )}

        {experiences.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground">Aucune expérience ajoutée.</p>
        )}

        {experiences.map((exp) => (
          <ExperienceCard
            key={exp.id}
            exp={exp}
            onDelete={() => {
              setExperiences((prev) => prev.filter((e) => e.id !== exp.id));
              router.refresh();
            }}
          />
        ))}
      </CardContent>
    </Card>
  );
}
