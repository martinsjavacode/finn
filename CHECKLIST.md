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

## 🟡 Média Prioridade

### Componente Modal (eliminar duplicação)
- [ ] Criar `src/components/ui/Modal.tsx` com focus trap, overlay, Escape, aria
- [ ] Refatorar AddTransaction para usar `<Modal>`
- [ ] Refatorar RecurringTemplates para usar `<Modal>`
- [ ] Refatorar CategoriesPage para usar `<Modal>`
- [ ] Refatorar CardsPage para usar `<Modal>`
- [ ] Refatorar BudgetsPage para usar `<Modal>`
- [ ] Refatorar AccessPage para usar `<Modal>`
- [ ] Refatorar RolesPage para usar `<Modal>`

### Migrar CRUD pages para TanStack Query
- [ ] RecurringTemplates: substituir useState+useEffect por useQuery/useMutation
- [ ] CategoriesPage: substituir useState+useEffect por useQuery/useMutation
- [ ] CardsPage: substituir useState+useEffect por useQuery/useMutation
- [ ] BudgetsPage: substituir useState+useEffect por useQuery/useMutation
- [ ] AccessPage: substituir useState+useEffect por useQuery/useMutation
- [ ] RolesPage: substituir useState+useEffect por useQuery/useMutation
- [ ] Projection: substituir useState+useEffect por useQuery

### Skeleton loading em todas as pages
- [ ] RecurringTemplates: adicionar TableSkeleton durante isLoading
- [ ] CategoriesPage: adicionar TableSkeleton durante isLoading
- [ ] CardsPage: adicionar TableSkeleton durante isLoading
- [ ] BudgetsPage: adicionar TableSkeleton durante isLoading
- [ ] AccessPage: adicionar TableSkeleton durante isLoading
- [ ] RolesPage: adicionar TableSkeleton durante isLoading

### Novos componentes UI
- [ ] Criar `src/components/ui/Badge.tsx` (variants: success, danger, warning, info)
- [ ] Criar `src/components/ui/Input.tsx` (label, error, helper text, icon)
- [ ] Substituir badges inline por `<Badge>` em TransactionsTable
- [ ] Substituir badges inline por `<Badge>` em AccessPage
- [ ] Substituir badges inline por `<Badge>` em RecurringTemplates
- [ ] Substituir badges inline por `<Badge>` em CardsPage

### CSS modularização
- [ ] Criar `src/styles/variables.css` (extrair :root variables)
- [ ] Criar `src/styles/reset.css` (extrair *, body, global resets)
- [ ] Criar `src/styles/layout.css` (extrair .layout, .sidebar, .main, .skip-link)
- [ ] Criar `src/styles/controls.css` (extrair .controls, .search-input, .custom-select)
- [ ] Criar `src/styles/cards.css` (extrair .card, .grid, .summary)
- [ ] Criar `src/styles/tables.css` (extrair table, th, td, .badge)
- [ ] Criar `src/styles/modals.css` (extrair .modal-overlay, .modal, .form-actions)
- [ ] Criar `src/styles/forms.css` (extrair input, select, label, .form-toggle)
- [ ] Criar `src/styles/responsive.css` (extrair @media queries)
- [ ] Atualizar imports em App.tsx para novos CSS files
- [ ] Remover App.css monolítico

### Type safety
- [ ] Regenerar Database types com `supabase gen types typescript`
- [ ] Eliminar todos os `as never` casts (9 ocorrências)
- [ ] Mover `ClosingRule` e `CardWithRule` de utils/format.ts para types/database.ts
- [ ] Atualizar imports em utils/format.ts

### Performance Dashboard
- [ ] Adicionar `useMemo` para `catData` (cálculo por categoria)
- [ ] Adicionar `useMemo` para `trend` (média móvel)
- [ ] Adicionar `useMemo` para `expenses` filter
- [ ] Adicionar `useMemo` para `buildConicGradient`

### Melhorias de hooks
- [ ] Adicionar error handling em queryFn (não descartar errors silenciosamente)
- [ ] `useAuth`: separar em hooks menores (useSession + useRole) se necessário
- [ ] `getUserRole`: separar side-effect de ativação em função dedicada
- [ ] Unificar `invalidate()` entre useTransactions e useTransactionMutations

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
| Rotas sem permission guard | 7 | 0 | 0 |
| Componentes sem keyboard nav | 2 (Select, MobileCard) | 0 | 0 |
| Focus trap em modais | ❌ | ✅ | ✅ |
| Touch targets < 44px | 4 componentes | 0 | 0 |
| Contraste WCAG AA | ❌ (4.2:1) | ✅ (4.5:1+) | ≥4.5:1 |
| Lighthouse Accessibility | ~70 (estimado) | ~85 (estimado) | ≥95 |
| Lighthouse Performance | ~80 (estimado) | ~85 (estimado) | ≥90 |
| Linhas duplicadas (modal pattern) | ~210 | ~210 | 0 |
| `as never` casts | 9 | 9 | 0 |
| Pages sem loading skeleton | 7 | 7 | 0 |
