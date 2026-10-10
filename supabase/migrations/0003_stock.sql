-- Phase 2 : stock de matériaux/bois, mouvements liés aux chantiers

create type categorie_materiau as enum ('bois', 'quincaillerie', 'isolation', 'couverture', 'autre');
create type type_mouvement_stock as enum ('entree', 'sortie');

create table materiaux (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  categorie categorie_materiau not null default 'autre',
  unite text not null default 'unité',
  seuil_alerte numeric,
  created_at timestamptz not null default now()
);

create table stock_mouvements (
  id uuid primary key default gen_random_uuid(),
  materiau_id uuid not null references materiaux (id) on delete cascade,
  type type_mouvement_stock not null,
  quantite numeric not null check (quantite > 0),
  chantier_id uuid references chantiers (id) on delete set null,
  motif text,
  employe_id uuid references employes (id) on delete set null,
  created_at timestamptz not null default now()
);
create index stock_mouvements_materiau_idx on stock_mouvements (materiau_id);
create index stock_mouvements_chantier_idx on stock_mouvements (chantier_id);

-- Niveau de stock courant par matériau (entrées - sorties).
-- security_invoker : respecte les RLS de l'utilisateur qui interroge la vue.
create view stock_niveaux with (security_invoker = true) as
select
  m.id as materiau_id,
  m.nom,
  m.categorie,
  m.unite,
  m.seuil_alerte,
  coalesce(sum(case when sm.type = 'entree' then sm.quantite else -sm.quantite end), 0) as quantite_actuelle
from materiaux m
left join stock_mouvements sm on sm.materiau_id = m.id
group by m.id;

alter table materiaux enable row level security;
alter table stock_mouvements enable row level security;

-- Stock visible par l'admin et les chefs de chantier, géré par eux ; pas d'accès ouvrier.
create policy "materiaux_select" on materiaux for select
  using (private.current_employe_role() in ('admin', 'chef_chantier'));
create policy "materiaux_admin_write" on materiaux for insert
  with check (private.current_employe_role() = 'admin');
create policy "materiaux_admin_update" on materiaux for update
  using (private.current_employe_role() = 'admin')
  with check (private.current_employe_role() = 'admin');
create policy "materiaux_admin_delete" on materiaux for delete
  using (private.current_employe_role() = 'admin');

create policy "stock_mouvements_select" on stock_mouvements for select
  using (private.current_employe_role() in ('admin', 'chef_chantier'));
create policy "stock_mouvements_insert" on stock_mouvements for insert
  with check (private.current_employe_role() in ('admin', 'chef_chantier'));
create policy "stock_mouvements_admin_delete" on stock_mouvements for delete
  using (private.current_employe_role() = 'admin');
