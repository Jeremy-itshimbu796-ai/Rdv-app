-- La table reminder_logs en production avait encore l'ancien nom de colonne "type"
-- (issu d'un schema anterieur aux migrations de ce depot), alors que
-- creer_reservation_publique() et l'Edge Function send-reminders utilisent "type_rappel".
-- Consequence en prod : chaque reservation publique echouait avec
-- "column \"type_rappel\" of relation \"reminder_logs\" does not exist".
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reminder_logs' and column_name = 'type'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reminder_logs' and column_name = 'type_rappel'
  ) then
    alter table public.reminder_logs rename column type to type_rappel;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'reminder_logs_type_rappel_check'
  ) then
    alter table public.reminder_logs
      add constraint reminder_logs_type_rappel_check
      check (type_rappel in ('confirmation', '24h', '1h'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'reminder_logs_appointment_id_type_rappel_key'
  ) then
    alter table public.reminder_logs
      add constraint reminder_logs_appointment_id_type_rappel_key
      unique (appointment_id, type_rappel);
  end if;
end $$;
