-- =============================================================================
-- Finn - Dados de Teste
-- Execute com: docker exec -i supabase_db_finn-local psql -U postgres -d postgres < supabase/seed.sql
-- =============================================================================

-- =============================================================================
-- 1. USUÁRIO DE TESTE (superadmin)
-- =============================================================================
INSERT INTO users (id, email, display_name, is_superadmin, activated) VALUES
  ('11111111-1111-1111-1111-111111111111', 'martins@test.com', 'Martins', true, true)
ON CONFLICT (email) DO NOTHING;

-- =============================================================================
-- 2. VINCULAR USUÁRIO ÀS CONTAS COM ROLE OWNER
-- =============================================================================
INSERT INTO account_members (account_id, user_id, role_id)
SELECT a.id, '11111111-1111-1111-1111-111111111111', r.id
FROM accounts a
CROSS JOIN roles r
WHERE r.name = 'owner'
ON CONFLICT (account_id, user_id) DO NOTHING;

-- =============================================================================
-- 3. SUBCATEGORIAS
-- =============================================================================
-- Subcategorias de Educação
INSERT INTO categories (id, name, label, parent_id) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'ead', 'EAD', (SELECT id FROM categories WHERE name = 'education')),
  ('c0000001-0000-0000-0000-000000000002', 'escola', 'Escola', (SELECT id FROM categories WHERE name = 'education')),
  ('c0000001-0000-0000-0000-000000000003', 'cursos', 'Cursos', (SELECT id FROM categories WHERE name = 'education'))
ON CONFLICT (name) DO NOTHING;

-- Subcategorias de Casa
INSERT INTO categories (id, name, label, parent_id) VALUES
  ('c0000002-0000-0000-0000-000000000001', 'energia', 'Energia', (SELECT id FROM categories WHERE name = 'house')),
  ('c0000002-0000-0000-0000-000000000002', 'agua', 'Água', (SELECT id FROM categories WHERE name = 'house')),
  ('c0000002-0000-0000-0000-000000000003', 'internet', 'Internet', (SELECT id FROM categories WHERE name = 'house')),
  ('c0000002-0000-0000-0000-000000000004', 'aluguel', 'Aluguel', (SELECT id FROM categories WHERE name = 'house'))
ON CONFLICT (name) DO NOTHING;

-- Subcategorias de Lazer
INSERT INTO categories (id, name, label, parent_id) VALUES
  ('c0000003-0000-0000-0000-000000000001', 'streaming', 'Streaming', (SELECT id FROM categories WHERE name = 'leisure')),
  ('c0000003-0000-0000-0000-000000000002', 'restaurantes', 'Restaurantes', (SELECT id FROM categories WHERE name = 'leisure'))
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- 4. CARTÕES DE CRÉDITO (com account_id - FK composta)
-- =============================================================================
INSERT INTO cards (id, name, label, credit_limit, closing_day, due_day, color, active, account_id) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'nubank', 'Nubank', 8000.00, 3, 10, '#820ad1', true, '00000000-0000-0000-0000-000000000001'),
  ('d0000002-0000-0000-0000-000000000001', 'inter', 'Inter', 5000.00, 5, 15, '#ff7a00', true, '00000000-0000-0000-0000-000000000001'),
  ('d0000003-0000-0000-0000-000000000001', 'c6', 'C6 Bank', 3000.00, 1, 8, '#1a1a1a', true, '00000000-0000-0000-0000-000000000001'),
  ('d0000004-0000-0000-0000-000000000002', 'nubank_sogra', 'Nubank Sogra', 2000.00, 10, 17, '#820ad1', true, '00000000-0000-0000-0000-000000000002')
ON CONFLICT (account_id, name) DO NOTHING;

-- =============================================================================
-- 5. TEMPLATES RECORRENTES (conta Pessoal)
-- payment_method: 'pix' ou 'credit_card' (não existe 'boleto')
-- =============================================================================
INSERT INTO recurring_templates (id, description, amount, type, target, category, card, day, active, account_id) VALUES
  -- Receitas
  ('e0000001-0000-0000-0000-000000000001', 'Salário', 12500.00, 'income', 'pix', NULL, NULL, 5, true, '00000000-0000-0000-0000-000000000001'),
  
  -- Despesas fixas (pix)
  ('e0000002-0000-0000-0000-000000000001', 'Aluguel', 2200.00, 'expense', 'pix', (SELECT id FROM categories WHERE name = 'aluguel'), NULL, 10, true, '00000000-0000-0000-0000-000000000001'),
  ('e0000003-0000-0000-0000-000000000001', 'Energia', 280.00, 'expense', 'pix', (SELECT id FROM categories WHERE name = 'energia'), NULL, 15, true, '00000000-0000-0000-0000-000000000001'),
  ('e0000004-0000-0000-0000-000000000001', 'Água', 85.00, 'expense', 'pix', (SELECT id FROM categories WHERE name = 'agua'), NULL, 20, true, '00000000-0000-0000-0000-000000000001'),
  ('e0000005-0000-0000-0000-000000000001', 'Internet', 119.90, 'expense', 'pix', (SELECT id FROM categories WHERE name = 'internet'), NULL, 12, true, '00000000-0000-0000-0000-000000000001'),
  ('e0000006-0000-0000-0000-000000000001', 'Dízimo', 1250.00, 'expense', 'pix', (SELECT id FROM categories WHERE name = 'spiritual'), NULL, 7, true, '00000000-0000-0000-0000-000000000001'),
  
  -- Despesas recorrentes no cartão
  ('e0000007-0000-0000-0000-000000000001', 'Netflix', 55.90, 'expense', 'credit_card', (SELECT id FROM categories WHERE name = 'streaming'), 'nubank', 1, true, '00000000-0000-0000-0000-000000000001'),
  ('e0000008-0000-0000-0000-000000000001', 'Spotify', 34.90, 'expense', 'credit_card', (SELECT id FROM categories WHERE name = 'streaming'), 'nubank', 1, true, '00000000-0000-0000-0000-000000000001'),
  ('e0000009-0000-0000-0000-000000000001', 'Prime Video', 19.90, 'expense', 'credit_card', (SELECT id FROM categories WHERE name = 'streaming'), 'inter', 1, true, '00000000-0000-0000-0000-000000000001'),
  ('e0000010-0000-0000-0000-000000000001', 'Faculdade EAD', 399.00, 'expense', 'credit_card', (SELECT id FROM categories WHERE name = 'ead'), 'nubank', 5, true, '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Templates da conta Sogra
INSERT INTO recurring_templates (id, description, amount, type, target, category, card, day, active, account_id) VALUES
  ('e0000011-0000-0000-0000-000000000002', 'Pensão', 1500.00, 'income', 'pix', NULL, NULL, 10, true, '00000000-0000-0000-0000-000000000002'),
  ('e0000012-0000-0000-0000-000000000002', 'Remédios', 350.00, 'expense', 'pix', (SELECT id FROM categories WHERE name = 'misc'), NULL, 15, true, '00000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 6. LANÇAMENTOS (últimos 3 meses + mês atual)
-- =============================================================================
DO $$
DECLARE
  month_offset int;
  target_month date;
  cat_casa uuid := (SELECT id FROM categories WHERE name = 'house');
  cat_lazer uuid := (SELECT id FROM categories WHERE name = 'leisure');
  cat_edu uuid := (SELECT id FROM categories WHERE name = 'education');
  cat_misc uuid := (SELECT id FROM categories WHERE name = 'misc');
  cat_inv uuid := (SELECT id FROM categories WHERE name = 'investment');
  cat_aluguel uuid := (SELECT id FROM categories WHERE name = 'aluguel');
  cat_energia uuid := (SELECT id FROM categories WHERE name = 'energia');
  cat_streaming uuid := (SELECT id FROM categories WHERE name = 'streaming');
  cat_restaurantes uuid := (SELECT id FROM categories WHERE name = 'restaurantes');
BEGIN
  FOR month_offset IN 0..3 LOOP
    target_month := date_trunc('month', current_date) - (month_offset * interval '1 month');
    
    -- Receitas
    INSERT INTO entries (month, description, amount, payment_method, type, category, card, account_id, paid) VALUES
      (target_month + interval '4 days', 'Salário', 12500.00, 'pix', 'income', NULL, NULL, '00000000-0000-0000-0000-000000000001', month_offset > 0),
      (target_month + interval '15 days', 'Freela website', 2500.00, 'pix', 'income', (SELECT id FROM categories WHERE name = 'business'), NULL, '00000000-0000-0000-0000-000000000001', month_offset > 0);
    
    -- Despesas fixas (pix)
    INSERT INTO entries (month, description, amount, payment_method, type, category, card, account_id, paid) VALUES
      (target_month + interval '9 days', 'Aluguel', 2200.00, 'pix', 'expense', cat_aluguel, NULL, '00000000-0000-0000-0000-000000000001', month_offset > 0),
      (target_month + interval '14 days', 'Energia', 280.00 + (random() * 50)::numeric(10,2), 'pix', 'expense', cat_energia, NULL, '00000000-0000-0000-0000-000000000001', month_offset > 0),
      (target_month + interval '19 days', 'Água', 85.00 + (random() * 20)::numeric(10,2), 'pix', 'expense', (SELECT id FROM categories WHERE name = 'agua'), NULL, '00000000-0000-0000-0000-000000000001', month_offset > 0),
      (target_month + interval '11 days', 'Internet Vivo', 119.90, 'pix', 'expense', (SELECT id FROM categories WHERE name = 'internet'), NULL, '00000000-0000-0000-0000-000000000001', month_offset > 0),
      (target_month + interval '6 days', 'Dízimo', 1250.00, 'pix', 'expense', (SELECT id FROM categories WHERE name = 'spiritual'), NULL, '00000000-0000-0000-0000-000000000001', month_offset > 0);
    
    -- Cartão de crédito (Nubank)
    INSERT INTO entries (month, description, amount, payment_method, type, category, card, account_id, paid) VALUES
      (target_month + interval '1 day', 'Netflix', 55.90, 'credit_card', 'expense', cat_streaming, 'nubank', '00000000-0000-0000-0000-000000000001', false),
      (target_month + interval '1 day', 'Spotify', 34.90, 'credit_card', 'expense', cat_streaming, 'nubank', '00000000-0000-0000-0000-000000000001', false),
      (target_month + interval '4 days', 'Faculdade EAD', 399.00, 'credit_card', 'expense', (SELECT id FROM categories WHERE name = 'ead'), 'nubank', '00000000-0000-0000-0000-000000000001', false),
      (target_month + interval '7 days', 'iFood', 45.00 + (random() * 30)::numeric(10,2), 'credit_card', 'expense', cat_restaurantes, 'nubank', '00000000-0000-0000-0000-000000000001', false),
      (target_month + interval '12 days', 'Supermercado', 350.00 + (random() * 100)::numeric(10,2), 'credit_card', 'expense', cat_casa, 'nubank', '00000000-0000-0000-0000-000000000001', false),
      (target_month + interval '18 days', 'Posto combustível', 180.00 + (random() * 40)::numeric(10,2), 'credit_card', 'expense', cat_misc, 'nubank', '00000000-0000-0000-0000-000000000001', false);
    
    -- Cartão de crédito (Inter)
    INSERT INTO entries (month, description, amount, payment_method, type, category, card, account_id, paid) VALUES
      (target_month + interval '1 day', 'Prime Video', 19.90, 'credit_card', 'expense', cat_streaming, 'inter', '00000000-0000-0000-0000-000000000001', false),
      (target_month + interval '10 days', 'Farmácia', 89.00 + (random() * 50)::numeric(10,2), 'credit_card', 'expense', cat_misc, 'inter', '00000000-0000-0000-0000-000000000001', false),
      (target_month + interval '22 days', 'Amazon compra', 120.00 + (random() * 80)::numeric(10,2), 'credit_card', 'expense', cat_misc, 'inter', '00000000-0000-0000-0000-000000000001', false);
    
    -- Cartão de crédito (C6)
    INSERT INTO entries (month, description, amount, payment_method, type, category, card, account_id, paid) VALUES
      (target_month + interval '3 days', 'Uber', 85.00 + (random() * 40)::numeric(10,2), 'credit_card', 'expense', cat_misc, 'c6', '00000000-0000-0000-0000-000000000001', false),
      (target_month + interval '8 days', 'Rappi', 45.00 + (random() * 25)::numeric(10,2), 'credit_card', 'expense', cat_lazer, 'c6', '00000000-0000-0000-0000-000000000001', false),
      (target_month + interval '15 days', 'Mercado Livre', 150.00 + (random() * 100)::numeric(10,2), 'credit_card', 'expense', cat_misc, 'c6', '00000000-0000-0000-0000-000000000001', false),
      (target_month + interval '20 days', 'Shopee', 89.00 + (random() * 60)::numeric(10,2), 'credit_card', 'expense', cat_misc, 'c6', '00000000-0000-0000-0000-000000000001', false);
    
    -- Conta Sogra
    INSERT INTO entries (month, description, amount, payment_method, type, category, card, account_id, paid) VALUES
      (target_month + interval '9 days', 'Pensão', 1500.00, 'pix', 'income', NULL, NULL, '00000000-0000-0000-0000-000000000002', month_offset > 0),
      (target_month + interval '14 days', 'Remédios', 350.00 + (random() * 100)::numeric(10,2), 'pix', 'expense', cat_misc, NULL, '00000000-0000-0000-0000-000000000002', month_offset > 0),
      (target_month + interval '5 days', 'Mercado', 280.00 + (random() * 50)::numeric(10,2), 'credit_card', 'expense', cat_casa, 'nubank_sogra', '00000000-0000-0000-0000-000000000002', false);
  END LOOP;
END $$;

-- =============================================================================
-- 7. COMPRAS PARCELADAS
-- payment_method: 'pix' ou 'credit_card'
-- =============================================================================
-- Notebook (já em andamento, iniciou 2 meses atrás)
INSERT INTO installment_purchases (id, start_month, description, total_amount, installments, target, card, category, account_id)
SELECT 
  'f0000001-0000-0000-0000-000000000001',
  date_trunc('month', current_date) - interval '2 months',
  'Notebook Dell',
  4800.00,
  12,
  'credit_card',
  'nubank',
  (SELECT id FROM categories WHERE name = 'misc'),
  '00000000-0000-0000-0000-000000000001'
WHERE NOT EXISTS (SELECT 1 FROM installment_purchases WHERE id = 'f0000001-0000-0000-0000-000000000001');

-- Celular (compra recente)
INSERT INTO installment_purchases (id, start_month, description, total_amount, installments, target, card, category, account_id)
SELECT 
  'f0000002-0000-0000-0000-000000000001',
  date_trunc('month', current_date),
  'iPhone 15',
  5999.00,
  10,
  'credit_card',
  'inter',
  (SELECT id FROM categories WHERE name = 'misc'),
  '00000000-0000-0000-0000-000000000001'
WHERE NOT EXISTS (SELECT 1 FROM installment_purchases WHERE id = 'f0000002-0000-0000-0000-000000000001');

-- Curso parcelado no pix (não existe boleto no enum)
INSERT INTO installment_purchases (id, start_month, description, total_amount, installments, target, card, category, account_id)
SELECT 
  'f0000003-0000-0000-0000-000000000001',
  date_trunc('month', current_date) - interval '1 month',
  'Curso AWS',
  1200.00,
  6,
  'pix',
  NULL,
  (SELECT id FROM categories WHERE name = 'cursos'),
  '00000000-0000-0000-0000-000000000001'
WHERE NOT EXISTS (SELECT 1 FROM installment_purchases WHERE id = 'f0000003-0000-0000-0000-000000000001');

-- =============================================================================
-- 8. ORÇAMENTOS
-- =============================================================================
INSERT INTO budgets (category, monthly_limit, account_id) VALUES
  ((SELECT id FROM categories WHERE name = 'house'), 3000.00, '00000000-0000-0000-0000-000000000001'),
  ((SELECT id FROM categories WHERE name = 'leisure'), 800.00, '00000000-0000-0000-0000-000000000001'),
  ((SELECT id FROM categories WHERE name = 'education'), 600.00, '00000000-0000-0000-0000-000000000001'),
  ((SELECT id FROM categories WHERE name = 'misc'), 1500.00, '00000000-0000-0000-0000-000000000001'),
  ((SELECT id FROM categories WHERE name = 'investment'), 2000.00, '00000000-0000-0000-0000-000000000001')
ON CONFLICT (account_id, category) DO NOTHING;

-- Orçamento conta Sogra
INSERT INTO budgets (category, monthly_limit, account_id) VALUES
  ((SELECT id FROM categories WHERE name = 'misc'), 800.00, '00000000-0000-0000-0000-000000000002'),
  ((SELECT id FROM categories WHERE name = 'house'), 500.00, '00000000-0000-0000-0000-000000000002')
ON CONFLICT (account_id, category) DO NOTHING;

-- =============================================================================
-- 9. FATURAS DE CARTÃO (para testes de negociação)
-- =============================================================================
-- Faturas Nubank (últimos 6 meses)
INSERT INTO card_invoices (card, month, paid_amount, account_id) VALUES
  ('nubank', date_trunc('month', current_date) - interval '6 months', 0, '00000000-0000-0000-0000-000000000001'),
  ('nubank', date_trunc('month', current_date) - interval '5 months', 0, '00000000-0000-0000-0000-000000000001'),
  ('nubank', date_trunc('month', current_date) - interval '4 months', 0, '00000000-0000-0000-0000-000000000001'),
  ('nubank', date_trunc('month', current_date) - interval '3 months', 500.00, '00000000-0000-0000-0000-000000000001'),
  ('nubank', date_trunc('month', current_date) - interval '2 months', 800.00, '00000000-0000-0000-0000-000000000001'),
  ('nubank', date_trunc('month', current_date) - interval '1 month', 1200.00, '00000000-0000-0000-0000-000000000001'),
  ('nubank', date_trunc('month', current_date), 0, '00000000-0000-0000-0000-000000000001')
ON CONFLICT (account_id, card, month) DO NOTHING;

-- Faturas Inter (últimos 6 meses)
INSERT INTO card_invoices (card, month, paid_amount, account_id) VALUES
  ('inter', date_trunc('month', current_date) - interval '6 months', 0, '00000000-0000-0000-0000-000000000001'),
  ('inter', date_trunc('month', current_date) - interval '5 months', 0, '00000000-0000-0000-0000-000000000001'),
  ('inter', date_trunc('month', current_date) - interval '4 months', 0, '00000000-0000-0000-0000-000000000001'),
  ('inter', date_trunc('month', current_date) - interval '3 months', 200.00, '00000000-0000-0000-0000-000000000001'),
  ('inter', date_trunc('month', current_date) - interval '2 months', 0, '00000000-0000-0000-0000-000000000001'),
  ('inter', date_trunc('month', current_date) - interval '1 month', 400.00, '00000000-0000-0000-0000-000000000001'),
  ('inter', date_trunc('month', current_date), 0, '00000000-0000-0000-0000-000000000001')
ON CONFLICT (account_id, card, month) DO NOTHING;

-- Faturas C6 (últimos 5 meses)
INSERT INTO card_invoices (card, month, paid_amount, account_id) VALUES
  ('c6', date_trunc('month', current_date) - interval '4 months', 0, '00000000-0000-0000-0000-000000000001'),
  ('c6', date_trunc('month', current_date) - interval '3 months', 0, '00000000-0000-0000-0000-000000000001'),
  ('c6', date_trunc('month', current_date) - interval '2 months', 0, '00000000-0000-0000-0000-000000000001'),
  ('c6', date_trunc('month', current_date) - interval '1 month', 0, '00000000-0000-0000-0000-000000000001'),
  ('c6', date_trunc('month', current_date), 0, '00000000-0000-0000-0000-000000000001')
ON CONFLICT (account_id, card, month) DO NOTHING;

-- Faturas Nubank Sogra (últimos 4 meses)
INSERT INTO card_invoices (card, month, paid_amount, account_id) VALUES
  ('nubank_sogra', date_trunc('month', current_date) - interval '3 months', 0, '00000000-0000-0000-0000-000000000002'),
  ('nubank_sogra', date_trunc('month', current_date) - interval '2 months', 0, '00000000-0000-0000-0000-000000000002'),
  ('nubank_sogra', date_trunc('month', current_date) - interval '1 month', 0, '00000000-0000-0000-0000-000000000002'),
  ('nubank_sogra', date_trunc('month', current_date), 0, '00000000-0000-0000-0000-000000000002')
ON CONFLICT (account_id, card, month) DO NOTHING;

-- =============================================================================
-- 10. INVESTIMENTOS
-- =============================================================================
INSERT INTO investments (id, account_id, name, type, broker, current_balance, invested_total, maturity_date, active) VALUES
  ('a0000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Tesouro Selic 2029', 'renda_fixa', 'Nubank', 15800.00, 15000.00, '2029-03-01', true),
  ('a0000002-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'CDB Inter 120% CDI', 'renda_fixa', 'Inter', 8200.00, 8000.00, '2025-12-01', true),
  ('a0000003-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'MXRF11', 'fii', 'Clear', 5100.00, 5000.00, NULL, true),
  ('a0000004-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Bitcoin', 'crypto', 'Binance', 3200.00, 3000.00, NULL, true),
  ('a0000005-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'IVVB11', 'etf', 'Clear', 4800.00, 5000.00, NULL, true)
ON CONFLICT DO NOTHING;

-- Transações de investimento
INSERT INTO investment_transactions (investment_id, account_id, type, amount, date, note) VALUES
  ('a0000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'aporte', 10000.00, current_date - interval '6 months', 'Aporte inicial'),
  ('a0000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'aporte', 5000.00, current_date - interval '2 months', 'Aporte mensal'),
  ('a0000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'rendimento', 800.00, current_date - interval '1 month', 'Rendimento Selic'),
  ('a0000002-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'aporte', 8000.00, current_date - interval '4 months', 'CDB Inter'),
  ('a0000002-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'rendimento', 200.00, current_date - interval '1 month', 'Rendimento CDI'),
  ('a0000003-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'aporte', 5000.00, current_date - interval '3 months', 'Compra 50 cotas'),
  ('a0000003-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'dividendo', 100.00, current_date - interval '1 month', 'Dividendos mensais'),
  ('a0000004-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'aporte', 3000.00, current_date - interval '5 months', 'BTC DCA'),
  ('a0000005-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'aporte', 5000.00, current_date - interval '2 months', 'ETF S&P500')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- RESUMO DOS DADOS INSERIDOS
-- =============================================================================
-- 
-- ✓ 1 usuário superadmin (martins@test.com)
-- ✓ 2 contas (Pessoal + Sogra)
-- ✓ 4 cartões de crédito (Nubank, Inter, C6, Nubank Sogra)
-- ✓ 12 templates recorrentes
-- ✓ ~100 lançamentos (últimos 4 meses)
-- ✓ 3 compras parceladas (notebook, iPhone, curso)
-- ✓ 23 faturas de cartão (para testes de negociação)
-- ✓ 5 investimentos com transações
-- =============================================================================
