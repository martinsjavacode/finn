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

Aplicação de controle financeiro pessoal com dashboard, lançamentos, cartões de crédito, parcelamentos e projeção futura. PWA instalável com layout responsivo e RBAC granular.

## Stack

- React 19 + TypeScript 6 + Vite 8
- React Router 7 (navegação por URL)
- TanStack Query (cache, retry, loading automático)
- Supabase (PostgreSQL + Auth + RLS + RPC)
- RBAC (roles + permissions granulares por recurso/ação)
- Vitest + Testing Library (38 testes)
- Deploy via GitHub Pages (PWA)
- CI/CD com GitHub Actions (commitlint, ESLint, CodeQL, gitleaks)

## Rodar localmente

```bash
npm install
cp .env.example .env
# Edite .env com sua VITE_SUPABASE_ANON_KEY
npm run dev
```

Acesse `http://localhost:5173/finn/`

## Setup inicial (Supabase)

1. Rode todas as migrations em ordem no SQL Editor
2. Cadastre o owner na tabela `users`:
```sql
INSERT INTO users (email, display_name, role_id, activated)
VALUES ('seu@email.com', 'Seu Nome', (SELECT id FROM roles WHERE name = 'owner'), false);
```
3. Acesse o app e crie sua conta (tela de login → "Criar conta")

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm test` | Testes (watch mode) |
| `npm run test:run` | Testes (CI, execução única) |
| `npm run commit` | Commitizen (commit padronizado) |
| `npm run release` | Bump de versão + changelog |

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_ANON_KEY` | Anon Key do projeto Supabase (a URL é extraída automaticamente do JWT) |

## CI/CD Pipeline

```
feature push → commitlint + tsc + lint + test + build → abre PR para develop
develop merge → lint + test + build + bundle size + gitleaks → abre PR para main
main merge → lint + test + build + CodeQL + npm audit → tag automática → deploy
```

Configure no repositório:
- Secret `VITE_SUPABASE_ANON_KEY`
- Settings → Actions → Allow GitHub Actions to create PRs
- Settings → Environments → github-pages → Add tag rule `v*`

## Banco de dados (Supabase)

### Tabelas

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários autorizados (email + display_name + role_id + activated) |
| `roles` | Roles do sistema (owner, editor, viewer + custom) |
| `permissions` | Permissões (resource + action) |
| `role_permissions` | Relação N:N entre roles e permissions |
| `categories` | Categorias de lançamentos |
| `cards` | Cartões de crédito cadastrados |
| `transactions` | Receitas e despesas mensais |
| `credit_cards` | Lançamentos de cartão de crédito |
| `installment_purchases` | Compras parceladas (gera parcelas automaticamente) |
| `recurring_templates` | Templates de lançamentos recorrentes |
| `budgets` | Orçamento mensal por categoria |

### Funções RPC

| Função | Descrição |
|--------|-----------|
| `generate_recurring(target_month)` | Gera lançamentos do mês a partir dos templates ativos |
| `get_projection(months_ahead)` | Retorna projeção agregada (recorrentes + parcelas) |

### Migrations (rodar no SQL Editor do Supabase, em ordem)

```
migrations/
├── 001-categories.sql         — tabela de categorias + FK em transactions
├── 002-auth-rls.sql           — RLS para leitura autenticados
├── 003-installments.sql       — parcelamentos com trigger + campo paid
├── 004-crud.sql               — policies de insert/delete/update
├── 005-recurring.sql          — templates recorrentes + função generate
├── 006-budgets.sql            — orçamentos por categoria
├── 007-access.sql             — controle de acesso (email + role)
├── 008-cards.sql              — cartões de crédito cadastrados
├── 009-projection-rpc.sql     — RPC agregada para projeção futura
├── 010-access-display-name.sql — campo display_name
├── 011-access-activated.sql   — campo activated
├── 012-access-owner-role.sql  — role owner no check constraint
├── 013-rbac.sql               — tabelas roles, permissions, role_permissions + rename para users
└── 014-rbac-write-policies.sql — policies de escrita para tabelas RBAC
```

## Funcionalidades

### Autenticação
- Login com email + senha
- Login/cadastro via GitHub OAuth
- Cadastro self-service (só emails pré-autorizados em `users`)
- Redirect automático para dashboard após login
- Redirect para `/` ao sair
- Tela de acesso negado para emails não cadastrados

### RBAC (Controle de Acesso)
- 3 roles padrão: Owner, Editor, Viewer
- Permissões granulares por recurso × ação (read/create/update/delete)
- Botões de criar, editar e excluir condicionais por permissão
- Badges de status (Pago/Pendente, Ativo/Inativo) para usuários read-only
- Sidebar e ações condicionais baseadas em `can(resource, action)`
- Tela de gerenciamento de roles com matriz de permissões (owner only)
- Roles customizáveis (criar novas roles com permissões específicas)

### Dashboard
- Gráfico de evolução anual em linhas (receita vs despesa)
- Linha de tendência (média móvel 3 meses)
- Cards de resumo do mês (receita, despesa, saldo)
- Gráfico de pizza por categoria
- Orçamento por categoria (limite vs gasto)
- Progresso de pagamento do mês
- Alertas de contas pendentes

### Lançamentos
- Filtros por mês, responsável, tipo, categoria, status (pago/pendente), busca
- Paginação com seleção de itens por página (10/20/50)
- Tabela de cartões de crédito com filtro por bandeira
- Adicionar/editar/excluir (baseado em permissões)
- Edição via modal
- Marcar como pago

### Recorrentes
- Cadastro de templates (aluguel, internet, etc.)
- Geração automática de lançamentos por mês selecionado
- Ativar/desativar templates
- Edição via modal

### Projeção
- Visão dos próximos 6 meses com despesas comprometidas
- RPC agregada (1 query em vez de 12)

### Orçamentos
- Definir limite mensal por categoria
- Visualização no dashboard com barra de progresso

### Categorias
- CRUD completo de categorias

### Cartões
- CRUD de cartões (nome, limite, fechamento, vencimento, cor)
- Cor do cartão como indicador visual nos lançamentos (dot, tab, borda mobile)
- Edição via modal

### Parcelamentos
- Cadastro via modal (aba "Parcelado" no formulário de lançamentos)
- Cartão parcelado ou boleto/pix parcelado
- Preview do valor da parcela antes de salvar
- Trigger automático distribui parcelas nos meses

### Gerenciamento de Usuários (owner)
- Cadastro de emails autorizados com display name
- Atribuição de role por usuário
- Indicador de status (ativo/pendente)

### Mobile / PWA
- Layout responsivo com hamburger menu (≤ 1024px)
- Cards compactos em lista no mobile (tap para editar)
- Header fixo com título da página
- Instalável como app (manifest + service worker)

## Arquitetura

```
src/
├── components/
│   ├── ui/            — Button, Select, Sidebar, Toast, Skeleton, MobileCard, ErrorBoundary
│   ├── auth/          — Auth (login email+senha + GitHub)
│   ├── dashboard/     — Dashboard, SummaryCards
│   ├── transactions/  — TransactionsTable, CardsTable, AddTransaction
│   ├── recurring/     — RecurringTemplates
│   ├── budgets/       — BudgetsPage
│   ├── categories/    — CategoriesPage
│   ├── cards/         — CardsPage
│   ├── projection/    — Projection
│   ├── access/        — AccessPage (gerenciamento de usuários)
│   └── roles/         — RolesPage (gerenciamento de permissões)
├── hooks/             — useAuth, usePermissions, useTransactions, useAppData
├── services/          — auth, transactions, categories, recurring
├── utils/             — format (fmt, ownerLabel, monthRange, etc.)
├── lib/               — Supabase client, toast, confirm
├── types/             — TypeScript types (Database)
├── test/              — Vitest + Testing Library (32 testes)
└── App.tsx            — Router + Layout + ErrorBoundary
```

### Princípios aplicados

- **DRY** — Utilitários centralizados em `utils/format.ts`
- **SRP** — Camada de serviço separa acesso a dados dos componentes
- **OCP** — RBAC extensível via banco (novas roles/permissões sem alterar código)
- **KISS** — CSS global único, sem over-engineering
- **YAGNI** — Permissões granulares no banco, consumo simples no frontend (`can()`)
- **Clean Architecture** — hooks → services → supabase (camadas bem definidas)

## Testes

```bash
npm test          # watch mode
npm run test:run  # execução única (CI)
```

Cobertura: utils, services, hooks e componentes (Auth, Button, SummaryCards, ErrorBoundary).

## Use este projeto

Quer usar o Finn como base para seu próprio controle financeiro? Faça um **fork**:

1. Clique em **Fork** no GitHub
2. Clone seu fork: `git clone https://github.com/SEU_USER/finn.git`
3. Configure seu Supabase e `.env`
4. Personalize à vontade — o projeto é seu!
