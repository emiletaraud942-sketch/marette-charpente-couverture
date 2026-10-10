import { createClient } from "@/lib/supabase/server";
import { deposerDemandeDevis } from "@/lib/actions/boutique";
import type { ProduitBois } from "@/lib/types/database";

export default async function DemandeDevisPage({
  searchParams,
}: {
  searchParams: Promise<{ produit?: string }>;
}) {
  const { produit: produitId } = await searchParams;
  const supabase = await createClient();
  const { data: produits } = await supabase
    .from("produits_bois")
    .select("*")
    .eq("disponible", true)
    .order("nom")
    .returns<ProduitBois[]>();

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-2 text-xl font-semibold">Demande de devis</h1>
      <p className="mb-6 text-sm text-neutral-600">
        Laissez-nous vos coordonnées, nous vous rappelons pour confirmer votre commande et le
        prix. Paiement par carte ou en espèces à la commande ou à la livraison.
      </p>

      <form action={deposerDemandeDevis} className="flex flex-col gap-3">
        <input name="nom_client" required placeholder="Nom" className="rounded border px-3 py-2" />
        <input
          name="telephone_client"
          required
          placeholder="Téléphone"
          className="rounded border px-3 py-2"
        />
        <input
          name="email_client"
          type="email"
          placeholder="Email (optionnel)"
          className="rounded border px-3 py-2"
        />
        <select name="produit_id" defaultValue={produitId ?? ""} className="rounded border px-3 py-2">
          <option value="">Besoin hors catalogue</option>
          {(produits ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.nom}
            </option>
          ))}
        </select>
        <input
          name="quantite"
          placeholder="Quantité souhaitée (ex. 3 m³)"
          className="rounded border px-3 py-2"
        />
        <textarea
          name="message"
          placeholder="Précisez votre besoin (optionnel)"
          className="rounded border px-3 py-2"
          rows={3}
        />
        <button type="submit" className="rounded bg-neutral-900 px-3 py-2 text-white">
          Envoyer la demande
        </button>
      </form>
    </main>
  );
}
