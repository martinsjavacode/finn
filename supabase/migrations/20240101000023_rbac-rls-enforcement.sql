-- Função helper: verifica se o usuário autenticado tem permissão (resource, action)
create or replace function has_permission(p_resource text, p_action text)
returns boolean as $$
  select exists (
    select 1
    from users u
    join role_permissions rp on rp.role_id = u.role_id
    join permissions p on p.id = rp.permission_id
    where u.email = auth.jwt()->>'email'
      and p.resource = p_resource
      and p.action = p_action
  );
$$ language sql security definer stable;

-- ============================================================
-- entries: substituir policies permissivas por RBAC
-- ============================================================
drop policy if exists "Auth read" on entries;
drop policy if exists "Auth insert" on entries;
drop policy if exists "Auth update" on entries;
drop policy if exists "Auth delete" on entries;

create policy "RBAC read" on entries for select using (has_permission('transactions', 'read'));
create policy "RBAC insert" on entries for insert with check (has_permission('transactions', 'create'));
create policy "RBAC update" on entries for update using (has_permission('transactions', 'update'));
create policy "RBAC delete" on entries for delete using (has_permission('transactions', 'delete'));

-- ============================================================
-- categories
-- ============================================================
drop policy if exists "Auth read" on categories;
drop policy if exists "Auth insert" on categories;
drop policy if exists "Auth update" on categories;
drop policy if exists "Auth delete" on categories;

create policy "RBAC read" on categories for select using (has_permission('categories', 'read'));
create policy "RBAC insert" on categories for insert with check (has_permission('categories', 'create'));
create policy "RBAC update" on categories for update using (has_permission('categories', 'update'));
create policy "RBAC delete" on categories for delete using (has_permission('categories', 'delete'));

-- ============================================================
-- cards
-- ============================================================
drop policy if exists "Auth read" on cards;
drop policy if exists "Auth insert" on cards;
drop policy if exists "Auth update" on cards;
drop policy if exists "Auth delete" on cards;

create policy "RBAC read" on cards for select using (has_permission('cards', 'read'));
create policy "RBAC insert" on cards for insert with check (has_permission('cards', 'create'));
create policy "RBAC update" on cards for update using (has_permission('cards', 'update'));
create policy "RBAC delete" on cards for delete using (has_permission('cards', 'delete'));

-- ============================================================
-- recurring_templates
-- ============================================================
drop policy if exists "Auth read" on recurring_templates;
drop policy if exists "Auth insert" on recurring_templates;
drop policy if exists "Auth update" on recurring_templates;
drop policy if exists "Auth delete" on recurring_templates;

create policy "RBAC read" on recurring_templates for select using (has_permission('recurring_templates', 'read'));
create policy "RBAC insert" on recurring_templates for insert with check (has_permission('recurring_templates', 'create'));
create policy "RBAC update" on recurring_templates for update using (has_permission('recurring_templates', 'update'));
create policy "RBAC delete" on recurring_templates for delete using (has_permission('recurring_templates', 'delete'));

-- ============================================================
-- budgets
-- ============================================================
drop policy if exists "Auth read" on budgets;
drop policy if exists "Auth insert" on budgets;
drop policy if exists "Auth update" on budgets;
drop policy if exists "Auth delete" on budgets;

create policy "RBAC read" on budgets for select using (has_permission('budgets', 'read'));
create policy "RBAC insert" on budgets for insert with check (has_permission('budgets', 'create'));
create policy "RBAC update" on budgets for update using (has_permission('budgets', 'update'));
create policy "RBAC delete" on budgets for delete using (has_permission('budgets', 'delete'));

-- ============================================================
-- installment_purchases
-- ============================================================
drop policy if exists "Auth read" on installment_purchases;
drop policy if exists "Auth insert" on installment_purchases;
drop policy if exists "Auth update" on installment_purchases;
drop policy if exists "Auth delete" on installment_purchases;

create policy "RBAC read" on installment_purchases for select using (has_permission('transactions', 'read'));
create policy "RBAC insert" on installment_purchases for insert with check (has_permission('transactions', 'create'));
create policy "RBAC update" on installment_purchases for update using (has_permission('transactions', 'update'));
create policy "RBAC delete" on installment_purchases for delete using (has_permission('transactions', 'delete'));

-- ============================================================
-- card_invoices
-- ============================================================
drop policy if exists "Auth read" on card_invoices;
drop policy if exists "Auth insert" on card_invoices;
drop policy if exists "Auth update" on card_invoices;

create policy "RBAC read" on card_invoices for select using (has_permission('credit_cards', 'read'));
create policy "RBAC insert" on card_invoices for insert with check (has_permission('credit_cards', 'create'));
create policy "RBAC update" on card_invoices for update using (has_permission('credit_cards', 'update'));

-- ============================================================
-- users: somente owner pode gerenciar
-- ============================================================
drop policy if exists "Auth insert" on users;
drop policy if exists "Auth update" on users;
drop policy if exists "Auth delete" on users;

create policy "RBAC insert" on users for insert with check (has_permission('users', 'create'));
create policy "RBAC update" on users for update using (has_permission('users', 'update'));
create policy "RBAC delete" on users for delete using (has_permission('users', 'delete'));

-- ============================================================
-- roles e role_permissions: somente owner pode gerenciar
-- ============================================================
drop policy if exists "Auth insert" on roles;
drop policy if exists "Auth update" on roles;
drop policy if exists "Auth delete" on roles;

create policy "RBAC insert" on roles for insert with check (has_permission('users', 'create'));
create policy "RBAC update" on roles for update using (has_permission('users', 'update'));
create policy "RBAC delete" on roles for delete using (has_permission('users', 'delete'));

drop policy if exists "Auth insert" on role_permissions;
drop policy if exists "Auth delete" on role_permissions;

create policy "RBAC insert" on role_permissions for insert with check (has_permission('users', 'create'));
create policy "RBAC delete" on role_permissions for delete using (has_permission('users', 'delete'));
