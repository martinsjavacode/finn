alter table access_control drop constraint access_control_role_check;
alter table access_control add constraint access_control_role_check check (role in ('viewer', 'editor', 'owner'));
