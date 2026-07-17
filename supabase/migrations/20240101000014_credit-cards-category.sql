-- Adicionar categoria em credit_cards
alter table credit_cards add column category uuid references categories(id);

-- Atualizar trigger para propagar categoria nas parcelas de cartão
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
      insert into credit_cards (month, card, description, amount, current_installment, total_installments, owner, category)
      values (target_month, NEW.card, NEW.description, installment_amount, i, NEW.installments, NEW.owner, NEW.category);
    else
      insert into transactions (month, category, description, amount, type, owner, paid, current_installment, total_installments)
      values (target_month, NEW.category, NEW.description, installment_amount, 'expense', NEW.owner, false, i, NEW.installments);
    end if;
  end loop;

  return NEW;
end;
$$ language plpgsql;
