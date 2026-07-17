-- ============================================================
-- seed.sql — Dados iniciais (Finn)
-- ============================================================

-- IMPORTANTE: Substitua o email abaixo pelo seu email
INSERT INTO users (email, display_name, is_superadmin, activated) VALUES
  ('seu@email.com', 'Owner', true, false);

-- Vincular o primeiro usuário como owner de todas as contas
INSERT INTO account_members (account_id, user_id, role_id)
SELECT a.id, u.id, r.id
FROM accounts a
CROSS JOIN users u
CROSS JOIN roles r
WHERE u.email = 'seu@email.com'
  AND r.name = 'owner';
