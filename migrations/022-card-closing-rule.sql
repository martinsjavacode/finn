-- Motor de regras de fechamento de cartão
-- "fixed": usa closing_day como data fixa de fechamento
-- "relative": fechamento = due_day - days_before_due
create type closing_rule_type as enum ('fixed', 'relative');

alter table cards add column closing_rule closing_rule_type not null default 'fixed';
alter table cards add column days_before_due int not null default 7;
