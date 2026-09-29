-- ============================================================
-- Adicionar campo down_payment (entrada) em invoice_negotiations
-- ============================================================

-- 1. Adicionar coluna down_payment (nullable, default 0)
alter table invoice_negotiations 
  add column down_payment numeric(10,2) not null default 0;

-- 2. Atualizar trigger para gerar parcelas com valor correto
-- O valor da parcela agora é: (total_amount - down_payment) / installments
create or replace function generate_negotiation_installments()
returns trigger as $$
declare
  i int;
  installment_amount numeric(10,2);
  target_month date;
  created_date text;
  amount_to_parcel numeric(10,2);
begin
  -- Calcula o valor a ser parcelado (total menos entrada)
  amount_to_parcel := NEW.total_amount - coalesce(NEW.down_payment, 0);
  installment_amount := round(amount_to_parcel / NEW.installments, 2);
  
  -- Format date in Brazil timezone
  created_date := to_char(NEW.created_at at time zone 'America/Sao_Paulo', 'DD/MM/YYYY');

  for i in 1..NEW.installments loop
    target_month := NEW.first_month + ((i - 1) * interval '1 month');
    
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
