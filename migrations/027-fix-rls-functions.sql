-- Fix: usar current_setting para extrair email do JWT (compatível com todas versões Supabase)

CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE email = current_setting('request.jwt.claims', true)::json ->> 'email'
      AND is_superadmin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION has_account_permission(p_account_id uuid, p_resource text, p_action text)
RETURNS boolean AS $$
BEGIN
  RETURN is_superadmin() OR EXISTS (
    SELECT 1
    FROM account_members am
    JOIN users u ON u.id = am.user_id
    JOIN role_permissions rp ON rp.role_id = am.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE u.email = current_setting('request.jwt.claims', true)::json ->> 'email'
      AND am.account_id = p_account_id
      AND p.resource = p_resource
      AND p.action = p_action
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION user_account_ids()
RETURNS SETOF uuid AS $$
BEGIN
  RETURN QUERY
    SELECT am.account_id
    FROM account_members am
    JOIN users u ON u.id = am.user_id
    WHERE u.email = current_setting('request.jwt.claims', true)::json ->> 'email';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
