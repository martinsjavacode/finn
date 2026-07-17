-- ============================================================
-- Tabelas base pré-existentes (criadas antes do sistema de migrations)
-- Necessárias para que as migrations incrementais funcionem from scratch
-- ============================================================

-- Tabela de transações (receitas/despesas)
create table transactions (
  id uuid primary key default gen_random_uuid(),
  month date not null,
  description text not null,
  amount numeric(10,2) not null,
  type text not null check (type in ('expense', 'income')),
  category text constraint transactions_category_check check (category in ('house', 'business', 'education', 'misc', 'leisure', 'investment', 'spiritual')),
  owner text not null default 'personal',
  created_at timestamptz default now()
);

alter table transactions enable row level security;
create policy "Public read" on transactions for select using (true);

-- Tabela de lançamentos de cartão de crédito
create table credit_cards (
  id uuid primary key default gen_random_uuid(),
  month date not null,
  card text not null,
  description text not null,
  amount numeric(10,2) not null,
  owner text not null default 'personal',
  current_installment int,
  total_installments int,
  created_at timestamptz default now()
);

alter table credit_cards enable row level security;
create policy "Public read" on credit_cards for select using (true);
