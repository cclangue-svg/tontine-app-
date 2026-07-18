-- ============================================
-- SCHEMA SUPABASE - APP TONTINE
-- À exécuter dans Supabase SQL Editor
-- ============================================

-- Extension pour générer des UUID
create extension if not exists "uuid-ossp";

-- ============================================
-- TABLE: users (profils simples, auth par téléphone)
-- ============================================
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  phone text unique not null,
  name text not null,
  created_at timestamp with time zone default now()
);

-- ============================================
-- TABLE: tontines (groupes)
-- ============================================
create table if not exists tontines (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  organizer_id uuid references users(id) not null,
  contribution_amount numeric not null,
  frequency text not null check (frequency in ('weekly', 'monthly')),
  currency text default 'XAF',
  invite_code text unique not null,
  status text default 'active' check (status in ('active', 'completed', 'archived')),
  payment_number text,
  payment_provider text check (payment_provider in ('airtel_money', 'orange_money', 'autre')),
  created_at timestamp with time zone default now()
);

-- ============================================
-- TABLE: tontine_members (membres d'une tontine + leur ordre de passage)
-- ============================================
create table if not exists tontine_members (
  id uuid primary key default uuid_generate_v4(),
  tontine_id uuid references tontines(id) on delete cascade not null,
  user_id uuid references users(id) not null,
  payout_order integer not null, -- ordre de passage (1, 2, 3...)
  has_received boolean default false, -- a déjà reçu son tour
  joined_at timestamp with time zone default now(),
  unique(tontine_id, user_id),
  unique(tontine_id, payout_order)
);

-- ============================================
-- TABLE: rounds (tours de cotisation, ex: "Tour de Mars 2026")
-- ============================================
create table if not exists rounds (
  id uuid primary key default uuid_generate_v4(),
  tontine_id uuid references tontines(id) on delete cascade not null,
  round_number integer not null,
  beneficiary_member_id uuid references tontine_members(id) not null,
  due_date date not null,
  status text default 'open' check (status in ('open', 'closed')),
  created_at timestamp with time zone default now(),
  unique(tontine_id, round_number)
);

-- ============================================
-- TABLE: contributions (paiements de chaque membre pour un tour)
-- ============================================
create table if not exists contributions (
  id uuid primary key default uuid_generate_v4(),
  round_id uuid references rounds(id) on delete cascade not null,
  member_id uuid references tontine_members(id) not null,
  amount numeric not null,
  paid boolean default false,
  paid_at timestamp with time zone,
  payment_method text, -- 'airtel_money', 'orange_money', 'cash'
  marked_by uuid references users(id), -- organisateur qui a confirmé
  created_at timestamp with time zone default now(),
  unique(round_id, member_id)
);

-- ============================================
-- TABLE: transactions (grand livre - ledger immuable)
-- ============================================
create table if not exists transactions (
  id uuid primary key default uuid_generate_v4(),
  tontine_id uuid references tontines(id) on delete cascade not null,
  round_id uuid references rounds(id),
  type text not null check (type in ('deposit', 'disbursement')),
  amount numeric not null,
  member_id uuid references tontine_members(id), -- qui a déposé / qui reçoit
  performed_by uuid references users(id) not null, -- qui a déclenché l'action
  note text,
  created_at timestamp with time zone default now()
);

create index if not exists idx_transactions_tontine on transactions(tontine_id);

alter table transactions enable row level security;
create policy "allow all transactions" on transactions for all using (true) with check (true);

-- ============================================
-- INDEXES pour perf
-- ============================================
create index if not exists idx_tontine_members_tontine on tontine_members(tontine_id);
create index if not exists idx_rounds_tontine on rounds(tontine_id);
create index if not exists idx_contributions_round on contributions(round_id);

-- ============================================
-- RLS (Row Level Security) - à activer en prod
-- ============================================
alter table users enable row level security;
alter table tontines enable row level security;
alter table tontine_members enable row level security;
alter table rounds enable row level security;
alter table contributions enable row level security;

-- Policies permissives pour le MVP (à restreindre plus tard)
create policy "allow all users" on users for all using (true) with check (true);
create policy "allow all tontines" on tontines for all using (true) with check (true);
create policy "allow all tontine_members" on tontine_members for all using (true) with check (true);
create policy "allow all rounds" on rounds for all using (true) with check (true);
create policy "allow all contributions" on contributions for all using (true) with check (true);
