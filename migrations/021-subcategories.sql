alter table categories add column parent_id uuid references categories(id) on delete cascade;
