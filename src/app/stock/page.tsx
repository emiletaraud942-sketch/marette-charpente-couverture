import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentEmploye } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { StockNiveau } from "@/lib/types/database";

const CATEGORIE_LABEL: Record<StockNiveau["categorie"], string> = {
  bois: "Bois",
  quincaillerie: "Quincaillerie",
  isolation: "Isolation",
  couverture: "Couverture",
  autre: "Autre",
};

export default async function StockPage() {
  const moi = await getCurrentEmploye();
  if (!moi) redirect("/login");
  if (!["admin", "chef_chantier"].includes(moi.role)) redirect("/");

  const supabase = await createClient();
  const { data: niveaux } = await supabase
    .from("stock_niveaux")
    .select("*")
    .order("nom")
    .returns<StockNiveau[]>();

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Stock</h1>
        {moi.role === "admin" ? (
          <Link href="/stock/nouveau" className="rounded bg-neutral-900 px-3 py-2 text-sm text-white">
            Nouveau matériau
          </Link>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        {(niveaux ?? []).map((n) => {
          const enAlerte = n.seuil_alerte !== null && n.quantite_actuelle <= n.seuil_alerte;
          return (
            <Link
              key={n.materiau_id}
              href={`/stock/${n.materiau_id}`}
              className="flex items-center justify-between rounded border bg-white px-4 py-3 hover:bg-neutral-50"
            >
              <div>
                <p className="font-medium">{n.nom}</p>
                <p className="text-sm text-neutral-500">{CATEGORIE_LABEL[n.categorie]}</p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs ${
                  enAlerte ? "bg-red-100 text-red-800" : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {n.quantite_actuelle} {n.unite}
                {enAlerte ? " — seuil atteint" : ""}
              </span>
            </Link>
          );
        })}
        {(niveaux ?? []).length === 0 ? (
          <p className="text-sm text-neutral-500">Aucun matériau enregistré.</p>
        ) : null}
      </div>
    </main>
  );
}
