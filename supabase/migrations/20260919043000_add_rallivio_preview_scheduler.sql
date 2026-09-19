create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.validate_rallivio_scheduler_token(candidate text)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select candidate is not null
    and exists (
      select 1
      from vault.decrypted_secrets
      where name = 'rallivio_scheduler_token'
        and decrypted_secret = candidate
    );
$$;

revoke execute on function public.validate_rallivio_scheduler_token(text) from public, anon, authenticated;
grant execute on function public.validate_rallivio_scheduler_token(text) to service_role;

do $$
declare
  token text;
begin
  if not exists (
    select 1
    from vault.secrets
    where name = 'rallivio_scheduler_token'
  ) then
    token := encode(gen_random_bytes(32), 'hex');
    perform vault.create_secret(
      token,
      'rallivio_scheduler_token',
      'Private scheduler token for RALLIVIO preview acquisition jobs'
    );
  end if;
end
$$;

select cron.schedule(
  'rallivio-preview-acquire',
  '0 */6 * * *',
  $job$
  select net.http_post(
    url := 'https://rallivio-git-feature-creator-platform-subscription-san-eca6.vercel.app/api/cron/acquire',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization',
      'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'rallivio_scheduler_token')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  ) as request_id;
  $job$
);

select cron.schedule(
  'rallivio-preview-refresh',
  '15 * * * *',
  $job$
  select net.http_post(
    url := 'https://rallivio-git-feature-creator-platform-subscription-san-eca6.vercel.app/api/cron/refresh',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization',
      'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'rallivio_scheduler_token')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  ) as request_id;
  $job$
);

select cron.schedule(
  'rallivio-preview-signals',
  '30 * * * *',
  $job$
  select net.http_post(
    url := 'https://rallivio-git-feature-creator-platform-subscription-san-eca6.vercel.app/api/cron/signals',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization',
      'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'rallivio_scheduler_token')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  ) as request_id;
  $job$
);
