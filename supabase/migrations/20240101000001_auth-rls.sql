-- RLS: leitura apenas para autenticados
drop policy if exists "Public read" on transactions;
drop policy if exists "Public read" on credit_cards;

create policy "Auth read" on transactions for select using (auth.role() = 'authenticated');
create policy "Auth read" on credit_cards for select using (auth.role() = 'authenticated');
