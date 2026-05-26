-- Rollback: remover paid de credit_cards (caso já tenha rodado a 018)
alter table credit_cards drop column if exists paid;

-- Tabela de faturas de cartão com valor pago
create table card_invoices (
  id uuid primary key default gen_random_uuid(),
  card text not null,
  month date not null,
  paid_amount numeric(10,2) not null default 0,
  created_at timestamptz default now(),
  unique(card, month)
);

alter table card_invoices enable row level security;
create policy "Auth read" on card_invoices for select using (auth.role() = 'authenticated');
create policy "Auth insert" on card_invoices for insert with check (auth.role() = 'authenticated');
create policy "Auth update" on card_invoices for update using (auth.role() = 'authenticated');
create policy "Auth delete" on card_invoices for delete using (auth.role() = 'authenticated');
