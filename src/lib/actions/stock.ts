"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmploye } from "@/lib/auth";

export async function creerMateriau(formData: FormData) {
  const moi = await getCurrentEmploye();
  if (moi?.role !== "admin") throw new Error("Réservé à l'administrateur");

  const supabase = await createClient();
  const seuil = String(formData.get("seuil_alerte") ?? "");
  const { data, error } = await supabase
    .from("materiaux")
    .insert({
      nom: String(formData.get("nom") ?? ""),
      categorie: String(formData.get("categorie") ?? "autre"),
      unite: String(formData.get("unite") ?? "unité"),
      seuil_alerte: seuil ? Number(seuil) : null,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Création impossible");

  revalidatePath("/stock");
  redirect(`/stock/${data.id}`);
}

export async function enregistrerMouvement(materiauId: string, formData: FormData) {
  const moi = await getCurrentEmploye();
  if (!moi || !["admin", "chef_chantier"].includes(moi.role)) {
    throw new Error("Réservé à l'admin et aux chefs de chantier");
  }

  const supabase = await createClient();
  await supabase.from("stock_mouvements").insert({
    materiau_id: materiauId,
    type: String(formData.get("type") ?? "entree"),
    quantite: Number(formData.get("quantite") ?? 0),
    chantier_id: String(formData.get("chantier_id") ?? "") || null,
    motif: String(formData.get("motif") ?? "") || null,
    employe_id: moi.id,
  });

  revalidatePath(`/stock/${materiauId}`);
  revalidatePath("/stock");
}
