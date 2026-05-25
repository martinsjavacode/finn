# 💰 Finn - Controle Financeiro

[![Deploy](https://github.com/martinsjavacode/finn/actions/workflows/deploy.yml/badge.svg)](https://github.com/martinsjavacode/finn/actions/workflows/deploy.yml)
[![CI Feature](https://github.com/martinsjavacode/finn/actions/workflows/ci-feature.yml/badge.svg)](https://github.com/martinsjavacode/finn/actions/workflows/ci-feature.yml)
[![CI Main](https://github.com/martinsjavacode/finn/actions/workflows/ci-main.yml/badge.svg)](https://github.com/martinsjavacode/finn/actions/workflows/ci-main.yml)
![Version](https://img.shields.io/github/package-json/v/martinsjavacode/finn?color=purple)
![Node](https://img.shields.io/badge/node-%3E%3D24-green)
![React](https://img.shields.io/badge/react-19-blue)
![TypeScript](https://img.shields.io/badge/typescript-6-blue)
![License](https://img.shields.io/github/license/martinsjavacode/finn)
![Last Commit](https://img.shields.io/github/last-commit/martinsjavacode/finn)

Aplicação de controle financeiro pessoal com dashboard, lançamentos, cartões de crédito, parcelamentos e projeção futura.

## Stack

- React 19 + TypeScript + Vite
- Supabase (PostgreSQL + Auth com OTP/GitHub)
- Deploy via GitHub Pages
- CI/CD com GitHub Actions (commitlint, ESLint, CodeQL, gitleaks)

## Rodar localmente

```bash
npm install
cp .env.example .env
# Edite .env com sua VITE_SUPABASE_ANON_KEY
npm run dev
```

Acesse `http://localhost:5173/finn/`

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm run commit` | Commitizen (commit padronizado) |
| `npm run release` | Bump de versão + changelog |

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_ANON_KEY` | Anon Key do projeto Supabase (a URL é extraída automaticamente do JWT) |

## CI/CD Pipeline

```
feature push → commitlint + tsc + lint + build → abre PR para develop
develop merge → lint + build + bundle size + gitleaks → abre PR para main
main merge → lint + build + CodeQL + npm audit → tag automática → deploy
```

Configure no repositório:
- Secret `VITE_SUPABASE_ANON_KEY`
- Settings → Actions → Allow GitHub Actions to create PRs
- Settings → Environments → github-pages → Add tag rule `v*`

## Banco de dados (Supabase)

### Tabelas

| Tabela | Descrição |
|--------|-----------|
| `categories` | Categorias de lançamentos |
| `cards` | Cartões de crédito cadastrados |
| `transactions` | Receitas e despesas mensais |
| `credit_cards` | Lançamentos de cartão de crédito |
| `installment_purchases` | Compras parceladas (gera parcelas automaticamente) |
| `recurring_templates` | Templates de lançamentos recorrentes |
| `budgets` | Orçamento mensal por categoria |
| `access_control` | Controle de acesso (email + role) |

### Migrations (rodar no SQL Editor do Supabase, em ordem)

```
migrations/
├── 001-categories.sql    — tabela de categorias + FK em transactions
├── 002-auth-rls.sql      — RLS para leitura autenticados
├── 003-installments.sql  — parcelamentos com trigger + campo paid
├── 004-crud.sql          — policies de insert/delete/update
├── 005-recurring.sql     — templates recorrentes + função generate
├── 006-budgets.sql       — orçamentos por categoria
├── 007-access.sql        — controle de acesso (email + role)
└── 008-cards.sql         — cartões de crédito cadastrados
```

## Funcionalidades

### Autenticação
- Login via OTP por email (só emails autorizados)
- Login via GitHub (acesso total)
- Controle de acesso: Viewer (somente leitura) / Editor (CRUD completo)

### Dashboard
- Gráfico de evolução anual em linhas (receita vs despesa)
- Gráfico de pizza por categoria
- Orçamento por categoria (limite vs gasto)
- Progresso de pagamento do mês
- Alertas de contas pendentes

### Lançamentos
- Tabela de receitas/despesas com filtros (mês, responsável, tipo, categoria, busca)
- Tabela de cartões de crédito com filtro por bandeira
- Adicionar/editar/excluir lançamentos
- Edição inline (data, descrição, valor, categoria, responsável)
- Marcar como pago

### Recorrentes
- Cadastro de templates (aluguel, internet, etc.)
- Geração automática de lançamentos por mês selecionado
- Ativar/desativar templates

### Projeção
- Visão dos próximos 6 meses com despesas comprometidas (recorrentes + parcelamentos)

### Orçamentos
- Definir limite mensal por categoria
- Visualização no dashboard com barra de progresso

### Categorias
- CRUD completo de categorias

### Cartões
- CRUD de cartões (nome, limite, fechamento, vencimento, cor)
- Dados dinâmicos do banco (sem hardcode)

### Parcelamentos
- Cartão parcelado ou boleto/pix parcelado
- Trigger automático distribui parcelas nos meses

### Controle de Acesso
- Cadastro de emails autorizados
- Roles: Viewer / Editor
- GitHub login = sempre Editor (owner)

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
│   ├── categories/    — CategoriesPage
│   ├── cards/         — CardsPage
│   ├── projection/    — Projection
│   └── access/        — AccessPage
├── lib/               — Supabase client
├── types/             — TypeScript types
└── App.tsx            — Router e estado global
```
