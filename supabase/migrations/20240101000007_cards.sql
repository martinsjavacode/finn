create table cards (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  label text not null,
  credit_limit numeric(10,2) not null default 0,
  closing_day int not null default 1,
  due_day int not null default 10,
  color text default '#667eea',
  active boolean not null default true,
  created_at timestamptz default now()
);

alter table cards enable row level security;
create policy "Auth read" on cards for select using (auth.role() = 'authenticated');
create policy "Auth insert" on cards for insert with check (auth.role() = 'authenticated');
create policy "Auth update" on cards for update using (auth.role() = 'authenticated');
create policy "Auth delete" on cards for delete using (auth.role() = 'authenticated');
