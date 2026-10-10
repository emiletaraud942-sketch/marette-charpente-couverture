import { Resend } from "resend";

/**
 * Envoie un email via Resend si RESEND_API_KEY est configurée, sinon ne fait
 * rien (log) — évite de faire planter l'appelant quand l'infra email n'est
 * pas encore branchée.
 */
export async function envoyerEmail(destinataire: string, sujet: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY non configurée — email non envoyé:", sujet);
    return { envoye: false as const };
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: process.env.ALERTES_EMAIL_EXPEDITEUR ?? "alertes@marette.fr",
    to: destinataire,
    subject: sujet,
    html,
  });
  return { envoye: true as const };
}
