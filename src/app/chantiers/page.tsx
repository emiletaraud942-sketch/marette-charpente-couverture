import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentEmploye } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/date";
import type { Chantier } from "@/lib/types/database";

const STATUT_LABEL: Record<Chantier["statut"], string> = {
  a_venir: "À venir",
  en_cours: "En cours",
  termine: "Terminé",
};

export default async function ChantiersPage() {
  const moi = await getCurrentEmploye();
  if (!moi) redirect("/login");

  const supabase = await createClient();
  const { data: chantiers } = await supabase
    .from("chantiers")
    .select("*")
    .order("date_debut", { ascending: false })
    .returns<Chantier[]>();

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Chantiers</h1>
        {moi.role === "admin" ? (
          <Link
            href="/chantiers/nouveau"
            className="rounded bg-neutral-900 px-3 py-2 text-sm text-white"
          >
            Nouveau chantier
          </Link>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        {(chantiers ?? []).map((chantier) => (
          <Link
            key={chantier.id}
            href={`/chantiers/${chantier.id}`}
            className="flex items-center justify-between rounded border bg-white px-4 py-3 hover:bg-neutral-50"
          >
            <div>
              <p className="font-medium">{chantier.nom}</p>
              <p className="text-sm text-neutral-500">
                {formatDate(chantier.date_debut)} → {formatDate(chantier.date_fin)}
              </p>
            </div>
            <span className="text-sm text-neutral-500">{STATUT_LABEL[chantier.statut]}</span>
          </Link>
        ))}
        {(chantiers ?? []).length === 0 ? (
          <p className="text-sm text-neutral-500">Aucun chantier enregistré.</p>
        ) : null}
      </div>
    </main>
  );
}
