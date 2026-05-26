-- Adicionar referência ao parcelamento original
alter table credit_cards add column installment_purchase_id uuid references installment_purchases(id) on delete cascade;
alter table transactions add column installment_purchase_id uuid references installment_purchases(id) on delete cascade;

-- Atualizar trigger para popular o campo
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
      insert into credit_cards (month, card, description, amount, current_installment, total_installments, owner, category, installment_purchase_id)
      values (target_month, NEW.card, NEW.description, installment_amount, i, NEW.installments, NEW.owner, NEW.category, NEW.id);
    else
      insert into transactions (month, category, description, amount, type, owner, paid, current_installment, total_installments, installment_purchase_id)
      values (target_month, NEW.category, NEW.description, installment_amount, 'expense', NEW.owner, false, i, NEW.installments, NEW.id);
    end if;
  end loop;

  return NEW;
end;
$$ language plpgsql;
