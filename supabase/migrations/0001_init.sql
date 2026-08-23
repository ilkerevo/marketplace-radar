-- Marketplace Radar — Başlangıç migration'ı
-- Supabase Dashboard > SQL Editor içinde tek seferde çalıştırılabilir,
-- ya da `supabase db push` ile CLI üzerinden uygulanabilir.

-- ============================================================
-- 1. EXTENSION
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- 2. TABLOLAR
-- ============================================================

-- USERS
create table public.users (
  id          uuid primary key default uuid_generate_v4(),
  email       text not null unique,
  plan        text not null default 'FREE',
  credits     integer not null default 3,
  created_at  timestamptz not null default now()
);

-- PRODUCTS
create table public.products (
  id             uuid primary key default uuid_generate_v4(),
  marketplace    text not null,
  product_url    text not null,
  title          text not null,
  rating         double precision,
  total_reviews  integer,
  user_id        uuid references public.users(id) on delete cascade,
  created_at     timestamptz not null default now()
);

-- ANALYSES
create table public.analyses (
  id               uuid primary key default uuid_generate_v4(),
  product_id       uuid not null references public.products(id) on delete cascade,
  positive_points  jsonb not null,
  negative_points  jsonb not null,
  frequent_words   jsonb not null,
  buyer_persona    text not null,
  actionable_tips  jsonb not null,
  sentiment_score  double precision not null,
  summary          text not null,
  created_at       timestamptz not null default now()
);

-- PAYMENTS
create table public.payments (
  id                   uuid primary key default uuid_generate_v4(),
  user_id              uuid not null references public.users(id) on delete cascade,
  package_id           text not null,
  credits              integer not null,
  amount               numeric(10,2) not null,
  currency             text not null default 'TRY',
  status               text not null default 'PENDING', -- PENDING | SUCCESS | FAILED
  provider             text not null default 'iyzico',
  provider_payment_id  text,
  conversation_id      text not null unique,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ============================================================
-- 3. İNDEKSLER
-- ============================================================
create index idx_analyses_product_id on public.analyses(product_id);
create index idx_products_marketplace on public.products(marketplace);
create index idx_products_user_id on public.products(user_id);
create index idx_users_email on public.users(email);
create index idx_payments_user_id on public.payments(user_id);
create index idx_payments_conversation_id on public.payments(conversation_id);

-- ============================================================
-- 4. RLS AKTİVASYONU + POLICY'LER
-- ============================================================
alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.analyses enable row level security;
alter table public.payments enable row level security;

-- USERS
create policy "Users can view own record"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own record"
  on public.users for update
  using (auth.uid() = id);

-- PRODUCTS — bilinçli olarak herkese açık SELECT: /analysis/[id]
-- sayfasının login olmadan paylaşılabilir olması viral büyüme
-- stratejisi olarak kararlaştırıldı.
create policy "Anyone can view products"
  on public.products for select
  using (true);

create policy "Authenticated users can insert products"
  on public.products for insert
  to authenticated
  with check (true);

-- ANALYSES — aynı sebeple herkese açık SELECT
create policy "Anyone can view analyses"
  on public.analyses for select
  using (true);

create policy "Authenticated users can insert analyses"
  on public.analyses for insert
  to authenticated
  with check (true);

-- PAYMENTS — sadece sahibi görebilir, insert/update sadece service_role
-- (admin client) üzerinden yapılır, ekstra policy gerekmez çünkü
-- service_role zaten RLS'i bypass eder.
create policy "Users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id);

-- ============================================================
-- 5. FONKSİYONLAR VE TRIGGER'LAR
-- ============================================================

-- Yeni auth.users kaydı oluşunca otomatik public.users satırı oluştur
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Kredi ekleme — atomik, race condition korumalı
create or replace function public.increment_user_credits(p_user_id uuid, p_amount integer)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.users set credits = credits + p_amount where id = p_user_id;
end;
$$;
