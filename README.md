# 💰 Finn - Controle Financeiro

Aplicação de controle financeiro pessoal com dashboard, lançamentos, cartões de crédito, parcelamentos e projeção futura.

## Stack

- React 19 + TypeScript + Vite
- Supabase (PostgreSQL + Auth com OTP/GitHub)
- Deploy via GitHub Pages

## Rodar localmente

```bash
npm install
cp .env.example .env
# Edite .env com sua VITE_SUPABASE_ANON_KEY
npm run dev
```

Acesse `http://localhost:5173/finn/`

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_ANON_KEY` | Anon Key do projeto Supabase (a URL é extraída automaticamente do JWT) |

## Build e deploy

```bash
npm run build
```

O deploy é automático via GitHub Actions ao fazer push na `main`. Configure `VITE_SUPABASE_ANON_KEY` como secret no repositório.

## Banco de dados (Supabase)

### Tabelas

| Tabela | Descrição |
|--------|-----------|
| `categories` | Categorias de lançamentos |
| `transactions` | Receitas e despesas mensais |
| `credit_cards` | Lançamentos de cartão de crédito |
| `installment_purchases` | Compras parceladas (gera parcelas automaticamente) |
| `recurring_templates` | Templates de lançamentos recorrentes |
| `budgets` | Orçamento mensal por categoria |
| `access_control` | Controle de acesso (email + role) |

### Migrations (rodar no SQL Editor do Supabase, em ordem)

1. `migration-categories.sql` — tabela de categorias
2. `migration-auth-rls.sql` — RLS para leitura autenticados
3. `migration-installments.sql` — parcelamentos com trigger
4. `migration-crud.sql` — policies de insert/delete/update
5. `migration-recurring.sql` — templates recorrentes + função generate
6. `migration-budgets.sql` — orçamentos por categoria
7. `migration-access.sql` — controle de acesso

## Funcionalidades

### Autenticação
- Login via OTP por email (só emails autorizados)
- Login via GitHub (acesso total)
- Controle de acesso: Viewer (somente leitura) / Editor (CRUD completo)

### Dashboard
- Gráfico de evolução anual (receita vs despesa)
- Gráfico de pizza por categoria
- Orçamento por categoria (limite vs gasto)
- Progresso de pagamento do mês
- Alertas de contas pendentes

### Lançamentos
- Tabela de receitas/despesas com filtros (mês, responsável, tipo, categoria, busca)
- Tabela de cartões de crédito com filtro por bandeira
- Adicionar/excluir lançamentos
- Marcar como pago

### Recorrentes
- Cadastro de templates (aluguel, internet, etc.)
- Geração automática de lançamentos por mês selecionado
- Ativar/desativar templates

### Projeção
- Visão dos próximos 6 meses com valores comprometidos (recorrentes + parcelamentos)

### Orçamentos
- Definir limite mensal por categoria
- Visualização no dashboard com barra de progresso

### Parcelamentos
- Cartão parcelado ou boleto/pix parcelado
- Trigger automático distribui parcelas nos meses

## Cartões suportados

Nubank, Bradesco, Inter, Pague Menos, Mercado Pago, Neon

## Categorias

Casa, Empresa, Estudos, Diversas, Lazer, Investimento, Espiritual

## Estrutura do projeto

```
src/
├── components/
│   ├── ui/            — Button, Select, Sidebar
│   ├── auth/          — Auth (login)
│   ├── dashboard/     — Dashboard, SummaryCards
│   ├── transactions/  — TransactionsTable, CardsTable, AddTransaction
│   ├── recurring/     — RecurringTemplates
│   ├── budgets/       — BudgetsPage
│   ├── projection/    — Projection
│   └── access/        — AccessPage
├── lib/               — Supabase client
├── types/             — TypeScript types
└── App.tsx            — Router e estado global
```
