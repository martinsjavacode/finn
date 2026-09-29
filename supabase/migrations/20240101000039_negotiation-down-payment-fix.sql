-- ============================================================
-- Ajustar trigger: entrada no first_month, parcelas nos meses seguintes
-- ============================================================

create or replace function generate_negotiation_installments()
returns trigger as $$
declare
  i int;
  installment_amount numeric(10,2);
  target_month date;
  created_date text;
  amount_to_parcel numeric(10,2);
  parcels_start_month date;
begin
  -- Format date in Brazil timezone
  created_date := to_char(NEW.created_at at time zone 'America/Sao_Paulo', 'DD/MM/YYYY');

  -- Se tem entrada, cria lançamento da entrada no first_month
  if coalesce(NEW.down_payment, 0) > 0 then
    insert into entries (
      month, description, amount, payment_method, type, 
      card, account_id, paid, current_installment, 
      total_installments, negotiation_id
    ) values (
      NEW.first_month,
      'Entrada negociação ' || created_date,
      NEW.down_payment,
      'credit_card',
      'expense',
      NEW.card,
      NEW.account_id,
      false,
      null,  -- entrada não tem número de parcela
      null,
      NEW.id
    );
    -- Parcelas começam no mês seguinte
    parcels_start_month := NEW.first_month + interval '1 month';
  else
    -- Sem entrada, parcelas começam no first_month
    parcels_start_month := NEW.first_month;
  end if;

  -- Calcula o valor a ser parcelado (total menos entrada)
  amount_to_parcel := NEW.total_amount - coalesce(NEW.down_payment, 0);
  installment_amount := round(amount_to_parcel / NEW.installments, 2);

  -- Gera as parcelas
  for i in 1..NEW.installments loop
    target_month := parcels_start_month + ((i - 1) * interval '1 month');
    
    insert into entries (
      month, description, amount, payment_method, type, 
      card, account_id, paid, current_installment, 
      total_installments, negotiation_id
    ) values (
      target_month,
      'Parcela negociação ' || created_date,
      installment_amount,
      'credit_card',
      'expense',
      NEW.card,
      NEW.account_id,
      false,
      i,
      NEW.installments,
      NEW.id
    );
  end loop;

  return NEW;
end;
$$ language plpgsql;
