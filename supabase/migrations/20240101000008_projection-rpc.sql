-- RPC agregada para projeção futura (elimina N+1 queries)
create or replace function get_projection(months_ahead int default 6)
returns table(month text, recurring numeric, installments numeric) as $$
declare
  monthly_recurring numeric;
  i int;
  target_start date;
  target_end date;
  card_total numeric;
  tx_total numeric;
begin
  -- Total mensal de recorrentes ativos (despesas)
  select coalesce(sum(amount), 0) into monthly_recurring
  from recurring_templates where active = true and type = 'expense';

  for i in 0..(months_ahead - 1) loop
    target_start := date_trunc('month', current_date) + (i * interval '1 month');
    target_end := target_start + interval '1 month';

    -- Parcelas de cartão no mês
    select coalesce(sum(amount), 0) into card_total
    from credit_cards where month >= target_start and month < target_end;

    -- Parcelas de transactions no mês
    select coalesce(sum(amount), 0) into tx_total
    from transactions where month >= target_start and month < target_end and total_installments is not null;

    month := to_char(target_start, 'YYYY-MM');
    recurring := monthly_recurring;
    installments := card_total + tx_total;
    return next;
  end loop;
end;
$$ language plpgsql;
