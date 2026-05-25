-- Criar tabela de categorias
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  label text not null
);

insert into categories (name, label) values
('house', 'Casa'),
('business', 'Empresa'),
('education', 'Estudos'),
('misc', 'Diversas'),
('leisure', 'Lazer'),
('investment', 'Investimento'),
('spiritual', 'Espiritual');

-- Alterar transactions: trocar check por FK
alter table transactions drop constraint transactions_category_check;
alter table transactions alter column category type uuid using null;
alter table transactions add constraint fk_transactions_category foreign key (category) references categories(id);

-- RLS
alter table categories enable row level security;
create policy "Public read" on categories for select using (true);
create policy "Auth insert" on categories for insert with check (auth.role() = 'authenticated');
create policy "Auth update" on categories for update using (auth.role() = 'authenticated');
create policy "Auth delete" on categories for delete using (auth.role() = 'authenticated');
