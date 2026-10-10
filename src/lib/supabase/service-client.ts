import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase côté serveur qui contourne le RLS (clé service_role).
 * Réservé aux tâches de confiance sans session utilisateur (cron, webhooks) —
 * ne jamais importer depuis un composant client ou exposer au navigateur.
 * Retourne null si SUPABASE_SERVICE_ROLE_KEY n'est pas configurée.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
