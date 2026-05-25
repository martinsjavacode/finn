# Roadmap - Finn

## Operacionais (dia a dia)
- [x] Formulário de adicionar lançamento (receita/despesa/cartão)
- [x] Lançamentos recorrentes (templates mensais automáticos)
- [x] Editar/excluir lançamentos na UI

## Visibilidade
- [x] Gráfico de evolução mensal (receita vs despesa)
- [x] Percentual por categoria (pizza/barra)
- [x] Indicador de progresso de pagamento do mês

## Planejamento
- [x] Orçamento por categoria (limite vs gasto)
- [x] Projeção dos próximos meses (comprometido futuro)
- [x] Alertas de vencimento (próximos dias)

## Qualidade de vida
- [x] Busca por descrição
- [ ] Exportar para CSV
- [ ] Dark/light mode toggle

## Usabilidade
- [ ] Duplicar mês (copiar lançamentos como base para o próximo)
- [x] Edição inline nas tabelas (clicar no valor/descrição e editar direto)
- [x] Filtro por status de pagamento (pendentes / pagos)

## Visão
- [ ] Resumo anual (total receita/despesa/saldo do ano)
- [ ] Comparativo mês anterior (% variação no dashboard)

## Polish
- [x] Responsivo mobile (menu hamburger)
- [ ] ~~Notificação por email (lembrete de vencimento via Edge Functions)~~ — despriorizado
- [x] PWA (instalar como app no celular)

## Robustez
- [x] Error handling com toast notifications em todas as operações Supabase
- [x] Tipagem completa do Database (todas as 8 tabelas)
- [x] Confirmação antes de exclusões
- [x] Testes unitários (Vitest + Testing Library)
- [x] Error boundaries (React) para evitar tela branca
- [x] Loading states/skeletons em todas as páginas

## Refatoração
- [x] Extrair `fmt()` e utilitários duplicados para `src/utils/`
- [x] Extrair custom hooks (`useTransactions`, `useAuth`, `useCategories`)
- [x] Extrair CSS compartilhado (classes genéricas em `shared.css`)
- [x] Reduzir prop drilling com Context para dados globais

## Performance
- [x] Criar RPC agregada para Projection (evitar 12 queries em loop)
- [x] `useMemo`/`useCallback` nos handlers passados como props
- [ ] React Query ou SWR para cache e retry automático

## Infraestrutura
- [x] CI/CD pipeline progressivo (feature → develop → main → deploy)
- [x] Fix git user para criação de tags válidas
- [x] React Router para deep linking e navegação por URL
- [ ] Accessibility audit (axe-core, focus trap em modais, aria-labels)
- [ ] i18n (preparar para internacionalização)
