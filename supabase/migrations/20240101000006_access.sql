create table access_control (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null check (role in ('viewer', 'editor')),
  created_at timestamptz default now()
);

alter table access_control enable row level security;
create policy "Anon check email" on access_control for select using (true);
create policy "Auth insert" on access_control for insert with check (auth.role() = 'authenticated');
create policy "Auth update" on access_control for update using (auth.role() = 'authenticated');
create policy "Auth delete" on access_control for delete using (auth.role() = 'authenticated');
