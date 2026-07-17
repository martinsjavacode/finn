-- Enums
create type payment_method as enum ('pix', 'boleto', 'credit_card');
create type entry_type as enum ('expense', 'income');

-- Tabela unificada
create table entries (
  id uuid primary key default gen_random_uuid(),
  month date not null,
  description text not null,
  amount numeric(10,2) not null,
  payment_method payment_method not null,
  type entry_type not null default 'expense',
  category uuid references categories(id),
  card text references cards(name),
  owner text not null default 'personal',
  paid boolean not null default false,
  current_installment int,
  total_installments int,
  installment_purchase_id uuid references installment_purchases(id) on delete cascade,
  created_at timestamptz default now()
);

-- Migrar dados de transactions
insert into entries (id, month, description, amount, payment_method, type, category, card, owner, paid, current_installment, total_installments, installment_purchase_id, created_at)
select id, month, description, amount, 'boleto'::payment_method, type::entry_type, category, null, owner, paid, current_installment, total_installments, installment_purchase_id, created_at
from transactions;

-- Migrar dados de credit_cards
insert into entries (id, month, description, amount, payment_method, type, category, card, owner, paid, current_installment, total_installments, installment_purchase_id, created_at)
select id, month, description, amount, 'credit_card'::payment_method, 'expense'::entry_type, category, card, owner, false, current_installment, total_installments, installment_purchase_id, created_at
from credit_cards;

-- RLS
alter table entries enable row level security;
create policy "Auth read" on entries for select using (auth.role() = 'authenticated');
create policy "Auth insert" on entries for insert with check (auth.role() = 'authenticated');
create policy "Auth update" on entries for update using (auth.role() = 'authenticated');
create policy "Auth delete" on entries for delete using (auth.role() = 'authenticated');

-- Atualizar trigger de parcelamentos
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
    insert into entries (month, description, amount, payment_method, type, category, card, owner, paid, current_installment, total_installments, installment_purchase_id)
    values (target_month, NEW.description, installment_amount, NEW.target::payment_method, 'expense', NEW.category, NEW.card, NEW.owner, false, i, NEW.installments, NEW.id);
  end loop;

  return NEW;
end;
$$ language plpgsql;

-- Atualizar função de recorrentes
create or replace function generate_recurring(target_month date)
returns void as $$
declare
  tpl record;
  m date;
begin
  for tpl in select * from recurring_templates where active = true loop
    m := target_month + ((tpl.day - 1) * interval '1 day');
    if not exists (
      select 1 from entries
      where description = tpl.description and month = m and owner = tpl.owner
    ) then
      insert into entries (month, description, amount, payment_method, type, category, card, owner, paid)
      values (m, tpl.description, tpl.amount, tpl.target::payment_method, tpl.type::entry_type, tpl.category, tpl.card, tpl.owner, false);
    end if;
  end loop;
end;
$$ language plpgsql;

-- Atualizar RPC de projeção
create or replace function get_projection(months_ahead int default 6)
returns table(month text, recurring numeric, installments numeric) as $$
declare
  monthly_recurring numeric;
  i int;
  target_start date;
  target_end date;
  inst_total numeric;
begin
  select coalesce(sum(amount), 0) into monthly_recurring
  from recurring_templates where active = true and type = 'expense';

  for i in 0..(months_ahead - 1) loop
    target_start := date_trunc('month', current_date) + (i * interval '1 month');
    target_end := target_start + interval '1 month';

    select coalesce(sum(amount), 0) into inst_total
    from entries where month >= target_start and month < target_end and total_installments is not null;

    month := to_char(target_start, 'YYYY-MM');
    recurring := monthly_recurring;
    installments := inst_total;
    return next;
  end loop;
end;
$$ language plpgsql;

-- Dropar tabelas antigas
drop table if exists transactions cascade;
drop table if exists credit_cards cascade;
