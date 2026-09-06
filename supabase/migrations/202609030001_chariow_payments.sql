alter table public.subscription_payments
  rename column flutterwave_tx_ref to reference_interne;

alter table public.subscription_payments
  rename column flutterwave_transaction_id to fournisseur_transaction_id;

alter table public.subscription_payments
  add column if not exists fournisseur text not null default 'flutterwave',
  add column if not exists fournisseur_sale_id text unique,
  add column if not exists fournisseur_payment_id text,
  add column if not exists fournisseur_gateway text,
  add column if not exists webhook_delivery_id text unique,
  add column if not exists montant_paye numeric(12, 2),
  add column if not exists devise_payee text,
  add column if not exists payload_fournisseur jsonb;

alter table public.subscription_payments
  alter column fournisseur set default 'chariow';

alter table public.subscription_payments
  drop constraint if exists subscription_payments_statut_check;

alter table public.subscription_payments
  add constraint subscription_payments_statut_check
  check (statut in ('pending', 'successful', 'failed', 'cancelled', 'refunded'));

drop policy if exists subscription_payments_owner_insert on public.subscription_payments;
create policy subscription_payments_owner_insert on public.subscription_payments for insert to authenticated
  with check (public.est_proprietaire_du_business(business_id));

drop function if exists public.activer_abonnement(text, text, text);

create or replace function public.activer_abonnement(
  p_reference_interne text,
  p_fournisseur_sale_id text,
  p_fournisseur_payment_id text,
  p_methode_paiement text,
  p_fournisseur_gateway text,
  p_montant_paye numeric,
  p_devise_payee text,
  p_webhook_delivery_id text,
  p_payload_fournisseur jsonb
) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  paiement public.subscription_payments%rowtype;
  debut_periode timestamptz;
begin
  select * into paiement from public.subscription_payments
  where reference_interne = p_reference_interne
    and statut = 'pending'
  for update;

  if not found then
    return exists (
      select 1 from public.subscription_payments
      where fournisseur_sale_id = p_fournisseur_sale_id and statut = 'successful'
    );
  end if;

  debut_periode := greatest(now(), coalesce((
    select max(periode_fin) from public.subscription_payments
    where business_id = paiement.business_id and statut = 'successful'
  ), now()));

  update public.subscription_payments
  set statut = 'successful',
      fournisseur = 'chariow',
      fournisseur_sale_id = p_fournisseur_sale_id,
      fournisseur_payment_id = p_fournisseur_payment_id,
      fournisseur_transaction_id = p_fournisseur_payment_id,
      methode_paiement = p_methode_paiement,
      fournisseur_gateway = p_fournisseur_gateway,
      montant_paye = p_montant_paye,
      devise_payee = p_devise_payee,
      webhook_delivery_id = p_webhook_delivery_id,
      payload_fournisseur = p_payload_fournisseur,
      periode_debut = debut_periode,
      periode_fin = debut_periode + interval '1 month',
      updated_at = now()
  where id = paiement.id;

  update public.businesses
  set plan = 'active'
  where id = paiement.business_id;

  return true;
end;
$$;

revoke all on function public.activer_abonnement(text, text, text, text, text, numeric, text, text, jsonb) from public;

create or replace function public.business_est_accessible(p_business_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.businesses b
    where b.id = p_business_id
      and (
        (b.plan = 'trial' and b.trial_ends_at > now())
        or (
          b.plan = 'active'
          and exists (
            select 1 from public.subscription_payments sp
            where sp.business_id = b.id
              and sp.statut = 'successful'
              and sp.periode_fin > now()
          )
        )
      )
  );
$$;

create or replace function public.obtenir_business_public(p_slug text)
returns table (id uuid, nom text, slug text, description text, logo_url text)
language sql stable security definer set search_path = public as $$
  select b.id, b.nom, b.slug, b.description, b.logo_url
  from public.businesses b
  where b.slug = p_slug and public.business_est_accessible(b.id);
$$;

create or replace function public.lister_services_publics(p_slug text)
returns table (id uuid, nom text, description text, prix numeric, duree_minutes integer)
language sql stable security definer set search_path = public as $$
  select s.id, s.nom, s.description, s.prix, s.duree_minutes
  from public.services s
  join public.businesses b on b.id = s.business_id
  where b.slug = p_slug and public.business_est_accessible(b.id)
    and s.actif and (s.date_fin is null or s.date_fin >= now())
  order by s.created_at;
$$;

drop view if exists public.public_business_info;
create view public.public_business_info with (security_invoker = true) as
  select id, nom, slug, description, logo_url, fuseau_horaire
  from public.businesses
  where public.business_est_accessible(id);

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
  where slug = p_slug and public.business_est_accessible(id);
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
  where slug = p_slug and public.business_est_accessible(id);
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
end;
$$;