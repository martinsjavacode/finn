-- Tipos de investimento adicionais
-- NOTA: Os valores já estão incluídos na criação do enum em 029-investments.sql.
-- Esta migration existia apenas para o banco remoto onde o enum foi criado parcialmente.
-- No Supabase local (db:reset), a 029 já cria tudo correto.

-- no-op (ALTER TYPE ADD VALUE não funciona em transação)
