-- ============================================================
-- Helper: verifica se o usuário é superadmin
-- ============================================================
create or replace function is_superadmin()
returns boolean as $$
  select exists (
    select 1 from users
    where email = auth.jwt()->>'email' and is_superadmin = true
  );
$$ language sql security definer stable;

-- ============================================================
-- Helper: verifica permissão por conta
-- ============================================================
create or replace function has_account_permission(p_account_id uuid, p_resource text, p_action text)
returns boolean as $$
  select is_superadmin() or exists (
    select 1
    from account_members am
    join users u on u.id = am.user_id
    join role_permissions rp on rp.role_id = am.role_id
    join permissions p on p.id = rp.permission_id
    where u.email = auth.jwt()->>'email'
      and am.account_id = p_account_id
      and p.resource = p_resource
      and p.action = p_action
  );
$$ language sql security definer stable;

-- ============================================================
-- Helper: retorna IDs de contas que o usuário pode ler
-- ============================================================
create or replace function user_account_ids()
returns setof uuid as $$
  select am.account_id
  from account_members am
  join users u on u.id = am.user_id
  where u.email = auth.jwt()->>'email';
$$ language sql security definer stable;

-- ============================================================
-- Drop old policies (from 024)
-- ============================================================
drop policy if exists "RBAC read" on entries;
drop policy if exists "RBAC insert" on entries;
drop policy if exists "RBAC update" on entries;
drop policy if exists "RBAC delete" on entries;

drop policy if exists "RBAC read" on categories;
drop policy if exists "RBAC insert" on categories;
drop policy if exists "RBAC update" on categories;
drop policy if exists "RBAC delete" on categories;

drop policy if exists "RBAC read" on cards;
drop policy if exists "RBAC insert" on cards;
drop policy if exists "RBAC update" on cards;
drop policy if exists "RBAC delete" on cards;

drop policy if exists "RBAC read" on recurring_templates;
drop policy if exists "RBAC insert" on recurring_templates;
drop policy if exists "RBAC update" on recurring_templates;
drop policy if exists "RBAC delete" on recurring_templates;

drop policy if exists "RBAC read" on budgets;
drop policy if exists "RBAC insert" on budgets;
drop policy if exists "RBAC update" on budgets;
drop policy if exists "RBAC delete" on budgets;

drop policy if exists "RBAC read" on installment_purchases;
drop policy if exists "RBAC insert" on installment_purchases;
drop policy if exists "RBAC update" on installment_purchases;
drop policy if exists "RBAC delete" on installment_purchases;

drop policy if exists "RBAC read" on card_invoices;
drop policy if exists "RBAC insert" on card_invoices;
drop policy if exists "RBAC update" on card_invoices;

drop policy if exists "RBAC insert" on users;
drop policy if exists "RBAC update" on users;
drop policy if exists "RBAC delete" on users;

drop policy if exists "RBAC insert" on roles;
drop policy if exists "RBAC update" on roles;
drop policy if exists "RBAC delete" on roles;

drop policy if exists "RBAC insert" on role_permissions;
drop policy if exists "RBAC delete" on role_permissions;

-- Drop has_permission (replaced by has_account_permission)
drop function if exists has_permission(text, text);

-- ============================================================
-- entries: filtro por account_id + permissão por conta
-- ============================================================
create policy "Account read" on entries for select using (
  is_superadmin() or (account_id in (select user_account_ids()) and has_account_permission(account_id, 'transactions', 'read'))
);
create policy "Account insert" on entries for insert with check (
  has_account_permission(account_id, 'transactions', 'create')
);
create policy "Account update" on entries for update using (
  has_account_permission(account_id, 'transactions', 'update')
);
create policy "Account delete" on entries for delete using (
  has_account_permission(account_id, 'transactions', 'delete')
);

-- ============================================================
-- recurring_templates
-- ============================================================
create policy "Account read" on recurring_templates for select using (
  is_superadmin() or (account_id in (select user_account_ids()) and has_account_permission(account_id, 'recurring_templates', 'read'))
);
create policy "Account insert" on recurring_templates for insert with check (
  has_account_permission(account_id, 'recurring_templates', 'create')
);
create policy "Account update" on recurring_templates for update using (
  has_account_permission(account_id, 'recurring_templates', 'update')
);
create policy "Account delete" on recurring_templates for delete using (
  has_account_permission(account_id, 'recurring_templates', 'delete')
);

-- ============================================================
-- budgets
-- ============================================================
create policy "Account read" on budgets for select using (
  is_superadmin() or (account_id in (select user_account_ids()) and has_account_permission(account_id, 'budgets', 'read'))
);
create policy "Account insert" on budgets for insert with check (
  has_account_permission(account_id, 'budgets', 'create')
);
create policy "Account update" on budgets for update using (
  has_account_permission(account_id, 'budgets', 'update')
);
create policy "Account delete" on budgets for delete using (
  has_account_permission(account_id, 'budgets', 'delete')
);

-- ============================================================
-- installment_purchases
-- ============================================================
create policy "Account read" on installment_purchases for select using (
  is_superadmin() or (account_id in (select user_account_ids()) and has_account_permission(account_id, 'transactions', 'read'))
);
create policy "Account insert" on installment_purchases for insert with check (
  has_account_permission(account_id, 'transactions', 'create')
);
create policy "Account update" on installment_purchases for update using (
  has_account_permission(account_id, 'transactions', 'update')
);
create policy "Account delete" on installment_purchases for delete using (
  has_account_permission(account_id, 'transactions', 'delete')
);

-- ============================================================
-- card_invoices
-- ============================================================
create policy "Account read" on card_invoices for select using (
  is_superadmin() or (account_id in (select user_account_ids()) and has_account_permission(account_id, 'credit_cards', 'read'))
);
create policy "Account insert" on card_invoices for insert with check (
  has_account_permission(account_id, 'credit_cards', 'create')
);
create policy "Account update" on card_invoices for update using (
  has_account_permission(account_id, 'credit_cards', 'update')
);

-- ============================================================
-- categories e cards: globais (qualquer autenticado lê, superadmin gerencia)
-- ============================================================
create policy "Auth read" on categories for select using (auth.role() = 'authenticated');
create policy "Superadmin write" on categories for insert with check (is_superadmin());
create policy "Superadmin update" on categories for update using (is_superadmin());
create policy "Superadmin delete" on categories for delete using (is_superadmin());

create policy "Auth read" on cards for select using (auth.role() = 'authenticated');
create policy "Superadmin write" on cards for insert with check (is_superadmin());
create policy "Superadmin update" on cards for update using (is_superadmin());
create policy "Superadmin delete" on cards for delete using (is_superadmin());

-- ============================================================
-- accounts: membros podem ler suas contas, superadmin vê tudo
-- ============================================================
create policy "Account read" on accounts for select using (
  is_superadmin() or id in (select user_account_ids())
);
create policy "Superadmin write" on accounts for insert with check (is_superadmin());
create policy "Superadmin update" on accounts for update using (is_superadmin());
create policy "Superadmin delete" on accounts for delete using (is_superadmin());

-- ============================================================
-- account_members: membros veem membros da mesma conta, superadmin gerencia
-- ============================================================
create policy "Account read" on account_members for select using (
  is_superadmin() or account_id in (select user_account_ids())
);
create policy "Superadmin write" on account_members for insert with check (is_superadmin());
create policy "Superadmin update" on account_members for update using (is_superadmin());
create policy "Superadmin delete" on account_members for delete using (is_superadmin());

-- ============================================================
-- users: anon pode checar email, superadmin gerencia
-- ============================================================
-- Keep existing "Anon check email" policy
create policy "Superadmin insert" on users for insert with check (is_superadmin() or auth.role() = 'authenticated');
create policy "Superadmin update" on users for update using (is_superadmin());
create policy "Superadmin delete" on users for delete using (is_superadmin());

-- ============================================================
-- roles, permissions, role_permissions: superadmin only para escrita
-- ============================================================
create policy "Superadmin write" on roles for insert with check (is_superadmin());
create policy "Superadmin update" on roles for update using (is_superadmin());
create policy "Superadmin delete" on roles for delete using (is_superadmin());

create policy "Superadmin write" on role_permissions for insert with check (is_superadmin());
create policy "Superadmin delete" on role_permissions for delete using (is_superadmin());
