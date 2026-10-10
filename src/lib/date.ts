/** Date du jour au format YYYY-MM-DD (comparaison directe avec les colonnes `date`). */
export function aujourdhui(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR");
}

export function formatHeure(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/** Jours d'échéance restants (négatif = déjà expiré). */
export function joursAvant(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - new Date(aujourdhui()).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

/** Les 7 jours (lundi → dimanche) de la semaine contenant `reference`. */
export function joursDeLaSemaine(reference: Date = new Date()): string[] {
  const lundi = new Date(reference);
  const jourSemaine = (lundi.getDay() + 6) % 7; // 0 = lundi
  lundi.setDate(lundi.getDate() - jourSemaine);

  return Array.from({ length: 7 }, (_, i) => {
    const jour = new Date(lundi);
    jour.setDate(lundi.getDate() + i);
    return jour.toISOString().slice(0, 10);
  });
}

export function formatJourCourt(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
}
