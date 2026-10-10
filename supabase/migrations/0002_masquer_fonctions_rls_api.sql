-- Empêche l'exposition de ces fonctions internes comme endpoints RPC publics
-- (/rest/v1/rpc/...) tout en gardant leur usage par les politiques RLS.
create schema if not exists private;
alter function public.current_employe_role() set schema private;
alter function public.partage_un_chantier_avec(uuid) set schema private;
