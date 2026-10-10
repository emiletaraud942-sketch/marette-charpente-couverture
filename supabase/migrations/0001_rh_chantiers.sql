-- Phase 1 : module RH / chantiers
-- "qui est où, qui fait quoi" + habilitations + pointage + absences

create type role_employe as enum ('admin', 'chef_chantier', 'ouvrier');
create type statut_employe as enum ('actif', 'conge', 'arret', 'inactif');
create type statut_chantier as enum ('a_venir', 'en_cours', 'termine');
create type type_habilitation as enum ('caces', 'habilitation_electrique', 'travail_hauteur', 'visite_medicale', 'autre');
create type type_absence as enum ('conge', 'maladie', 'autre');
create type statut_absence as enum ('demande', 'valide', 'refuse');

-- Profil métier de chaque utilisateur. id = auth.users.id (1 compte = 1 employé).
create table employes (
  id uuid primary key references auth.users (id) on delete cascade,
  nom text not null,
  prenom text not null,
  telephone text,
  role role_employe not null default 'ouvrier',
  statut statut_employe not null default 'actif',
  date_entree date,
  created_at timestamptz not null default now()
);

create table chantiers (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  client text,
  adresse text,
  date_debut date,
  date_fin date,
  statut statut_chantier not null default 'a_venir',
  created_at timestamptz not null default now()
);

create table affectations (
  id uuid primary key default gen_random_uuid(),
  employe_id uuid not null references employes (id) on delete cascade,
  chantier_id uuid not null references chantiers (id) on delete cascade,
  date_debut date not null,
  date_fin date,
  role_sur_chantier text,
  created_at timestamptz not null default now()
);
create index affectations_employe_idx on affectations (employe_id);
create index affectations_chantier_idx on affectations (chantier_id);

create table pointages (
  id uuid primary key default gen_random_uuid(),
  employe_id uuid not null references employes (id) on delete cascade,
  chantier_id uuid references chantiers (id) on delete set null,
  heure_entree timestamptz not null default now(),
  heure_sortie timestamptz,
  created_at timestamptz not null default now()
);
create index pointages_employe_idx on pointages (employe_id);

create table habilitations (
  id uuid primary key default gen_random_uuid(),
  employe_id uuid not null references employes (id) on delete cascade,
  type type_habilitation not null,
  libelle text,
  date_obtention date,
  date_expiration date,
  created_at timestamptz not null default now()
);
create index habilitations_employe_idx on habilitations (employe_id);

create table absences (
  id uuid primary key default gen_random_uuid(),
  employe_id uuid not null references employes (id) on delete cascade,
  type type_absence not null,
  date_debut date not null,
  date_fin date not null,
  statut statut_absence not null default 'demande',
  created_at timestamptz not null default now()
);
create index absences_employe_idx on absences (employe_id);

-- Rôle de l'utilisateur courant, utilisé par les politiques RLS ci-dessous.
create function current_employe_role()
returns role_employe
language sql
security definer
stable
set search_path = public
as $$
  select role from employes where id = auth.uid()
$$;

-- Un chef de chantier voit les employés qui partagent au moins une affectation
-- (même chantier) avec lui.
create function partage_un_chantier_avec(cible uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from affectations a1
    join affectations a2 on a1.chantier_id = a2.chantier_id
    where a1.employe_id = auth.uid() and a2.employe_id = cible
  )
$$;

alter table employes enable row level security;
alter table chantiers enable row level security;
alter table affectations enable row level security;
alter table pointages enable row level security;
alter table habilitations enable row level security;
alter table absences enable row level security;

-- employes
create policy "employes_select" on employes for select
  using (
    id = auth.uid()
    or current_employe_role() = 'admin'
    or (current_employe_role() = 'chef_chantier' and partage_un_chantier_avec(id))
  );
create policy "employes_admin_write" on employes for all
  using (current_employe_role() = 'admin')
  with check (current_employe_role() = 'admin');

-- chantiers
create policy "chantiers_select" on chantiers for select
  using (
    current_employe_role() = 'admin'
    or exists (
      select 1 from affectations
      where affectations.chantier_id = chantiers.id and affectations.employe_id = auth.uid()
    )
  );
create policy "chantiers_admin_write" on chantiers for all
  using (current_employe_role() = 'admin')
  with check (current_employe_role() = 'admin');

-- affectations
create policy "affectations_select" on affectations for select
  using (
    employe_id = auth.uid()
    or current_employe_role() = 'admin'
    or (current_employe_role() = 'chef_chantier' and partage_un_chantier_avec(employe_id))
  );
create policy "affectations_admin_write" on affectations for all
  using (current_employe_role() = 'admin')
  with check (current_employe_role() = 'admin');

-- pointages : chacun pointe pour soi-même ; admin voit/gère tout ;
-- un chef de chantier voit les pointages de son équipe.
create policy "pointages_select" on pointages for select
  using (
    employe_id = auth.uid()
    or current_employe_role() = 'admin'
    or (current_employe_role() = 'chef_chantier' and partage_un_chantier_avec(employe_id))
  );
create policy "pointages_insert_own" on pointages for insert
  with check (employe_id = auth.uid() or current_employe_role() = 'admin');
create policy "pointages_update_own" on pointages for update
  using (employe_id = auth.uid() or current_employe_role() = 'admin')
  with check (employe_id = auth.uid() or current_employe_role() = 'admin');
create policy "pointages_admin_delete" on pointages for delete
  using (current_employe_role() = 'admin');

-- habilitations : l'employé voit les siennes, l'admin gère tout.
create policy "habilitations_select" on habilitations for select
  using (
    employe_id = auth.uid()
    or current_employe_role() = 'admin'
    or (current_employe_role() = 'chef_chantier' and partage_un_chantier_avec(employe_id))
  );
create policy "habilitations_admin_write" on habilitations for all
  using (current_employe_role() = 'admin')
  with check (current_employe_role() = 'admin');

-- absences : l'employé demande pour lui-même, l'admin valide/refuse.
create policy "absences_select" on absences for select
  using (employe_id = auth.uid() or current_employe_role() = 'admin');
create policy "absences_insert_own" on absences for insert
  with check (employe_id = auth.uid() and statut = 'demande');
create policy "absences_admin_write" on absences for update
  using (current_employe_role() = 'admin')
  with check (current_employe_role() = 'admin');
create policy "absences_admin_delete" on absences for delete
  using (current_employe_role() = 'admin');
