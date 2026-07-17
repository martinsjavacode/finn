-- Templates de lançamentos recorrentes
create table recurring_templates (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  amount numeric(10,2) not null,
  type text not null check (type in ('expense', 'income')),
  target text not null check (target in ('transaction', 'credit_card')),
  category uuid references categories(id),
  card text,
  owner text not null default 'personal',
  day int not null default 1,
  active boolean not null default true,
  created_at timestamptz default now()
);

alter table recurring_templates enable row level security;
create policy "Auth read" on recurring_templates for select using (auth.role() = 'authenticated');
create policy "Auth insert" on recurring_templates for insert with check (auth.role() = 'authenticated');
create policy "Auth update" on recurring_templates for update using (auth.role() = 'authenticated');
create policy "Auth delete" on recurring_templates for delete using (auth.role() = 'authenticated');

-- Função para gerar lançamentos de um mês a partir dos templates
create or replace function generate_recurring(target_month date)
returns void as $$
declare
  tpl record;
  m date;
begin
  for tpl in select * from recurring_templates where active = true loop
    m := target_month + ((tpl.day - 1) * interval '1 day');

    if tpl.target = 'transaction' then
      if not exists (
        select 1 from transactions
        where description = tpl.description and month = m and owner = tpl.owner
      ) then
        insert into transactions (month, category, description, amount, type, owner, paid)
        values (m, tpl.category, tpl.description, tpl.amount, tpl.type, tpl.owner, false);
      end if;
    else
      if not exists (
        select 1 from credit_cards
        where description = tpl.description and month = m and owner = tpl.owner
      ) then
        insert into credit_cards (month, card, description, amount, owner)
        values (m, tpl.card, tpl.description, tpl.amount, tpl.owner);
      end if;
    end if;
  end loop;
end;
$$ language plpgsql;
