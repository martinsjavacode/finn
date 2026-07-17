-- Policies de delete e update para installment_purchases
create policy "Auth delete" on installment_purchases for delete using (auth.role() = 'authenticated');
create policy "Auth update" on installment_purchases for update using (auth.role() = 'authenticated');
