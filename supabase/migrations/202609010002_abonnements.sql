create table if not exists public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  flutterwave_tx_ref text not null unique,
  flutterwave_transaction_id text unique,
  montant numeric(12, 2) not null check (montant > 0),
  devise text not null default 'USD' check (devise in ('USD', 'CDF')),
  statut text not null default 'pending' check (statut in ('pending', 'successful', 'failed', 'cancelled')),
  methode_paiement text,
  periode_debut timestamptz,
  periode_fin timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscription_payments_business_created_idx
  on public.subscription_payments (business_id, created_at desc);

alter table public.subscription_payments enable row level security;

drop policy if exists subscription_payments_owner_select on public.subscription_payments;
create policy subscription_payments_owner_select on public.subscription_payments for select to authenticated
  using (public.est_proprietaire_du_business(business_id));

create or replace function public.activer_abonnement(
  p_tx_ref text,
  p_flutterwave_transaction_id text,
  p_methode_paiement text
) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  paiement public.subscription_payments%rowtype;
  debut_periode timestamptz;
begin
  select * into paiement from public.subscription_payments
  where flutterwave_tx_ref = p_tx_ref and statut = 'pending'
  for update;
  if not found then return false; end if;

  debut_periode := greatest(now(), coalesce((
    select max(periode_fin) from public.subscription_payments
    where business_id = paiement.business_id and statut = 'successful'
  ), now()));

  update public.subscription_payments
  set statut = 'successful',
      flutterwave_transaction_id = p_flutterwave_transaction_id,
      methode_paiement = p_methode_paiement,
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

revoke all on function public.activer_abonnement(text, text, text) from public;
