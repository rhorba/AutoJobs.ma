"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MOROCCAN_CITIES = [
  "Tanger", "Kénitra", "Casablanca", "Jorf Lasfar", "Rabat",
  "Fès", "Marrakech", "Agadir", "Autre",
] as const;

const schema = z.object({
  first_name:   z.string().min(1, "Prénom requis"),
  last_name:    z.string().min(1, "Nom requis"),
  company_name: z.string().min(2, "Nom de l'entreprise requis"),
  city:         z.string().min(1, "Ville requise"),
  email:        z.string().email("Email invalide"),
  password:     z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

type FormValues = z.infer<typeof schema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

export default function EmployeurInscriptionPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const supabase = createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback?type=employer`,
        data: {
          role_type:    "employer",
          first_name:   values.first_name,
          last_name:    values.last_name,
          company_name: values.company_name,
          city:         values.city,
        },
      },
    });

    if (error) {
      setServerError(
        error.message.toLowerCase().includes("already registered")
          ? "Un compte existe déjà avec cet email."
          : error.message
      );
      return;
    }

    setSubmittedEmail(values.email);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Vérifiez votre email</CardTitle>
            <CardDescription>
              Un lien de vérification a été envoyé à{" "}
              <strong>{submittedEmail}</strong>. Cliquez sur ce lien pour
              continuer l&apos;inscription.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Vous n&apos;avez pas reçu l&apos;email ? Vérifiez votre dossier spam.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Créer un compte recruteur</CardTitle>
          <CardDescription>
            Publiez vos offres d&apos;emploi auprès des talents du secteur
            automobile et batteries au Maroc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Prénom</Label>
                <Input id="first_name" placeholder="Youssef" {...register("first_name")} />
                <FieldError message={errors.first_name?.message} />
              </div>
              <div>
                <Label htmlFor="last_name">Nom</Label>
                <Input id="last_name" placeholder="El Alami" {...register("last_name")} />
                <FieldError message={errors.last_name?.message} />
              </div>
            </div>

            <div>
              <Label htmlFor="company_name">Nom de l&apos;entreprise</Label>
              <Input id="company_name" placeholder="Gotion High-Tech Maroc" {...register("company_name")} />
              <FieldError message={errors.company_name?.message} />
            </div>

            <div>
              <Label htmlFor="city">Ville</Label>
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <SelectTrigger id="city">
                      <SelectValue placeholder="Sélectionnez une ville" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOROCCAN_CITIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.city?.message} />
            </div>

            <div>
              <Label htmlFor="email">Email professionnel</Label>
              <Input id="email" type="email" placeholder="rh@entreprise.ma" {...register("email")} />
              <FieldError message={errors.email?.message} />
            </div>

            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" placeholder="8 caractères minimum" {...register("password")} />
              <FieldError message={errors.password?.message} />
            </div>

            {serverError && (
              <p className="text-sm text-destructive">{serverError}</p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Création..." : "Créer mon compte"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Déjà un compte ?{" "}
              <Link href="/connexion" className="underline underline-offset-4">
                Se connecter
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
