import { redirect } from "next/navigation";
import { getCurrentEmploye } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/date";
import { enregistrerMouvement } from "@/lib/actions/stock";
import type { Chantier, StockMouvement, StockNiveau } from "@/lib/types/database";

export default async function FicheMateriauPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const moi = await getCurrentEmploye();
  if (!moi) redirect("/login");
  if (!["admin", "chef_chantier"].includes(moi.role)) redirect("/");

  const supabase = await createClient();
  const [{ data: niveau }, { data: mouvements }, { data: chantiers }] = await Promise.all([
    supabase.from("stock_niveaux").select("*").eq("materiau_id", id).maybeSingle<StockNiveau>(),
    supabase
      .from("stock_mouvements")
      .select("*, chantier:chantiers(*)")
      .eq("materiau_id", id)
      .order("created_at", { ascending: false })
      .returns<(StockMouvement & { chantier: Chantier | null })[]>(),
    supabase.from("chantiers").select("*").order("nom").returns<Chantier[]>(),
  ]);

  if (!niveau) {
    return <main className="mx-auto max-w-2xl px-4 py-6">Matériau introuvable.</main>;
  }

  const enAlerte = niveau.seuil_alerte !== null && niveau.quantite_actuelle <= niveau.seuil_alerte;

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-1 text-xl font-semibold">{niveau.nom}</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Stock actuel :{" "}
        <strong className={enAlerte ? "text-red-600" : ""}>
          {niveau.quantite_actuelle} {niveau.unite}
        </strong>
        {niveau.seuil_alerte !== null ? ` (seuil : ${niveau.seuil_alerte} ${niveau.unite})` : ""}
      </p>

      <section className="mb-8 rounded border bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-neutral-500">Enregistrer un mouvement</h2>
        <form
          action={async (formData) => enregistrerMouvement(niveau.materiau_id, formData)}
          className="flex flex-wrap gap-2"
        >
          <select name="type" defaultValue="entree" className="rounded border px-2 py-1 text-sm">
            <option value="entree">Entrée</option>
            <option value="sortie">Sortie</option>
          </select>
          <input
            name="quantite"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="Quantité"
            className="w-28 rounded border px-2 py-1 text-sm"
          />
          <select name="chantier_id" className="rounded border px-2 py-1 text-sm">
            <option value="">Chantier (optionnel)</option>
            {(chantiers ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
          <input name="motif" placeholder="Motif (optionnel)" className="rounded border px-2 py-1 text-sm" />
          <button type="submit" className="rounded bg-neutral-900 px-3 py-1 text-sm text-white">
            Enregistrer
          </button>
        </form>
      </section>

      <section className="rounded border bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-neutral-500">Historique</h2>
        <div className="flex flex-col gap-2">
          {(mouvements ?? []).map((m) => (
            <div key={m.id} className="flex items-center justify-between text-sm">
              <span>
                {m.type === "entree" ? "+" : "−"}
                {m.quantite} {niveau.unite}
                {m.chantier ? ` · ${m.chantier.nom}` : ""}
                {m.motif ? ` · ${m.motif}` : ""}
              </span>
              <span className="text-neutral-500">{formatDate(m.created_at)}</span>
            </div>
          ))}
          {(mouvements ?? []).length === 0 ? (
            <p className="text-sm text-neutral-500">Aucun mouvement enregistré.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
