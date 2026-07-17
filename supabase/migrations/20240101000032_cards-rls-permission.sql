-- Permitir superadmin, owner ou usuário com permissão RBAC gerenciar cards
create or replace function has_global_permission(p_resource text, p_action text)
returns boolean as $$
  select is_superadmin() or exists (
    select 1
    from account_members am
    join users u on u.id = am.user_id
    join roles r on r.id = am.role_id
    where u.email = auth.jwt()->>'email'
      and (r.name = 'owner' or exists (
        select 1
        from role_permissions rp
        join permissions p on p.id = rp.permission_id
        where rp.role_id = am.role_id
          and p.resource = p_resource
          and p.action = p_action
      ))
  );
$$ language sql security definer stable;

drop policy if exists "Superadmin write" on cards;
drop policy if exists "Superadmin update" on cards;
drop policy if exists "Superadmin delete" on cards;

create policy "Permission write" on cards for insert with check (has_global_permission('cards', 'create'));
create policy "Permission update" on cards for update using (has_global_permission('cards', 'update'));
create policy "Permission delete" on cards for delete using (has_global_permission('cards', 'delete'));
