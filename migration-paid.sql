alter table transactions add column paid boolean not null default false;

-- Permitir update para autenticados
create policy "Auth update" on transactions for update using (auth.role() = 'authenticated');
