create table if not exists public.wfilemanager_pro_subscription_config (
  id boolean primary key default true,
  camerpay_api_base_url text not null default 'https://camerpay.biz',
  camerpay_api_token text not null,
  camerpay_webhook_secret text,
  camerpay_payment_method text not null default 'orange_money',
  mailtrap_api_token text not null,
  mailtrap_api_url text not null default 'https://send.api.mailtrap.io/api/send',
  mailtrap_from_email text not null default 'support@kmerhosting.com',
  mailtrap_from_name text not null default 'KmerHosting',
  site_url text not null default 'https://wfilemanager.kmerhosting.com',
  function_url text not null,
  support_email text not null default 'support@kmerhosting.com',
  price_usd numeric(10,2) not null default 50.00,
  price_xaf integer not null default 30000,
  currency text not null default 'XAF',
  storage_quota_bytes bigint not null default 104857600,
  period_days integer not null default 365,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wfilemanager_pro_subscription_config_singleton check (id = true),
  constraint wfilemanager_pro_subscription_config_price_xaf_positive check (price_xaf > 0),
  constraint wfilemanager_pro_subscription_config_storage_positive check (storage_quota_bytes > 0),
  constraint wfilemanager_pro_subscription_config_period_positive check (period_days > 0)
);

alter table public.wfilemanager_pro_subscription_config enable row level security;

comment on table public.wfilemanager_pro_subscription_config is 'Private wFileManager Pro checkout configuration. Read only by Supabase Edge Functions through the service role.';
comment on column public.wfilemanager_pro_subscription_config.camerpay_api_token is 'CamerPay API token. Do not expose to frontend or public logs.';
comment on column public.wfilemanager_pro_subscription_config.mailtrap_api_token is 'Mailtrap sending token. Do not expose to frontend or public logs.';

create or replace function public.wfilemanager_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists wfilemanager_pro_subscription_config_set_updated_at on public.wfilemanager_pro_subscription_config;
create trigger wfilemanager_pro_subscription_config_set_updated_at
before update on public.wfilemanager_pro_subscription_config
for each row execute function public.wfilemanager_set_updated_at();
