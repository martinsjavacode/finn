-- Adicionar colunas de parcela e status em transactions
alter table transactions add column current_installment int;
alter table transactions add column total_installments int;
alter table transactions add column paid boolean not null default false;

-- Tabela mestre de compras parceladas
create table installment_purchases (
  id uuid primary key default gen_random_uuid(),
  start_month date not null,
  description text not null,
  total_amount numeric(10,2) not null,
  installments int not null check (installments >= 2),
  owner text not null default 'personal',
  target text not null check (target in ('credit_card', 'transaction')),
  card text,
  category uuid references categories(id),
  created_at timestamptz default now()
);

alter table installment_purchases enable row level security;
create policy "Auth read" on installment_purchases for select using (auth.role() = 'authenticated');
create policy "Auth insert" on installment_purchases for insert with check (auth.role() = 'authenticated');

-- Função que distribui as parcelas
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

    if NEW.target = 'credit_card' then
      insert into credit_cards (month, card, description, amount, current_installment, total_installments, owner)
      values (target_month, NEW.card, NEW.description, installment_amount, i, NEW.installments, NEW.owner);
    else
      insert into transactions (month, category, description, amount, type, owner, paid, current_installment, total_installments)
      values (target_month, NEW.category, NEW.description, installment_amount, 'expense', NEW.owner, false, i, NEW.installments);
    end if;
  end loop;

  return NEW;
end;
$$ language plpgsql;

create trigger trg_generate_installments
  after insert on installment_purchases
  for each row
  execute function generate_installments();
