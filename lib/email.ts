import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@autojobs.ma";

type SendResult = { ok: true } | { ok: false; error: string };

async function send(args: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendResult> {
  try {
    await resend.emails.send({ from: FROM, ...args });
    return { ok: true };
  } catch (e) {
    // Email failures must never roll back primary actions
    console.error("[email] send failed:", e);
    return { ok: false, error: String(e) };
  }
}

export async function sendEmployerWelcome(to: string, companyName: string) {
  return send({
    to,
    subject: "Bienvenue sur AutoJobs.ma — vérification en cours",
    html: `
      <p>Bonjour,</p>
      <p>Merci d'avoir créé un compte recruteur pour <strong>${companyName}</strong> sur AutoJobs.ma.</p>
      <p>Notre équipe va vérifier les informations de votre entreprise dans les <strong>24 à 48 heures</strong>.
      Vous recevrez un email dès que votre compte sera validé.</p>
      <p>À bientôt,<br/>L'équipe AutoJobs.ma</p>
    `,
  });
}

export async function sendEmployerVerified(to: string, companyName: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://autojobs.ma";
  return send({
    to,
    subject: "Compte vérifié — Vous pouvez publier vos offres",
    html: `
      <p>Bonjour,</p>
      <p>Bonne nouvelle ! Le compte de <strong>${companyName}</strong> sur AutoJobs.ma a été vérifié.</p>
      <p>Vous pouvez maintenant publier vos premières offres d'emploi.</p>
      <p><a href="${appUrl}/tableau-de-bord">Accéder à mon espace recruteur →</a></p>
      <p>À bientôt,<br/>L'équipe AutoJobs.ma</p>
    `,
  });
}

export async function sendEmployerRejected(to: string, companyName: string, reason: string) {
  return send({
    to,
    subject: "Compte AutoJobs.ma — vérification refusée",
    html: `
      <p>Bonjour,</p>
      <p>Nous n'avons pas pu valider le compte de <strong>${companyName}</strong> pour la raison suivante :</p>
      <blockquote>${reason}</blockquote>
      <p>Pour toute question, contactez-nous à <a href="mailto:contact@autojobs.ma">contact@autojobs.ma</a>.</p>
      <p>L'équipe AutoJobs.ma</p>
    `,
  });
}

export async function sendCandidateWelcome(to: string, firstName: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://autojobs.ma";
  return send({
    to,
    subject: "Bienvenue sur AutoJobs.ma",
    html: `
      <p>Bonjour ${firstName},</p>
      <p>Votre compte candidat AutoJobs.ma est prêt !</p>
      <p>Complétez votre profil à <strong>80%</strong> pour débloquer le bouton "Postuler" sur toutes les offres.</p>
      <p><a href="${appUrl}/profil">Compléter mon profil →</a></p>
      <p>L'équipe AutoJobs.ma</p>
    `,
  });
}
