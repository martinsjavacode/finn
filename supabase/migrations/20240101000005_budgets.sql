create table budgets (
  id uuid primary key default gen_random_uuid(),
  category uuid not null references categories(id),
  monthly_limit numeric(10,2) not null,
  created_at timestamptz default now(),
  unique(category)
);

alter table budgets enable row level security;
create policy "Auth read" on budgets for select using (auth.role() = 'authenticated');
create policy "Auth insert" on budgets for insert with check (auth.role() = 'authenticated');
create policy "Auth update" on budgets for update using (auth.role() = 'authenticated');
create policy "Auth delete" on budgets for delete using (auth.role() = 'authenticated');
