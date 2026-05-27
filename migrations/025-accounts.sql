-- ============================================================
-- Tabela de contas
-- ============================================================
create table accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#6366f1',
  created_at timestamptz default now()
);

alter table accounts enable row level security;

-- ============================================================
-- Membros de conta (RBAC por conta)
-- ============================================================
create table account_members (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role_id uuid not null references roles(id),
  created_at timestamptz default now(),
  unique(account_id, user_id)
);

alter table account_members enable row level security;

-- ============================================================
-- Superadmin flag
-- ============================================================
alter table users add column is_superadmin boolean not null default false;

-- ============================================================
-- Adicionar account_id nas tabelas scoped
-- ============================================================
alter table entries add column account_id uuid references accounts(id);
alter table budgets add column account_id uuid references accounts(id);
alter table recurring_templates add column account_id uuid references accounts(id);
alter table installment_purchases add column account_id uuid references accounts(id);
alter table card_invoices add column account_id uuid references accounts(id);

-- ============================================================
-- Migrar dados: criar contas a partir dos owners existentes
-- ============================================================
insert into accounts (id, name, color) values
  ('00000000-0000-0000-0000-000000000001', 'Pessoal', '#22c55e'),
  ('00000000-0000-0000-0000-000000000002', 'Sogra', '#f43f5e');

-- Mapear entries
update entries set account_id = '00000000-0000-0000-0000-000000000001' where owner = 'personal';
update entries set account_id = '00000000-0000-0000-0000-000000000002' where owner = 'mother_in_law';

-- Mapear recurring_templates
update recurring_templates set account_id = '00000000-0000-0000-0000-000000000001' where owner = 'personal';
update recurring_templates set account_id = '00000000-0000-0000-0000-000000000002' where owner = 'mother_in_law';

-- Mapear installment_purchases
update installment_purchases set account_id = '00000000-0000-0000-0000-000000000001' where owner = 'personal';
update installment_purchases set account_id = '00000000-0000-0000-0000-000000000002' where owner = 'mother_in_law';

-- Budgets e card_invoices não tinham owner, atribuir à conta pessoal
update budgets set account_id = '00000000-0000-0000-0000-000000000001';
update card_invoices set account_id = '00000000-0000-0000-0000-000000000001';

-- ============================================================
-- Tornar account_id NOT NULL após migração
-- ============================================================
alter table entries alter column account_id set not null;
alter table budgets alter column account_id set not null;
alter table recurring_templates alter column account_id set not null;
alter table installment_purchases alter column account_id set not null;
alter table card_invoices alter column account_id set not null;

-- ============================================================
-- Remover coluna owner (substituída por account_id)
-- ============================================================
alter table entries drop column owner;
alter table recurring_templates drop column owner;
alter table installment_purchases drop column owner;

-- ============================================================
-- Marcar primeiro usuário como superadmin + dar acesso às contas
-- ============================================================
update users set is_superadmin = true
where email = (select email from users order by created_at limit 1);

-- Dar acesso owner a todas as contas para o superadmin
insert into account_members (account_id, user_id, role_id)
select a.id, u.id, (select id from roles where name = 'owner')
from accounts a, users u
where u.is_superadmin = true;

-- ============================================================
-- Remover role_id global de users (RBAC agora é por conta)
-- ============================================================
alter table users drop column role_id;

-- ============================================================
-- Atualizar constraint unique de budgets (agora por conta)
-- ============================================================
alter table budgets drop constraint if exists budgets_category_key;
alter table budgets add constraint budgets_account_category_key unique(account_id, category);

-- ============================================================
-- Atualizar constraint unique de card_invoices (agora por conta)
-- ============================================================
alter table card_invoices drop constraint if exists card_invoices_card_month_key;
alter table card_invoices add constraint card_invoices_account_card_month_key unique(account_id, card, month);

-- ============================================================
-- Atualizar funções RPC para receber account_id
-- ============================================================
create or replace function generate_recurring(target_month date, p_account_id uuid)
returns void as $$
declare
  tpl record;
  m date;
begin
  for tpl in select * from recurring_templates where active = true and account_id = p_account_id loop
    m := target_month + ((tpl.day - 1) * interval '1 day');
    if not exists (
      select 1 from entries
      where description = tpl.description and month = m and account_id = p_account_id
    ) then
      insert into entries (month, description, amount, payment_method, type, category, card, account_id, paid)
      values (m, tpl.description, tpl.amount, tpl.target::payment_method, tpl.type::entry_type, tpl.category, tpl.card, p_account_id, false);
    end if;
  end loop;
end;
$$ language plpgsql;

create or replace function get_projection(months_ahead int default 6, p_account_id uuid default null)
returns table(month text, recurring numeric, installments numeric) as $$
declare
  monthly_recurring numeric;
  i int;
  target_start date;
  target_end date;
  inst_total numeric;
begin
  select coalesce(sum(amount), 0) into monthly_recurring
  from recurring_templates where active = true and type = 'expense'
    and (p_account_id is null or account_id = p_account_id);

  for i in 0..(months_ahead - 1) loop
    target_start := date_trunc('month', current_date) + (i * interval '1 month');
    target_end := target_start + interval '1 month';

    select coalesce(sum(amount), 0) into inst_total
    from entries where month >= target_start and month < target_end and total_installments is not null
      and (p_account_id is null or account_id = p_account_id);

    month := to_char(target_start, 'YYYY-MM');
    recurring := monthly_recurring;
    installments := inst_total;
    return next;
  end loop;
end;
$$ language plpgsql;

-- Atualizar trigger de parcelamentos para usar account_id
create or replace function generate_installments()
returns trigger as $$
declare
  i int;
  installment_amount numeric(10,2);
  target_month date;
begin
  installment_amount := round(NEW.total_amount / NEW.installments, 2);

  for i in 1..NEW.installments loop
    target_month := NEW.start_month + ((i - 1) * interval '1 month');
    insert into entries (month, description, amount, payment_method, type, category, card, account_id, paid, current_installment, total_installments, installment_purchase_id)
    values (target_month, NEW.description, installment_amount, NEW.target::payment_method, 'expense', NEW.category, NEW.card, NEW.account_id, false, i, NEW.installments, NEW.id);
  end loop;

  return NEW;
end;
$$ language plpgsql;
