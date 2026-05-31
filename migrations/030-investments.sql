-- Enum para tipo de investimento
create type investment_type as enum ('renda_fixa', 'renda_variavel', 'crypto', 'fii', 'fiagro', 'etf', 'fundo_rf', 'fundo_multi', 'fundo_acoes');

-- Enum para tipo de movimentação
create type investment_tx_type as enum ('aporte', 'resgate', 'rendimento', 'dividendo');

-- Tabela de investimentos (ativos)
create table investments (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id),
  name text not null,
  type investment_type not null,
  broker text,
  current_balance numeric(12,2) not null default 0,
  invested_total numeric(12,2) not null default 0,
  maturity_date date,
  active boolean not null default true,
  created_at timestamptz default now()
);

-- Tabela de movimentações
create table investment_transactions (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references investments(id) on delete cascade,
  account_id uuid not null references accounts(id),
  type investment_tx_type not null,
  amount numeric(12,2) not null,
  date date not null default current_date,
  note text,
  created_at timestamptz default now()
);

-- RLS
alter table investments enable row level security;
alter table investment_transactions enable row level security;

create policy "Account read" on investments for select using (
  is_superadmin() or (account_id in (select user_account_ids()) and has_account_permission(account_id, 'investments', 'read'))
);
create policy "Account insert" on investments for insert with check (
  has_account_permission(account_id, 'investments', 'create')
);
create policy "Account update" on investments for update using (
  has_account_permission(account_id, 'investments', 'update')
);
create policy "Account delete" on investments for delete using (
  has_account_permission(account_id, 'investments', 'delete')
);

create policy "Account read" on investment_transactions for select using (
  is_superadmin() or (account_id in (select user_account_ids()) and has_account_permission(account_id, 'investments', 'read'))
);
create policy "Account insert" on investment_transactions for insert with check (
  has_account_permission(account_id, 'investments', 'create')
);
create policy "Account delete" on investment_transactions for delete using (
  has_account_permission(account_id, 'investments', 'delete')
);

-- Seed: permissão de investimentos
insert into permissions (resource, action) values
  ('investments', 'read'),
  ('investments', 'create'),
  ('investments', 'update'),
  ('investments', 'delete');

-- Dar todas as permissões de investments ao role owner
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.name = 'owner' and p.resource = 'investments';

-- Dar read ao viewer
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.name = 'viewer' and p.resource = 'investments' and p.action = 'read';

-- Dar tudo ao editor
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.name = 'editor' and p.resource = 'investments';
