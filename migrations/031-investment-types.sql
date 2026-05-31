-- Adicionar novos tipos de investimento ao enum existente
-- ⚠️  No Supabase SQL Editor, rode CADA linha separadamente (uma por vez).
--     ALTER TYPE ADD VALUE não funciona dentro de uma transação.

alter type investment_type add value if not exists 'fii';
alter type investment_type add value if not exists 'fiagro';
alter type investment_type add value if not exists 'etf';
alter type investment_type add value if not exists 'fundo_multi';
alter type investment_type add value if not exists 'fundo_acoes';
