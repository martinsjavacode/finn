-- Permitir superadmin ou owner gerenciar categorias
create or replace function is_owner_or_superadmin()
returns boolean as $$
  select is_superadmin() or exists (
    select 1
    from account_members am
    join users u on u.id = am.user_id
    join roles r on r.id = am.role_id
    where u.email = auth.jwt()->>'email'
      and r.name = 'owner'
  );
$$ language sql security definer stable;

drop policy if exists "Superadmin write" on categories;
drop policy if exists "Superadmin update" on categories;
drop policy if exists "Superadmin delete" on categories;

create policy "Owner write" on categories for insert with check (is_owner_or_superadmin());
create policy "Owner update" on categories for update using (is_owner_or_superadmin());
create policy "Owner delete" on categories for delete using (is_owner_or_superadmin());
