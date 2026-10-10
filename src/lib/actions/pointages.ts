"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function pointerEntree(chantierId: string | null) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Non connecté");

  await supabase.from("pointages").insert({
    employe_id: auth.user.id,
    chantier_id: chantierId,
  });

  revalidatePath("/moi");
  revalidatePath("/");
}

export async function pointerSortie(pointageId: string) {
  const supabase = await createClient();
  await supabase
    .from("pointages")
    .update({ heure_sortie: new Date().toISOString() })
    .eq("id", pointageId);

  revalidatePath("/moi");
  revalidatePath("/");
}
