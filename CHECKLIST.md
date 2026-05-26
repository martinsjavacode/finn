# 🔧 Finn — Checklist de Melhorias

Baseado na análise completa de UX, UI, Arquitetura, Performance e Acessibilidade.

---

## 🔴 Alta Prioridade ✅ CONCLUÍDA

### Acessibilidade Crítica
- [x] Reescrever Select com WAI-ARIA Listbox (role="listbox", role="option", aria-expanded, arrow keys, Enter, Escape)
- [x] Implementar `useFocusTrap` hook
- [x] Aplicar focus trap no ConfirmDialog
- [x] Aplicar focus trap nos modais de edição (todas as pages via useModal)
- [x] MobileCard: adicionar `role="button"`, `tabIndex={0}`, `onKeyDown` quando `onTap` presente
- [x] Touch targets: min 44×44px em `.edit-btn`, `.paid-btn`, `.pagination-btn`
- [x] Pagination buttons: adicionar `aria-label="Página anterior"` / `aria-label="Próxima página"`
- [x] Search input: adicionar `aria-label="Buscar lançamentos"`
- [x] Skeleton: adicionar `aria-hidden="true"`
- [x] Focus-visible global: `*:focus-visible { outline: 2px solid var(--purple); outline-offset: 2px }`
- [x] Corrigir contraste `--text-muted`: de `#64748b` para `#7c8db5` (≥4.5:1)

### Segurança
- [x] Criar componente `ProtectedRoute` com check de permissão
- [x] Aplicar guard em `/access` (isOwner)
- [x] Aplicar guard em `/roles` (isOwner)
- [x] Aplicar guard em `/transactions` (can transactions.read)
- [x] Aplicar guard em `/recurring` (can recurring_templates.read)
- [x] Aplicar guard em `/budgets` (can budgets.read)
- [x] Aplicar guard em `/categories` (can categories.read)
- [x] Aplicar guard em `/cards` (can cards.read)

### Performance
- [x] Code splitting: converter pages para `React.lazy()` + `Suspense`
- [x] Remover import estático de todas as pages em App.tsx

### Bugs CSS
- [x] Definir `--accent` no `:root` (usado em skip-link, form-toggle, btn-invoice)
- [x] Definir `--card` no `:root` (usado em pagination-btn, pagination-select)

### Arquitetura
- [x] Extrair `TransactionsPage` de App.tsx para `src/components/transactions/TransactionsPage.tsx`
- [x] Atualizar import em App.tsx para usar lazy import

---

## 🟡 Média Prioridade ✅ CONCLUÍDA

### Componente Modal ✅
- [x] Criar `src/components/ui/Modal.tsx` com focus trap, overlay, Escape, aria
- [x] Refatorar RecurringTemplates para usar `<Modal>`
- [x] Refatorar CategoriesPage para usar `<Modal>`
- [x] Refatorar CardsPage para usar `<Modal>`
- [x] Refatorar BudgetsPage para usar `<Modal>`
- [x] Refatorar AccessPage para usar `<Modal>`
- [x] Refatorar RolesPage para usar `<Modal>`

### Migrar CRUD pages para TanStack Query ✅
- [x] RecurringTemplates: substituir useState+useEffect por useQuery/useMutation
- [x] CategoriesPage: substituir useState+useEffect por useQuery/useMutation
- [x] CardsPage: substituir useState+useEffect por useQuery/useMutation
- [x] BudgetsPage: substituir useState+useEffect por useQuery/useMutation
- [x] AccessPage: substituir useState+useEffect por useQuery/useMutation
- [x] RolesPage: substituir useState+useEffect por useQuery/useMutation

### Skeleton loading ✅
- [x] RecurringTemplates: adicionar TableSkeleton durante isLoading
- [x] CategoriesPage: adicionar TableSkeleton durante isLoading
- [x] CardsPage: adicionar TableSkeleton durante isLoading
- [x] BudgetsPage: adicionar TableSkeleton durante isLoading
- [x] AccessPage: adicionar TableSkeleton durante isLoading
- [x] RolesPage: adicionar TableSkeleton durante isLoading

### Novos componentes UI ✅
- [x] Criar `src/components/ui/Badge.tsx` (variants: success, danger, warning, info)
- [x] Criar `src/components/ui/Input.tsx` (label, error, helper text, icon)
- [x] Substituir badges inline por `<Badge>` em TransactionsTable
- [x] Substituir badges inline por `<Badge>` em AccessPage
- [x] Substituir badges inline por `<Badge>` em RecurringTemplates
- [x] Substituir badges inline por `<Badge>` em CardsPage

### Type safety ✅
- [x] Mover `ClosingRule` e `CardWithRule` de utils/format.ts para types/database.ts
- [x] Atualizar imports em utils/format.ts e CardsPage
- [x] Regenerar Database types com `supabase gen types`
- [x] Eliminar todos os `as never` casts (0 em produção)

### CSS modularização ✅
- [x] Criar `src/styles/variables.css` (extrair :root variables)
- [x] Criar `src/styles/reset.css` (extrair *, body, global resets)
- [x] Criar `src/styles/layout.css` (extrair .layout, .sidebar, .main, .skip-link)
- [x] Criar `src/styles/components.css` (extrair controls, cards, tables, badges, buttons, pagination)
- [x] Criar `src/styles/modals.css` (extrair .modal-overlay, .modal)
- [x] Criar `src/styles/forms.css` (extrair form styles + invoice bar)
- [x] Criar `src/styles/responsive.css` (extrair @media queries)
- [x] Atualizar App.css para importar módulos
- [x] Remover App.css monolítico (substituído por imports)

### Performance Dashboard ✅
- [x] Adicionar `useMemo` para `maxValue`
- [x] Adicionar `useMemo` para `trend` (média móvel)
- [x] Adicionar `useMemo` para `expenses`, `catData`, `balance`, `paidPercent`

### Melhorias de hooks ✅
- [x] Adicionar error handling em queryFn (throw on error em useTransactions)
- [x] Criar `TRANSACTION_KEYS` constants compartilhadas
- [x] Unificar `invalidate()` via `invalidateTransactions()` exportada
- [x] `getUserRole`: separar side-effect de ativação em função dedicada

---

## 🟢 Baixa Prioridade

### UX Polish
- [ ] Self-host Inter font (eliminar Google Fonts request externo)
- [ ] Remover pesos não usados (700, 800) do font import
- [ ] URL state para filtros (month, category, owner em searchParams)
- [ ] Empty states com ilustração SVG + CTA contextual
- [ ] Button: adicionar prop `loading` com spinner
- [ ] Keyboard shortcuts: Cmd+K busca global, N novo lançamento
- [ ] View Transitions API para navegação entre rotas
- [ ] Remover `animation: fadeIn` do `.main` (causa flash)

### UX Mobile
- [ ] Bottom navigation (tab bar) em vez de hamburger menu
- [ ] Pull-to-refresh gesture para PWA
- [ ] Floating Action Button para "Novo Lançamento"
- [ ] Swipe-to-delete em MobileCards

### Layout
- [ ] Content max-width 1200px no `.main`
- [ ] Spacing scale com CSS variables (--space-1 a --space-8, base 4px)
- [ ] Sidebar colapsável para ícones em tablets (768-1024px)
- [ ] Breakpoint intermediário 768px para tablet portrait
- [ ] Container queries em SummaryCards

### Dashboard
- [ ] Extrair SVG chart em componente separado (LineChart)
- [ ] Extrair pie chart em componente separado (PieChart)
- [ ] Extrair budget progress em componente separado (BudgetProgress)
- [ ] Adicionar keyboard navigation no gráfico SVG (tabIndex nos pontos)
- [ ] Error state para queries que falham

### Arquitetura avançada
- [ ] `useCrudQuery` factory hook para CRUD pages
- [ ] Error boundaries por rota (não apenas global)
- [ ] Parallelize Projection fallback (Promise.all em vez de loop sequencial)
- [ ] `fetchAvailableMonths`: usar DISTINCT query ou RPC em vez de fetch all
- [ ] Remover `deleteCreditCard` (duplicata de `deleteTransaction`)
- [ ] `insertTransaction`: aceitar payment_method como parâmetro

### Performance avançada
- [ ] Remover `backdrop-filter: blur()` em mobile (usar bg sólido)
- [ ] Substituir `body::before` gradient por `background` no body
- [ ] Preconnect Supabase no index.html
- [ ] Service worker: cache de assets estáticos (já tem sw.js, verificar estratégia)

---

## 📊 Métricas de Sucesso

| Métrica | Antes | Depois | Meta |
|---------|-------|--------|------|
| Bundle JS inicial | 549KB | 485KB (+ lazy chunks) | <200KB |
| Code splitting | ❌ | ✅ 9 chunks | ✅ |
| CSS variables indefinidas | 2 | 0 | 0 |
| CSS monolítico | 1 arquivo (400+ linhas) | 7 módulos | ✅ |
| Rotas sem permission guard | 7 | 0 | 0 |
| Componentes sem keyboard nav | 2 (Select, MobileCard) | 0 | 0 |
| Focus trap em modais | ❌ | ✅ | ✅ |
| Touch targets < 44px | 4 componentes | 0 | 0 |
| Contraste WCAG AA | ❌ (4.2:1) | ✅ (4.5:1+) | ≥4.5:1 |
| Pages sem TanStack Query | 7 | 0 | 0 |
| Pages sem loading skeleton | 7 | 0 | 0 |
| Linhas duplicadas (modal pattern) | ~210 | 0 (Modal component) | 0 |
| Circular dependency (types↔utils) | 1 | 0 | 0 |
| Dashboard sem useMemo | 5 cálculos | 0 | 0 |
| Query keys duplicadas | 2 hooks | 1 shared constant | ✅ |
| `as never` casts | 9 | 0 | 0 |
