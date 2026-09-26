-- ============================================================
-- Tabela de negociações de fatura de cartão
-- ============================================================
create table invoice_negotiations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  card text not null,
  total_amount numeric(10,2) not null,
  installments int not null check (installments >= 2 and installments <= 24),
  first_month date not null,
  created_at timestamptz default now(),
  foreign key (account_id, card) references cards(account_id, name)
);

alter table invoice_negotiations enable row level security;

-- ============================================================
-- Tabela de faturas incluídas na negociação
-- ============================================================
create table negotiated_invoices (
  id uuid primary key default gen_random_uuid(),
  negotiation_id uuid not null references invoice_negotiations(id) on delete cascade,
  card text not null,
  month date not null,
  unique(negotiation_id, card, month)
);

alter table negotiated_invoices enable row level security;

-- ============================================================
-- Adicionar FK em entries para rastrear parcelas de negociação
-- ============================================================
alter table entries add column negotiation_id uuid references invoice_negotiations(id) on delete cascade;

-- ============================================================
-- Trigger para gerar parcelas da negociação
-- ============================================================
create or replace function generate_negotiation_installments()
returns trigger as $$
declare
  i int;
  installment_amount numeric(10,2);
  target_month date;
begin
  installment_amount := round(NEW.total_amount / NEW.installments, 2);

  for i in 1..NEW.installments loop
    target_month := NEW.first_month + ((i - 1) * interval '1 month');
    
    insert into entries (
      month, description, amount, payment_method, type, 
      card, account_id, paid, current_installment, 
      total_installments, negotiation_id
    ) values (
      target_month,
      'Parcela negociação ' || to_char(NEW.created_at, 'DD/MM/YYYY'),
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

create trigger trg_generate_negotiation_installments
  after insert on invoice_negotiations
  for each row
  execute function generate_negotiation_installments();

-- ============================================================
-- RLS Policies - invoice_negotiations
-- ============================================================
create policy "Account read" on invoice_negotiations for select using (
  is_superadmin() or has_account_permission(account_id, 'transactions', 'read')
);

create policy "Account insert" on invoice_negotiations for insert with check (
  has_account_permission(account_id, 'transactions', 'create')
);

create policy "Account delete" on invoice_negotiations for delete using (
  has_account_permission(account_id, 'transactions', 'delete')
);

-- ============================================================
-- RLS Policies - negotiated_invoices
-- ============================================================
create policy "Account read" on negotiated_invoices for select using (
  exists (
    select 1 from invoice_negotiations n 
    where n.id = negotiation_id 
    and (is_superadmin() or has_account_permission(n.account_id, 'transactions', 'read'))
  )
);

create policy "Account insert" on negotiated_invoices for insert with check (
  exists (
    select 1 from invoice_negotiations n 
    where n.id = negotiation_id 
    and has_account_permission(n.account_id, 'transactions', 'create')
  )
);

-- ============================================================
-- Índices para performance
-- ============================================================
create index idx_invoice_negotiations_account on invoice_negotiations(account_id);
create index idx_invoice_negotiations_card on invoice_negotiations(card);
create index idx_negotiated_invoices_negotiation on negotiated_invoices(negotiation_id);
create index idx_negotiated_invoices_card_month on negotiated_invoices(card, month);
create index idx_entries_negotiation on entries(negotiation_id) where negotiation_id is not null;
