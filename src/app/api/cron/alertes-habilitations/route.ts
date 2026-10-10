import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service-client";
import { envoyerEmail } from "@/lib/email";
import { joursAvant, formatDate } from "@/lib/date";
import type { Employe, Habilitation } from "@/lib/types/database";

/**
 * Appelée chaque jour par Vercel Cron (voir vercel.json). Envoie un seul
 * email récapitulatif des habilitations expirées ou expirant dans 30 jours.
 * Vercel ajoute automatiquement `Authorization: Bearer $CRON_SECRET` sur les
 * appels qu'il déclenche lui-même quand CRON_SECRET est configurée.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  }

  const destinataire = process.env.ALERTES_EMAIL_DESTINATAIRE;
  if (!destinataire) {
    return NextResponse.json({ envoye: false, raison: "ALERTES_EMAIL_DESTINATAIRE non configurée" });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ envoye: false, raison: "SUPABASE_SERVICE_ROLE_KEY non configurée" });
  }

  const { data: habilitations } = await supabase
    .from("habilitations")
    .select("*, employe:employes(*)")
    .not("date_expiration", "is", null)
    .returns<(Habilitation & { employe: Employe })[]>();

  const aSignaler = (habilitations ?? []).filter((h) => {
    const j = joursAvant(h.date_expiration);
    return j !== null && j <= 30;
  });

  if (aSignaler.length === 0) {
    return NextResponse.json({ envoye: false, raison: "aucune échéance à signaler" });
  }

  const lignes = aSignaler
    .map(
      (h) =>
        `<li>${h.employe.prenom} ${h.employe.nom} — ${h.libelle || h.type} — ${formatDate(h.date_expiration)}</li>`,
    )
    .join("");

  const resultat = await envoyerEmail(
    destinataire,
    `Marette — ${aSignaler.length} habilitation(s) à surveiller`,
    `<p>Échéances à traiter :</p><ul>${lignes}</ul>`,
  );

  return NextResponse.json({ envoye: resultat.envoye, nombre: aSignaler.length });
}
