-- JUNHO 2026 - Lançamentos

-- DESPESAS PESSOAIS - Casa
INSERT INTO transactions (month, category, description, amount, type, owner) VALUES
('2026-06-16', (select id from categories where name='house'), 'Aluguel', 4851.02, 'expense', 'personal'),
('2026-06-01', (select id from categories where name='house'), 'Seguro Incêndio Jamil', 285.00, 'expense', 'personal'),
('2026-06-16', (select id from categories where name='house'), 'Internet', 140.00, 'expense', 'personal'),
('2026-06-16', (select id from categories where name='house'), 'Ituran Seguro Carro', 180.00, 'expense', 'personal'),
('2026-06-30', (select id from categories where name='house'), 'CPFL', 600.00, 'expense', 'personal'),
('2026-06-30', (select id from categories where name='house'), 'Sabesp', 230.00, 'expense', 'personal'),
('2026-06-30', (select id from categories where name='house'), 'Claro Ale', 60.00, 'expense', 'personal'),
('2026-06-30', (select id from categories where name='house'), 'Claro Dani', 60.00, 'expense', 'personal');

-- DESPESAS PESSOAIS - Empresa
INSERT INTO transactions (month, category, description, amount, type, owner) VALUES
('2026-06-16', (select id from categories where name='business'), 'DAS', 1100.00, 'expense', 'personal'),
('2026-06-16', (select id from categories where name='business'), 'INSS Dani', 90.00, 'expense', 'personal'),
('2026-06-16', (select id from categories where name='business'), 'Daluz Contabilidade', 428.80, 'expense', 'personal'),
('2026-06-16', (select id from categories where name='business'), 'INSS Ale', 360.00, 'expense', 'personal');

-- DESPESAS PESSOAIS - Estudos
INSERT INTO transactions (month, category, description, amount, type, owner) VALUES
('2026-06-16', (select id from categories where name='education'), 'Perua Escolar', 400.00, 'expense', 'personal'),
('2026-06-16', (select id from categories where name='education'), 'Escola Yasmin', 1390.45, 'expense', 'personal'),
('2026-06-10', (select id from categories where name='education'), 'Teologia Tuca', 320.00, 'expense', 'personal');

-- DESPESAS PESSOAIS - Diversas (não parceladas)
INSERT INTO transactions (month, category, description, amount, type, owner) VALUES
('2026-06-16', (select id from categories where name='misc'), 'Consórcio', 1056.13, 'expense', 'personal'),
('2026-06-16', (select id from categories where name='misc'), 'Consórcio', 362.00, 'expense', 'personal');

-- DESPESAS SOGRA
INSERT INTO transactions (month, category, description, amount, type, owner) VALUES
('2026-06-16', (select id from categories where name='house'), 'Aluguel Pedro Furlan', 1690.03, 'expense', 'mother_in_law'),
('2026-06-16', (select id from categories where name='misc'), 'Lar dos Velhinhos', 3242.00, 'expense', 'mother_in_law');

-- RECEITAS PESSOAIS
INSERT INTO transactions (month, category, description, amount, type, owner) VALUES
('2026-06-16', (select id from categories where name='business'), 'K2', 16000.00, 'income', 'personal'),
('2026-06-30', (select id from categories where name='business'), 'ZUP', 11100.00, 'income', 'personal');

-- RECEITAS SOGRA
INSERT INTO transactions (month, category, description, amount, type, owner) VALUES
('2026-06-27', (select id from categories where name='misc'), 'CDHU', 1200.00, 'income', 'mother_in_law'),
('2026-06-01', (select id from categories where name='misc'), 'Aposento Vó', 1621.00, 'income', 'mother_in_law'),
('2026-06-06', (select id from categories where name='misc'), 'Pensão Vó', 1621.00, 'income', 'mother_in_law');

-- PARCELAMENTOS (boleto/pix) - gera parcelas automaticamente em transactions
INSERT INTO installment_purchases (start_month, description, total_amount, installments, owner, target, category) VALUES
('2026-06-16', 'Remédio TG', 1426.44, 3, 'personal', 'transaction', (select id from categories where name='misc')),
('2026-04-22', 'Passeio Escolar Yasmin', 450.00, 3, 'personal', 'transaction', (select id from categories where name='misc')),
('2026-03-16', 'Pri Cabelereira', 920.00, 4, 'personal', 'transaction', (select id from categories where name='misc')),
('2026-05-16', 'Edredons Tia', 440.00, 4, 'personal', 'transaction', (select id from categories where name='misc'));

-- CARTÕES DE CRÉDITO - Junho 2026
INSERT INTO credit_cards (month, card, description, amount, current_installment, total_installments, owner) VALUES
('2026-06-01', 'nubank', 'Fatura Nubank', 500.00, NULL, NULL, 'personal'),
('2026-06-01', 'bradesco', 'Fatura Bradesco', 8000.00, NULL, NULL, 'personal'),
('2026-06-01', 'pague_menos', 'Fatura Pague Menos', 907.13, NULL, NULL, 'personal'),
('2026-06-01', 'mercado_pago', 'Fatura Mercado Pago', 700.00, NULL, NULL, 'personal'),
('2026-06-01', 'inter', 'Fatura Inter', 2500.00, NULL, NULL, 'personal');
