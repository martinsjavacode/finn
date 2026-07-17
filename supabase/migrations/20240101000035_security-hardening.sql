-- ============================================================
-- Migration 035: Security Hardening (Supabase Linter Fixes)
-- ============================================================
-- Resolve issues do Supabase Studio Linter:
-- - 11x function_search_path_mutable → SET search_path = ''
-- - 11x anon_security_definer_function_executable → REVOKE EXECUTE FROM anon
-- - 14x pg_graphql_anon_table_exposed → REVOKE SELECT FROM anon
-- - 1x users anon policy → restringir via RPC dedicada
--
-- Issues aceitas (intencionais no RBAC/multi-account):
-- - 16x pg_graphql_authenticated_table_exposed
-- - 8x authenticated_security_definer_function_executable
-- ============================================================

-- ============================================================
-- 1. Recriar TODAS as funções com search_path = '' e
--    referências fully-qualified (public.tabela)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_superadmin()
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
  SET search_path = ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE email = current_setting('request.jwt.claims', true)::json ->> 'email'
      AND is_superadmin = true
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.user_account_ids()
  RETURNS SETOF uuid
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
  SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
    SELECT am.account_id
    FROM public.account_members am
    JOIN public.users u ON u.id = am.user_id
    WHERE u.email = current_setting('request.jwt.claims', true)::json ->> 'email';
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_account_permission(p_account_id uuid, p_resource text, p_action text)
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
  SET search_path = ''
AS $function$
BEGIN
  RETURN public.is_superadmin() OR EXISTS (
    SELECT 1
    FROM public.account_members am
    JOIN public.users u ON u.id = am.user_id
    JOIN public.role_permissions rp ON rp.role_id = am.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE u.email = current_setting('request.jwt.claims', true)::json ->> 'email'
      AND am.account_id = p_account_id
      AND p.resource = p_resource
      AND p.action = p_action
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_global_permission(p_resource text, p_action text)
  RETURNS boolean
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path = ''
AS $function$
  SELECT public.is_superadmin() OR EXISTS (
    SELECT 1
    FROM public.account_members am
    JOIN public.users u ON u.id = am.user_id
    JOIN public.roles r ON r.id = am.role_id
    WHERE u.email = auth.jwt()->>'email'
      AND (r.name = 'owner' OR EXISTS (
        SELECT 1
        FROM public.role_permissions rp
        JOIN public.permissions p ON p.id = rp.permission_id
        WHERE rp.role_id = am.role_id
          AND p.resource = p_resource
          AND p.action = p_action
      ))
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_owner_or_superadmin()
  RETURNS boolean
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path = ''
AS $function$
  SELECT public.is_superadmin() OR EXISTS (
    SELECT 1
    FROM public.account_members am
    JOIN public.users u ON u.id = am.user_id
    JOIN public.roles r ON r.id = am.role_id
    WHERE u.email = auth.jwt()->>'email'
      AND r.name = 'owner'
  );
$function$;

CREATE OR REPLACE FUNCTION public.generate_recurring(target_month date, p_account_id uuid)
  RETURNS void
  LANGUAGE plpgsql
  SET search_path = ''
AS $function$
DECLARE
  tpl record;
  m date;
BEGIN
  FOR tpl IN SELECT * FROM public.recurring_templates WHERE active = true AND account_id = p_account_id LOOP
    m := target_month + ((tpl.day - 1) * interval '1 day');
    IF NOT EXISTS (
      SELECT 1 FROM public.entries
      WHERE description = tpl.description AND month = m AND account_id = p_account_id
    ) THEN
      INSERT INTO public.entries (month, description, amount, payment_method, type, category, card, account_id, paid)
      VALUES (m, tpl.description, tpl.amount, tpl.target::public.payment_method, tpl.type::public.entry_type, tpl.category, tpl.card, p_account_id, false);
    END IF;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_projection(months_ahead integer DEFAULT 6, p_account_id uuid DEFAULT NULL)
  RETURNS TABLE(month text, recurring numeric, installments numeric)
  LANGUAGE plpgsql
  SET search_path = ''
AS $function$
DECLARE
  monthly_recurring numeric;
  i int;
  target_start date;
  target_end date;
  inst_total numeric;
BEGIN
  SELECT coalesce(sum(rt.amount), 0) INTO monthly_recurring
  FROM public.recurring_templates rt WHERE rt.active = true AND rt.type = 'expense'
    AND (p_account_id IS NULL OR rt.account_id = p_account_id);

  FOR i IN 0..(months_ahead - 1) LOOP
    target_start := date_trunc('month', current_date) + (i * interval '1 month');
    target_end := target_start + interval '1 month';

    SELECT coalesce(sum(e.amount), 0) INTO inst_total
    FROM public.entries e WHERE e.month >= target_start AND e.month < target_end AND e.total_installments IS NOT NULL
      AND (p_account_id IS NULL OR e.account_id = p_account_id);

    month := to_char(target_start, 'YYYY-MM');
    recurring := monthly_recurring;
    installments := inst_total;
    RETURN NEXT;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_installments()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = ''
AS $function$
DECLARE
  i int;
  installment_amount numeric(10,2);
  target_month date;
BEGIN
  installment_amount := round(NEW.total_amount / NEW.installments, 2);

  FOR i IN 1..NEW.installments LOOP
    target_month := NEW.start_month + ((i - 1) * interval '1 month');
    INSERT INTO public.entries (month, description, amount, payment_method, type, category, card, account_id, paid, current_installment, total_installments, installment_purchase_id)
    VALUES (target_month, NEW.description, installment_amount, NEW.target::public.payment_method, 'expense', NEW.category, NEW.card, NEW.account_id, false, i, NEW.installments, NEW.id);
  END LOOP;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.migrate_entries(entry_ids uuid[], target_account_id uuid)
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
DECLARE
  affected int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_superadmin = true) THEN
    RAISE EXCEPTION 'Apenas superadmin pode migrar lançamentos';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = target_account_id) THEN
    RAISE EXCEPTION 'Conta destino não encontrada';
  END IF;

  UPDATE public.entries SET account_id = target_account_id
  WHERE id = ANY(entry_ids) AND installment_purchase_id IS NULL;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$function$;

CREATE OR REPLACE FUNCTION public.migrate_budgets(budget_ids uuid[], target_account_id uuid)
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
DECLARE
  affected int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_superadmin = true) THEN
    RAISE EXCEPTION 'Apenas superadmin pode migrar orçamentos';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = target_account_id) THEN
    RAISE EXCEPTION 'Conta destino não encontrada';
  END IF;

  UPDATE public.budgets SET account_id = target_account_id
  WHERE id = ANY(budget_ids);
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$function$;

CREATE OR REPLACE FUNCTION public.migrate_installment_purchases(purchase_ids uuid[], target_account_id uuid)
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
DECLARE
  affected int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_superadmin = true) THEN
    RAISE EXCEPTION 'Apenas superadmin pode migrar parcelamentos';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = target_account_id) THEN
    RAISE EXCEPTION 'Conta destino não encontrada';
  END IF;

  UPDATE public.installment_purchases SET account_id = target_account_id
  WHERE id = ANY(purchase_ids);
  GET DIAGNOSTICS affected = ROW_COUNT;

  UPDATE public.entries SET account_id = target_account_id
  WHERE installment_purchase_id = ANY(purchase_ids);

  RETURN affected;
END;
$function$;

-- ============================================================
-- 2. Remover DEFAULT PRIVILEGES que dão EXECUTE ao anon
--    automaticamente para novas funções no schema public.
--    Sem isso, qualquer CREATE OR REPLACE re-concede o grant.
-- ============================================================

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon;

-- Nota: não alteramos defaults do supabase_admin (requer ser membro).
-- O REVOKE ALL abaixo cobre funções já criadas por qualquer role.

-- Revogar EXECUTE explicitamente em todas as funções do Finn
REVOKE EXECUTE ON FUNCTION public.has_account_permission(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_global_permission(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_owner_or_superadmin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_superadmin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_account_ids() FROM anon;
REVOKE EXECUTE ON FUNCTION public.migrate_entries(uuid[], uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.migrate_budgets(uuid[], uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.migrate_installment_purchases(uuid[], uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_recurring(date, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_projection(integer, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_installments() FROM anon;

-- Revogar também via schema-level (pega funções que possam ter sido criadas antes)
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;
-- Revogar do pseudo-role PUBLIC (todos herdam dele, incluindo anon)
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

-- Re-conceder para authenticated e service_role (que precisam)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================================
-- 3. REVOKE SELECT do anon em tabelas que não precisam (14 tabelas)
--    Mantém apenas: categories (dados públicos estáticos)
-- ============================================================

REVOKE SELECT ON public.account_members FROM anon;
REVOKE SELECT ON public.accounts FROM anon;
REVOKE SELECT ON public.activity_logs FROM anon;
REVOKE SELECT ON public.budgets FROM anon;
REVOKE SELECT ON public.card_invoices FROM anon;
REVOKE SELECT ON public.cards FROM anon;
REVOKE SELECT ON public.entries FROM anon;
REVOKE SELECT ON public.installment_purchases FROM anon;
REVOKE SELECT ON public.investment_transactions FROM anon;
REVOKE SELECT ON public.investments FROM anon;
REVOKE SELECT ON public.permissions FROM anon;
REVOKE SELECT ON public.recurring_templates FROM anon;
REVOKE SELECT ON public.role_permissions FROM anon;
REVOKE SELECT ON public.roles FROM anon;
REVOKE SELECT ON public.users FROM anon;

-- Re-conceder acesso total para authenticated e service_role
-- (necessário porque o Supabase usa default privileges via PUBLIC,
--  e o REVOKE acima pode ter removido grants herdados)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- ============================================================
-- 4. Proteger tabela users: RPC dedicada para check de email
-- ============================================================
-- O signup do frontend precisa verificar se um email está autorizado.
-- Em vez de dar SELECT na tabela inteira, usamos uma RPC que retorna
-- apenas boolean (existe ou não).

CREATE OR REPLACE FUNCTION public.check_email_authorized(p_email text)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE email = p_email
  );
$$;

-- Anon pode chamar apenas esta RPC
-- (grant fica APÓS o REVOKE ALL acima para não ser sobrescrito)
GRANT EXECUTE ON FUNCTION public.check_email_authorized(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_email_authorized(text) TO authenticated;

-- Substituir policy permissiva por uma restrita a authenticated
DROP POLICY IF EXISTS "Anon check email" ON public.users;
CREATE POLICY "Auth read" ON public.users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- 5. Fix: Remover FKs redundantes que causam 406 no PostgREST
-- ============================================================
-- Tabelas com FK composta para cards(account_id, name) E FK simples
-- para accounts(id) via account_id causam ambiguidade no PostgREST.
-- A FK composta já garante integridade indiretamente (cards.account_id → accounts.id).

ALTER TABLE public.card_invoices DROP CONSTRAINT IF EXISTS card_invoices_account_id_fkey;
ALTER TABLE public.entries DROP CONSTRAINT IF EXISTS entries_account_id_fkey;
ALTER TABLE public.installment_purchases DROP CONSTRAINT IF EXISTS installment_purchases_account_id_fkey;
ALTER TABLE public.recurring_templates DROP CONSTRAINT IF EXISTS recurring_templates_account_id_fkey;
