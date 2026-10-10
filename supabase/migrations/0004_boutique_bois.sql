-- Correctif 0002 : déplacer les fonctions RLS dans le schéma `private` ne suffit
-- pas, il faut aussi que les rôles anon/authenticated aient le droit d'utiliser
-- ce schéma, sinon toute politique qui appelle private.current_employe_role()
-- échoue pour ces rôles (permission denied for schema private).
grant usage on schema private to anon, authenticated;

-- Phase 3 : vitrine et demandes de devis pour MARETTE BOIS & MATERIAUX
-- Catalogue public (lecture libre) + demandes de devis (écriture libre, lecture admin).

create type statut_devis as enum ('nouvelle', 'traitee');

create table produits_bois (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  description text,
  prix_indicatif numeric,
  unite text not null default 'unité',
  image_url text,
  disponible boolean not null default true,
  created_at timestamptz not null default now()
);

create table demandes_devis (
  id uuid primary key default gen_random_uuid(),
  nom_client text not null,
  telephone_client text not null,
  email_client text,
  produit_id uuid references produits_bois (id) on delete set null,
  quantite text,
  message text,
  statut statut_devis not null default 'nouvelle',
  created_at timestamptz not null default now()
);
create index demandes_devis_statut_idx on demandes_devis (statut);

alter table produits_bois enable row level security;
alter table demandes_devis enable row level security;

-- Catalogue : visible par tous (vitrine publique) pour les produits disponibles,
-- visible en totalité et modifiable par l'admin seul.
create policy "produits_bois_select_public" on produits_bois for select
  using (disponible = true);
create policy "produits_bois_select_admin" on produits_bois for select
  using (private.current_employe_role() = 'admin');
create policy "produits_bois_admin_write" on produits_bois for insert
  with check (private.current_employe_role() = 'admin');
create policy "produits_bois_admin_update" on produits_bois for update
  using (private.current_employe_role() = 'admin')
  with check (private.current_employe_role() = 'admin');
create policy "produits_bois_admin_delete" on produits_bois for delete
  using (private.current_employe_role() = 'admin');

-- Demandes de devis : n'importe qui peut en déposer une (formulaire public),
-- seul l'admin peut les consulter et les traiter.
create policy "demandes_devis_insert_public" on demandes_devis for insert
  with check (statut = 'nouvelle');
create policy "demandes_devis_select_admin" on demandes_devis for select
  using (private.current_employe_role() = 'admin');
create policy "demandes_devis_update_admin" on demandes_devis for update
  using (private.current_employe_role() = 'admin')
  with check (private.current_employe_role() = 'admin');
create policy "demandes_devis_delete_admin" on demandes_devis for delete
  using (private.current_employe_role() = 'admin');
