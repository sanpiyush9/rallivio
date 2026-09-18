alter table public.profiles
  add column if not exists location text,
  add column if not exists primary_category text,
  add column if not exists role text;
