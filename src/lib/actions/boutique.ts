"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmploye } from "@/lib/auth";

export async function creerProduit(formData: FormData) {
  const moi = await getCurrentEmploye();
  if (moi?.role !== "admin") throw new Error("Réservé à l'administrateur");

  const prix = String(formData.get("prix_indicatif") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("produits_bois").insert({
    nom: String(formData.get("nom") ?? ""),
    description: String(formData.get("description") ?? "") || null,
    prix_indicatif: prix ? Number(prix) : null,
    unite: String(formData.get("unite") ?? "unité"),
  });
  if (error) throw new Error(error.message);

  revalidatePath("/catalogue");
  revalidatePath("/boutique");
  redirect("/catalogue");
}

export async function changerDisponibilite(produitId: string, disponible: boolean) {
  const moi = await getCurrentEmploye();
  if (moi?.role !== "admin") throw new Error("Réservé à l'administrateur");

  const supabase = await createClient();
  await supabase.from("produits_bois").update({ disponible }).eq("id", produitId);

  revalidatePath("/catalogue");
  revalidatePath("/boutique");
}

/** Formulaire public de demande de devis — accessible sans connexion. */
export async function deposerDemandeDevis(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("demandes_devis").insert({
    nom_client: String(formData.get("nom_client") ?? ""),
    telephone_client: String(formData.get("telephone_client") ?? ""),
    email_client: String(formData.get("email_client") ?? "") || null,
    produit_id: String(formData.get("produit_id") ?? "") || null,
    quantite: String(formData.get("quantite") ?? "") || null,
    message: String(formData.get("message") ?? "") || null,
  });
  if (error) throw new Error(error.message);

  redirect("/boutique/merci");
}

export async function marquerDevisTraite(devisId: string) {
  const moi = await getCurrentEmploye();
  if (moi?.role !== "admin") throw new Error("Réservé à l'administrateur");

  const supabase = await createClient();
  await supabase.from("demandes_devis").update({ statut: "traitee" }).eq("id", devisId);
  revalidatePath("/devis");
}
