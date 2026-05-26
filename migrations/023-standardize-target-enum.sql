-- Padronizar target → payment_method enum; remover 'boleto' do enum

-- 1. Remover check constraints de target
do $$
declare r record;
begin
  for r in select conname from pg_constraint where conrelid = 'recurring_templates'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%target%' loop
    execute 'alter table recurring_templates drop constraint ' || r.conname;
  end loop;
  for r in select conname from pg_constraint where conrelid = 'installment_purchases'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%target%' loop
    execute 'alter table installment_purchases drop constraint ' || r.conname;
  end loop;
end $$;

-- 2. Desacoplar todas as colunas do enum (converter para text)
alter table entries alter column payment_method type text using payment_method::text;
alter table recurring_templates alter column target type text;
alter table installment_purchases alter column target type text;

-- 3. Dropar enum antigo e recriar
drop type payment_method;
create type payment_method as enum ('pix', 'credit_card');

-- 4. Normalizar dados
update entries set payment_method = 'pix' where payment_method not in ('pix', 'credit_card');
update recurring_templates set target = 'pix' where target not in ('pix', 'credit_card');
update installment_purchases set target = 'pix' where target not in ('pix', 'credit_card');

-- 5. Converter colunas para o enum
alter table entries alter column payment_method type payment_method using payment_method::payment_method;
alter table recurring_templates alter column target type payment_method using target::payment_method;
alter table installment_purchases alter column target type payment_method using target::payment_method;

-- 5. Recriar generate_recurring sem cast
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
      values (m, tpl.description, tpl.amount, tpl.target, tpl.type::entry_type, tpl.category, tpl.card, tpl.owner, false);
    end if;
  end loop;
end;
$$ language plpgsql;

-- 6. Recriar generate_installments sem cast
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
    values (target_month, NEW.description, installment_amount, NEW.target, 'expense', NEW.category, NEW.card, NEW.owner, false, i, NEW.installments, NEW.id);
  end loop;

  return NEW;
end;
$$ language plpgsql;
