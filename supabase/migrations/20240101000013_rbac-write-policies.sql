-- Policies de escrita para roles
create policy "Auth insert" on roles for insert with check (auth.role() = 'authenticated');
create policy "Auth update" on roles for update using (auth.role() = 'authenticated');
create policy "Auth delete" on roles for delete using (auth.role() = 'authenticated');

-- Policies de escrita para permissions
create policy "Auth insert" on permissions for insert with check (auth.role() = 'authenticated');
create policy "Auth update" on permissions for update using (auth.role() = 'authenticated');
create policy "Auth delete" on permissions for delete using (auth.role() = 'authenticated');

-- Policies de escrita para role_permissions
create policy "Auth insert" on role_permissions for insert with check (auth.role() = 'authenticated');
create policy "Auth delete" on role_permissions for delete using (auth.role() = 'authenticated');
