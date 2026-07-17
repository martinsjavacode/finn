-- Tabela de roles
create table roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz default now()
);

-- Tabela de permissões
create table permissions (
  id uuid primary key default gen_random_uuid(),
  resource text not null,
  action text not null check (action in ('read', 'create', 'update', 'delete')),
  created_at timestamptz default now(),
  unique(resource, action)
);

-- Relação role <-> permissions (N:N)
create table role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- RLS
alter table roles enable row level security;
alter table permissions enable row level security;
alter table role_permissions enable row level security;

create policy "Auth read" on roles for select using (auth.role() = 'authenticated');
create policy "Auth read" on permissions for select using (auth.role() = 'authenticated');
create policy "Auth read" on role_permissions for select using (auth.role() = 'authenticated');

-- Seed: roles padrão
insert into roles (name, description) values
  ('owner', 'Acesso total + gerenciamento de usuários'),
  ('editor', 'CRUD completo de lançamentos'),
  ('viewer', 'Somente leitura');

-- Seed: permissões
insert into permissions (resource, action) values
  ('transactions', 'read'),
  ('transactions', 'create'),
  ('transactions', 'update'),
  ('transactions', 'delete'),
  ('credit_cards', 'read'),
  ('credit_cards', 'create'),
  ('credit_cards', 'update'),
  ('credit_cards', 'delete'),
  ('recurring_templates', 'read'),
  ('recurring_templates', 'create'),
  ('recurring_templates', 'update'),
  ('recurring_templates', 'delete'),
  ('budgets', 'read'),
  ('budgets', 'create'),
  ('budgets', 'update'),
  ('budgets', 'delete'),
  ('categories', 'read'),
  ('categories', 'create'),
  ('categories', 'update'),
  ('categories', 'delete'),
  ('cards', 'read'),
  ('cards', 'create'),
  ('cards', 'update'),
  ('cards', 'delete'),
  ('users', 'read'),
  ('users', 'create'),
  ('users', 'update'),
  ('users', 'delete');

-- Atribuir permissões aos roles
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p where r.name = 'owner';

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.name = 'editor' and p.resource != 'users';

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.name = 'viewer' and p.action = 'read';

-- Renomear access_control para users
alter table access_control rename to users;

-- Adicionar role_id e remover campo role texto
alter table users add column role_id uuid references roles(id);
update users set role_id = (select id from roles where name = users.role);
alter table users alter column role_id set not null;
alter table users drop column role;

-- RLS para users (manter policies existentes renomeando)
drop policy if exists "Anon check email" on users;
drop policy if exists "Auth insert" on users;
drop policy if exists "Auth update" on users;
drop policy if exists "Auth delete" on users;

create policy "Anon check email" on users for select using (true);
create policy "Auth insert" on users for insert with check (auth.role() = 'authenticated');
create policy "Auth update" on users for update using (auth.role() = 'authenticated');
create policy "Auth delete" on users for delete using (auth.role() = 'authenticated');
