-- Recriar enum investment_type sem fundo_rf
alter table investments alter column type type text;
drop type investment_type;
create type investment_type as enum ('renda_fixa', 'renda_variavel', 'crypto', 'fundo', 'fii', 'fiagro', 'etf', 'fundo_multi', 'fundo_acoes');
alter table investments alter column type type investment_type using type::investment_type;
