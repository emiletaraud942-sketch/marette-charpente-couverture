# Marette Charpente Couverture — logiciel métier

Application de gestion interne pour MARETTE CHARPENTE COUVERTURE et MARETTE
BOIS & MATERIAUX : RH/chantiers, stock, vitrine de vente de bois en ligne,
alertes et exports comptables.

## Pile technique

- Next.js 16 (App Router, TypeScript, Tailwind)
- Supabase (Postgres, Auth, RLS)
- Déploiement visé : Vercel

## Mise en route locale

```bash
npm install
cp .env.local.example .env.local   # remplir les valeurs
npm run dev
```

Variables obligatoires (`.env.local.example` liste tout, avec commentaires) :

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — projet
  Supabase du groupe Marette.

Variables optionnelles (phase 4, inactives si absentes, voir plus bas) :

- `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`,
  `ALERTES_EMAIL_DESTINATAIRE`, `CRON_SECRET` — alertes email automatiques.
- `ANTHROPIC_API_KEY` — résumé IA des demandes de devis.

## Base de données

Les migrations SQL sont dans `supabase/migrations/`, à appliquer dans
l'ordre numérique (chacune dépend de la précédente) :

1. `0001_rh_chantiers.sql` — employés, chantiers, affectations, pointages,
   habilitations, absences + RLS par rôle (admin/chef de chantier/ouvrier).
2. `0002_masquer_fonctions_rls_api.sql` — déplace les fonctions RLS internes
   hors du schéma exposé par l'API (correctif sécurité).
3. `0003_stock.sql` — matériaux, mouvements de stock, vue des niveaux.
4. `0004_boutique_bois.sql` — catalogue public et demandes de devis
   (contient aussi le `grant usage on schema private` oublié en 0002).
5. `0005_resume_ia_devis.sql` — colonne pour le résumé IA des devis.

Après la première migration, créer le premier compte admin (il n'existe
aucun flux d'inscription publique) : créer un utilisateur dans
Supabase Auth, puis insérer la ligne correspondante dans `public.employes`
avec `role = 'admin'`.

## Modules

- **RH / chantiers** (`/`, `/moi`, `/planning`, `/employes`, `/chantiers`) —
  qui est où, qui fait quoi, pointage mobile, habilitations avec échéances.
- **Stock** (`/stock`) — matériaux, entrées/sorties liées aux chantiers,
  alerte de seuil.
- **Vitrine bois** (`/boutique`, publique, sans connexion) — catalogue et
  demande de devis pour MARETTE BOIS & MATERIAUX ; gestion côté admin sur
  `/catalogue` et `/devis`. Paiement en ligne non implémenté (mention
  "paiement par carte/espèces à la commande" ; Stripe pourra être ajouté
  plus tard si besoin).
- **Alertes** (`/alertes`) — toutes les échéances d'habilitations en un
  seul endroit, tous employés confondus.
- **Export** (`/export`) — CSV des heures travaillées et des mouvements de
  stock, à transmettre au comptable (aucun outil comptable fixe connecté
  pour l'instant).
- **Automatisations email/IA** — `src/app/api/cron/alertes-habilitations`
  (déclenché par `vercel.json`) envoie un récapitulatif email des échéances
  proches ; le bouton "Résumer avec l'IA" sur `/devis` résume une demande
  avec Claude. Les deux restent inertes (sans erreur) tant que leurs clés
  d'environnement ne sont pas renseignées.

## Rôles

- **admin** — accès complet (RH, stock, catalogue, devis, exports, alertes).
- **chef_chantier** — RH/chantiers/planning/stock de son équipe, pas
  d'accès au catalogue/devis/export.
- **ouvrier** — son propre espace (`/moi`) : planning du jour, pointage,
  ses habilitations.

## Vérification

```bash
npm run build   # build + typecheck
npm run lint
node scripts/smoke-test.mjs   # parcours admin de bout en bout (nécessite le serveur dev lancé et une base migrée)
```
