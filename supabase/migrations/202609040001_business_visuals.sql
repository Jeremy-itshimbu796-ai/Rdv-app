-- Identité visuelle des commerces : bannière + bucket de stockage dédié.

alter table public.businesses
  add column if not exists banniere_url text;

-- Le champ adresse existe déjà (text, nullable) depuis la migration initiale.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('business-assets', 'business-assets', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Un commerçant ne peut écrire que dans le dossier {business_id}/ correspondant a son propre business.
drop policy if exists business_assets_insert_own_folder on storage.objects;
create policy business_assets_insert_own_folder on storage.objects for insert to authenticated
  with check (
    bucket_id = 'business-assets'
    and (storage.foldername(name))[1] = (
      select id::text from public.businesses where owner_id = auth.uid()
    )
  );

drop policy if exists business_assets_update_own_folder on storage.objects;
create policy business_assets_update_own_folder on storage.objects for update to authenticated
  using (
    bucket_id = 'business-assets'
    and (storage.foldername(name))[1] = (
      select id::text from public.businesses where owner_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'business-assets'
    and (storage.foldername(name))[1] = (
      select id::text from public.businesses where owner_id = auth.uid()
    )
  );

drop policy if exists business_assets_delete_own_folder on storage.objects;
create policy business_assets_delete_own_folder on storage.objects for delete to authenticated
  using (
    bucket_id = 'business-assets'
    and (storage.foldername(name))[1] = (
      select id::text from public.businesses where owner_id = auth.uid()
    )
  );

-- Le bucket est public : la lecture directe via /storage/v1/object/public/... ne passe pas
-- par cette policy, mais on l'ajoute quand meme pour les acces authentifies via l'API storage.
drop policy if exists business_assets_public_read on storage.objects;
create policy business_assets_public_read on storage.objects for select to public
  using (bucket_id = 'business-assets');

-- Les fonctions publiques doivent renvoyer adresse et banniere_url pour l'affichage de la page de reservation.
drop function if exists public.obtenir_business_public(text);
create function public.obtenir_business_public(p_slug text)
returns table (id uuid, nom text, slug text, description text, logo_url text, adresse text, banniere_url text)
language sql stable security definer set search_path = public as $$
  select b.id, b.nom, b.slug, b.description, b.logo_url, b.adresse, b.banniere_url
  from public.businesses b
  where b.slug = p_slug and public.business_est_accessible(b.id);
$$;

revoke all on function public.obtenir_business_public(text) from public;
grant execute on function public.obtenir_business_public(text) to anon, authenticated;

drop view if exists public.public_business_info;
create view public.public_business_info with (security_invoker = true) as
  select id, nom, slug, description, logo_url, adresse, banniere_url, fuseau_horaire
  from public.businesses
  where public.business_est_accessible(id);
