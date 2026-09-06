create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  nom text not null check (char_length(nom) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  telephone text not null check (telephone ~ '^\\+[1-9][0-9]{6,14}$'),
  adresse text,
  description text,
  logo_url text,
  fuseau_horaire text not null default 'Africa/Kinshasa',
  plan text not null default 'trial' check (plan in ('trial', 'active', 'suspended')),
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  nom text not null check (char_length(nom) between 2 and 100),
  description text,
  prix numeric(12, 2) not null check (prix >= 0),
  duree_minutes integer not null check (duree_minutes between 5 and 480 and duree_minutes % 5 = 0),
  date_fin timestamptz,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  jour_semaine smallint not null check (jour_semaine between 0 and 6),
  heure_ouverture time not null default '09:00',
  heure_fermeture time not null default '18:00',
  ferme boolean not null default false,
  unique (business_id, jour_semaine),
  check (ferme or heure_ouverture < heure_fermeture)
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  client_nom text not null check (char_length(client_nom) between 2 and 120),
  client_telephone text not null check (client_telephone ~ '^\\+[1-9][0-9]{6,14}$'),
  date_heure timestamptz not null,
  duree_minutes integer not null check (duree_minutes between 5 and 480),
  statut text not null default 'confirme' check (statut in ('confirme', 'annule', 'termine', 'no_show')),
  notes text,
  cancellation_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists public.reminder_logs (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  type_rappel text not null check (type_rappel in ('confirmation', '24h', '1h')),
  statut text not null default 'pending' check (statut in ('pending', 'sent', 'failed')),
  tentatives smallint not null default 0 check (tentatives between 0 and 3),
  meta_message_id text,
  erreur text,
  next_attempt_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (appointment_id, type_rappel)
);

alter table public.businesses
  add column if not exists adresse text,
  add column if not exists description text,
  add column if not exists logo_url text,
  add column if not exists fuseau_horaire text not null default 'Africa/Kinshasa',
  add column if not exists plan text not null default 'trial',
  add column if not exists trial_ends_at timestamptz not null default (now() + interval '14 days'),
  add column if not exists created_at timestamptz not null default now();

alter table public.services
  add column if not exists description text,
  add column if not exists date_fin timestamptz,
  add column if not exists actif boolean not null default true,
  add column if not exists created_at timestamptz not null default now();

alter table public.appointments
  add column if not exists notes text,
  add column if not exists cancellation_token uuid default gen_random_uuid(),
  add column if not exists created_at timestamptz not null default now();

update public.appointments
set cancellation_token = gen_random_uuid()
where cancellation_token is null;

alter table public.appointments
  alter column cancellation_token set not null;

create unique index if not exists appointments_cancellation_token_idx
  on public.appointments (cancellation_token);

alter table public.reminder_logs
  add column if not exists tentatives smallint not null default 0,
  add column if not exists meta_message_id text,
  add column if not exists erreur text,
  add column if not exists next_attempt_at timestamptz,
  add column if not exists sent_at timestamptz,
  add column if not exists created_at timestamptz not null default now();

create index if not exists appointments_business_date_idx on public.appointments (business_id, date_heure);
create index if not exists appointments_pending_reminders_idx on public.appointments (date_heure) where statut = 'confirme';
create index if not exists services_public_listing_idx on public.services (business_id, actif) where actif = true;
create index if not exists reminder_logs_delivery_idx on public.reminder_logs (statut, next_attempt_at) where statut in ('pending', 'failed');

alter table public.appointments drop constraint if exists appointments_no_confirmed_overlap;
alter table public.appointments add constraint appointments_no_confirmed_overlap
  exclude using gist (
    business_id with =,
    tsrange(
      date_heure at time zone 'UTC',
      (date_heure at time zone 'UTC') + duree_minutes * interval '1 minute',
      '[)'
    ) with &&
  ) where (statut = 'confirme');

alter table public.businesses enable row level security;
alter table public.services enable row level security;
alter table public.business_hours enable row level security;
alter table public.appointments enable row level security;
alter table public.reminder_logs enable row level security;

create or replace function public.est_proprietaire_du_business(p_business_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.businesses
    where id = p_business_id and owner_id = auth.uid()
  );
$$;

revoke all on function public.est_proprietaire_du_business(uuid) from public;
grant execute on function public.est_proprietaire_du_business(uuid) to authenticated;

drop policy if exists businesses_owner_all on public.businesses;
create policy businesses_owner_all on public.businesses for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists services_owner_all on public.services;
create policy services_owner_all on public.services for all to authenticated
  using (public.est_proprietaire_du_business(business_id))
  with check (public.est_proprietaire_du_business(business_id));

drop policy if exists business_hours_owner_all on public.business_hours;
create policy business_hours_owner_all on public.business_hours for all to authenticated
  using (public.est_proprietaire_du_business(business_id))
  with check (public.est_proprietaire_du_business(business_id));

drop policy if exists appointments_owner_all on public.appointments;
create policy appointments_owner_all on public.appointments for all to authenticated
  using (public.est_proprietaire_du_business(business_id))
  with check (public.est_proprietaire_du_business(business_id));

drop policy if exists reminder_logs_owner_select on public.reminder_logs;
create policy reminder_logs_owner_select on public.reminder_logs for select to authenticated
  using (exists (
    select 1 from public.appointments a
    where a.id = appointment_id and public.est_proprietaire_du_business(a.business_id)
  ));

drop view if exists public.public_business_info;

create view public.public_business_info with (security_invoker = true) as
  select id, nom, slug, description, logo_url, fuseau_horaire
  from public.businesses
  where plan = 'active' or (plan = 'trial' and trial_ends_at > now());

create or replace function public.obtenir_business_public(p_slug text)
returns table (id uuid, nom text, slug text, description text, logo_url text)
language sql stable security definer set search_path = public as $$
  select id, nom, slug, description, logo_url
  from public.businesses
  where slug = p_slug and (plan = 'active' or (plan = 'trial' and trial_ends_at > now()));
$$;

create or replace function public.lister_services_publics(p_slug text)
returns table (id uuid, nom text, description text, prix numeric, duree_minutes integer)
language sql stable security definer set search_path = public as $$
  select s.id, s.nom, s.description, s.prix, s.duree_minutes
  from public.services s
  join public.businesses b on b.id = s.business_id
  where b.slug = p_slug
    and (b.plan = 'active' or (b.plan = 'trial' and b.trial_ends_at > now()))
    and s.actif and (s.date_fin is null or s.date_fin >= now())
  order by s.created_at;
$$;

create or replace function public.lister_creneaux_publics(
  p_slug text,
  p_service_id uuid,
  p_date date
) returns table (heure text, disponible boolean)
language plpgsql security definer set search_path = public as $$
declare
  business public.businesses%rowtype;
  service public.services%rowtype;
  horaire public.business_hours%rowtype;
  debut_journee timestamptz;
  fin_journee timestamptz;
  debut_creneau timestamptz;
begin
  select * into business from public.businesses
  where slug = p_slug and (plan = 'active' or (plan = 'trial' and trial_ends_at > now()));
  if not found then return; end if;

  select * into service from public.services
  where id = p_service_id and business_id = business.id and actif
    and (date_fin is null or date_fin >= now());
  if not found then return; end if;

  select * into horaire from public.business_hours
  where business_id = business.id and jour_semaine = extract(dow from p_date)::smallint;
  if not found or horaire.ferme then return; end if;

  debut_journee := timezone(business.fuseau_horaire, p_date::timestamp + horaire.heure_ouverture);
  fin_journee := timezone(business.fuseau_horaire, p_date::timestamp + horaire.heure_fermeture);

  for debut_creneau in select generate_series(debut_journee, fin_journee - make_interval(mins => service.duree_minutes), interval '15 minutes') loop
    heure := to_char(debut_creneau at time zone business.fuseau_horaire, 'HH24:MI');
    disponible := debut_creneau >= now() and not exists (
      select 1 from public.appointments a
      where a.business_id = business.id and a.statut = 'confirme'
        and tstzrange(a.date_heure, a.date_heure + make_interval(mins => a.duree_minutes), '[)')
          && tstzrange(debut_creneau, debut_creneau + make_interval(mins => service.duree_minutes), '[)')
    );
    return next;
  end loop;
end;
$$;

create or replace function public.creer_reservation_publique(
  p_slug text,
  p_service_id uuid,
  p_date date,
  p_heure time,
  p_client_nom text,
  p_client_telephone text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  business public.businesses%rowtype;
  service public.services%rowtype;
  horaire public.business_hours%rowtype;
  date_locale timestamp;
  date_heure_rendez_vous timestamptz;
  nouveau_rendez_vous_id uuid;
begin
  select * into business from public.businesses
  where slug = p_slug and (plan = 'active' or (plan = 'trial' and trial_ends_at > now()));
  if not found then raise exception 'BUSINESS_UNAVAILABLE'; end if;

  select * into service from public.services
  where id = p_service_id and business_id = business.id and actif
    and (date_fin is null or date_fin >= now());
  if not found then raise exception 'SERVICE_UNAVAILABLE'; end if;

  date_locale := p_date::timestamp + p_heure;
  date_heure_rendez_vous := timezone(business.fuseau_horaire, date_locale);
  select * into horaire from public.business_hours
  where business_id = business.id and jour_semaine = extract(dow from date_locale)::smallint;
  if not found or horaire.ferme
    or date_locale::time < horaire.heure_ouverture
    or date_locale::time + make_interval(mins => service.duree_minutes) > horaire.heure_fermeture
    or date_heure_rendez_vous < now() then
    raise exception 'SLOT_UNAVAILABLE';
  end if;

  insert into public.appointments (business_id, service_id, client_nom, client_telephone, date_heure, duree_minutes)
  values (business.id, service.id, trim(p_client_nom), trim(p_client_telephone), date_heure_rendez_vous, service.duree_minutes)
  returning id into nouveau_rendez_vous_id;

  insert into public.reminder_logs (appointment_id, type_rappel, statut, next_attempt_at)
  values (nouveau_rendez_vous_id, 'confirmation', 'pending', now());

  return nouveau_rendez_vous_id;
exception when exclusion_violation then
  raise exception 'SLOT_UNAVAILABLE';
end;
$$;

create or replace function public.obtenir_annulation_publique(p_token uuid)
returns table (service_nom text, business_nom text, date_heure timestamptz, statut text)
language sql stable security definer set search_path = public as $$
  select s.nom, b.nom, a.date_heure, a.statut
  from public.appointments a
  join public.businesses b on b.id = a.business_id
  left join public.services s on s.id = a.service_id
  where a.cancellation_token = p_token;
$$;

create or replace function public.annuler_reservation_publique(p_token uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.appointments
  set statut = 'annule'
  where cancellation_token = p_token
    and statut = 'confirme'
    and date_heure > now();

  return found;
end;
$$;

revoke all on function public.lister_creneaux_publics(text, uuid, date) from public;
revoke all on function public.obtenir_business_public(text) from public;
revoke all on function public.lister_services_publics(text) from public;
revoke all on function public.creer_reservation_publique(text, uuid, date, time, text, text) from public;
revoke all on function public.obtenir_annulation_publique(uuid) from public;
revoke all on function public.annuler_reservation_publique(uuid) from public;
grant execute on function public.obtenir_business_public(text) to anon, authenticated;
grant execute on function public.lister_services_publics(text) to anon, authenticated;
grant execute on function public.lister_creneaux_publics(text, uuid, date) to anon, authenticated;
grant execute on function public.creer_reservation_publique(text, uuid, date, time, text, text) to anon, authenticated;
grant execute on function public.obtenir_annulation_publique(uuid) to anon, authenticated;
grant execute on function public.annuler_reservation_publique(uuid) to anon, authenticated;
