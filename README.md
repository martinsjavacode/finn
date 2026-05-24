# 💰 Finn - Controle Financeiro

Aplicação de controle financeiro pessoal com dashboard de receitas, despesas e cartões de crédito.

## Stack

- React 19 + TypeScript + Vite
- Supabase (PostgreSQL + Auth com Magic Link)
- Deploy via GitHub Pages

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173/finn/`

## Build e deploy

```bash
npm run build
```

O deploy é automático via GitHub Actions ao fazer push na `main`.

## Banco de dados (Supabase)

### Tabelas

| Tabela | Descrição |
|--------|-----------|
| `categories` | Categorias de lançamentos (Casa, Empresa, Estudos, etc.) |
| `transactions` | Receitas e despesas mensais |
| `credit_cards` | Lançamentos de cartão de crédito |
| `installment_purchases` | Compras parceladas (gera parcelas automaticamente) |

### Migrations (rodar no SQL Editor do Supabase, em ordem)

1. `migration-categories.sql` — cria tabela de categorias e altera transactions
2. `migration-auth-rls.sql` — RLS para leitura apenas autenticados
3. `migration-installments.sql` — tabela e trigger de parcelamentos

### Parcelamentos

Ao inserir em `installment_purchases`, um trigger distribui as parcelas automaticamente.

**Cartão parcelado:**
```sql
insert into installment_purchases (start_month, description, total_amount, installments, owner, target, card)
values ('2026-06-01', 'Geladeira', 3600.00, 12, 'personal', 'credit_card', 'nubank');
```

**Boleto/Pix parcelado:**
```sql
insert into installment_purchases (start_month, description, total_amount, installments, owner, target, category)
values ('2026-06-01', 'Remédio TG', 1426.44, 3, 'personal', 'transaction',
  (select id from categories where name='misc'));
```

## Funcionalidades

- Autenticação via Magic Link (email)
- Dashboard com resumo financeiro mensal
- Filtro por mês e por responsável (Pessoal / Sogra)
- Tabela de lançamentos com filtro por categoria
- Tabela de cartões com filtro por bandeira
- Parcelamentos automáticos (cartão, boleto ou pix)

## Cartões suportados

Nubank, Bradesco, Inter, Pague Menos, Mercado Pago, Neon

## Categorias

Casa, Empresa, Estudos, Diversas, Lazer, Investimento, Espiritual
