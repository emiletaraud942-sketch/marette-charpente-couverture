import { createClient } from "@/lib/supabase/server";
import type { Employe } from "@/lib/types/database";

/** Session + profil métier de l'utilisateur courant, ou null si non connecté. */
export async function getCurrentEmploye(): Promise<Employe | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data: employe } = await supabase
    .from("employes")
    .select("*")
    .eq("id", auth.user.id)
    .maybeSingle();

  return employe ?? null;
}
