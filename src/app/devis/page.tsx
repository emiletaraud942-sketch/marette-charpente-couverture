import { redirect } from "next/navigation";
import { getCurrentEmploye } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/date";
import { marquerDevisTraite, resumerDevisAvecIA } from "@/lib/actions/boutique";
import type { DemandeDevis, ProduitBois } from "@/lib/types/database";

export default async function DevisPage() {
  const moi = await getCurrentEmploye();
  if (moi?.role !== "admin") redirect("/");

  const supabase = await createClient();
  const { data: demandes } = await supabase
    .from("demandes_devis")
    .select("*, produit:produits_bois(*)")
    .order("created_at", { ascending: false })
    .returns<(DemandeDevis & { produit: ProduitBois | null })[]>();

  const nouvelles = (demandes ?? []).filter((d) => d.statut === "nouvelle");
  const traitees = (demandes ?? []).filter((d) => d.statut === "traitee");

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-6 text-xl font-semibold">Demandes de devis (vitrine bois)</h1>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium text-neutral-500">
          Nouvelles ({nouvelles.length})
        </h2>
        <div className="flex flex-col gap-2">
          {nouvelles.map((d) => (
            <div key={d.id} className="rounded border bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  {d.nom_client} · {d.telephone_client}
                </p>
                <div className="flex gap-2">
                  <form action={async () => resumerDevisAvecIA(d.id)}>
                    <button type="submit" className="rounded border px-2 py-1 text-xs hover:bg-neutral-50">
                      Résumer avec l&apos;IA
                    </button>
                  </form>
                  <form action={async () => marquerDevisTraite(d.id)}>
                    <button type="submit" className="rounded border px-2 py-1 text-xs hover:bg-neutral-50">
                      Marquer traitée
                    </button>
                  </form>
                </div>
              </div>
              <p className="mt-1 text-sm text-neutral-600">
                {d.produit ? d.produit.nom : "Besoin hors catalogue"}
                {d.quantite ? ` · ${d.quantite}` : ""}
              </p>
              {d.message ? <p className="mt-1 text-sm text-neutral-500">{d.message}</p> : null}
              {d.resume_ia ? (
                <p className="mt-2 rounded bg-indigo-50 px-2 py-1 text-sm text-indigo-800">
                  {d.resume_ia}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-neutral-400">{formatDate(d.created_at)}</p>
            </div>
          ))}
          {nouvelles.length === 0 ? <p className="text-sm text-neutral-500">Aucune nouvelle demande.</p> : null}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-neutral-500">Traitées ({traitees.length})</h2>
        <div className="flex flex-col gap-2">
          {traitees.map((d) => (
            <div key={d.id} className="rounded border bg-neutral-50 p-4 text-sm text-neutral-500">
              {d.nom_client} · {d.telephone_client} · {formatDate(d.created_at)}
            </div>
          ))}
          {traitees.length === 0 ? <p className="text-sm text-neutral-500">Aucune demande traitée.</p> : null}
        </div>
      </section>
    </main>
  );
}
