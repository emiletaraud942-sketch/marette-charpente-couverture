import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentEmploye } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, joursAvant } from "@/lib/date";
import type { Employe, Habilitation } from "@/lib/types/database";

const TYPE_LABEL: Record<Habilitation["type"], string> = {
  caces: "CACES",
  habilitation_electrique: "Habilitation électrique",
  travail_hauteur: "Travail en hauteur",
  visite_medicale: "Visite médicale",
  autre: "Autre",
};

export default async function AlertesPage() {
  const moi = await getCurrentEmploye();
  if (moi?.role !== "admin") redirect("/");

  const supabase = await createClient();
  const { data: habilitations } = await supabase
    .from("habilitations")
    .select("*, employe:employes(*)")
    .not("date_expiration", "is", null)
    .order("date_expiration")
    .returns<(Habilitation & { employe: Employe })[]>();

  const expirees = (habilitations ?? []).filter((h) => (joursAvant(h.date_expiration) ?? 0) < 0);
  const proches = (habilitations ?? []).filter((h) => {
    const j = joursAvant(h.date_expiration);
    return j !== null && j >= 0 && j <= 30;
  });
  const autres = (habilitations ?? []).filter((h) => (joursAvant(h.date_expiration) ?? 999) > 30);

  function Ligne({ h }: { h: Habilitation & { employe: Employe } }) {
    return (
      <div className="flex items-center justify-between text-sm">
        <Link href={`/employes/${h.employe.id}`} className="hover:underline">
          {h.employe.prenom} {h.employe.nom} — {h.libelle || TYPE_LABEL[h.type]}
        </Link>
        <span className="text-neutral-500">{formatDate(h.date_expiration)}</span>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-1 text-xl font-semibold">Alertes habilitations</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Toutes les échéances (CACES, habilitations, visites médicales) en un seul endroit.
      </p>

      <section className="mb-6 rounded border border-red-200 bg-red-50 p-4">
        <h2 className="mb-3 text-sm font-medium text-red-800">Expirées ({expirees.length})</h2>
        <div className="flex flex-col gap-2">
          {expirees.map((h) => (
            <Ligne key={h.id} h={h} />
          ))}
          {expirees.length === 0 ? <p className="text-sm text-neutral-500">Aucune.</p> : null}
        </div>
      </section>

      <section className="mb-6 rounded border border-orange-200 bg-orange-50 p-4">
        <h2 className="mb-3 text-sm font-medium text-orange-800">
          Dans les 30 jours ({proches.length})
        </h2>
        <div className="flex flex-col gap-2">
          {proches.map((h) => (
            <Ligne key={h.id} h={h} />
          ))}
          {proches.length === 0 ? <p className="text-sm text-neutral-500">Aucune.</p> : null}
        </div>
      </section>

      <section className="rounded border bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-neutral-500">À plus long terme ({autres.length})</h2>
        <div className="flex flex-col gap-2">
          {autres.map((h) => (
            <Ligne key={h.id} h={h} />
          ))}
          {autres.length === 0 ? <p className="text-sm text-neutral-500">Aucune.</p> : null}
        </div>
      </section>
    </main>
  );
}
