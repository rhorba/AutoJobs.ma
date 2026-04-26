export function applicationConfirmedEmail({
  candidateName,
  jobTitle,
  companyName,
  jobCity,
  candidaturesUrl,
}: {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  jobCity: string;
  candidaturesUrl: string;
}) {
  return {
    subject: `Candidature reçue — ${jobTitle} chez ${companyName}`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:sans-serif;color:#111;background:#f9fafb;margin:0;padding:32px 16px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;border:1px solid #e5e7eb">
    <p style="font-weight:700;font-size:18px;margin:0 0 16px">AutoJobs.ma</p>

    <p style="margin:0 0 8px">Bonjour ${candidateName},</p>
    <p style="margin:0 0 6px;color:#374151">
      Votre candidature pour le poste de <strong>${jobTitle}</strong> chez
      <strong>${companyName}</strong> (${jobCity}) a bien été reçue.
    </p>
    <p style="margin:0 0 20px;color:#6b7280;font-size:14px">
      L'employeur examinera votre profil et vous contactera si votre candidature est retenue.
    </p>

    <a href="${candidaturesUrl}"
       style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;font-weight:600">
      Suivre mes candidatures →
    </a>

    <p style="margin:28px 0 0;font-size:12px;color:#9ca3af">
      AutoJobs.ma — La plateforme emploi de l'industrie automobile au Maroc
    </p>
  </div>
</body>
</html>`,
  };
}
