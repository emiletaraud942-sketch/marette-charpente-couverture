import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase indépendant des cookies de la requête en cours.
 * Sert uniquement à créer un compte (auth.signUp) pour un tiers sans
 * remplacer la session de l'administrateur connecté.
 */
export function createIsolatedAuthClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export function genererMotDePasseTemporaire(): string {
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);
}
