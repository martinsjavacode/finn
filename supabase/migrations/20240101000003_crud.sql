-- Policies de insert/delete/update para autenticados
create policy "Auth insert" on transactions for insert with check (auth.role() = 'authenticated');
create policy "Auth delete" on transactions for delete using (auth.role() = 'authenticated');
create policy "Auth update" on transactions for update using (auth.role() = 'authenticated');

create policy "Auth insert" on credit_cards for insert with check (auth.role() = 'authenticated');
create policy "Auth delete" on credit_cards for delete using (auth.role() = 'authenticated');
create policy "Auth update" on credit_cards for update using (auth.role() = 'authenticated');
