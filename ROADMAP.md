# Roadmap - Finn

## ✅ Concluído

- [x] Formulário de adicionar lançamento (receita/despesa/cartão)
- [x] Lançamentos recorrentes (templates mensais automáticos)
- [x] Editar/excluir lançamentos na UI
- [x] Gráfico de evolução mensal (receita vs despesa)
- [x] Percentual por categoria (pizza)
- [x] Indicador de progresso de pagamento do mês
- [x] Orçamento por categoria (limite vs gasto)
- [x] Projeção dos próximos meses (comprometido futuro)
- [x] Alertas de vencimento (próximos dias)
- [x] Busca por descrição
- [x] Edição inline (desktop) e via modal (mobile)
- [x] Filtro por status de pagamento (pendentes/pagos)
- [x] Responsivo mobile/tablet (hamburger menu + cards compactos)
- [x] PWA (manifest + service worker)
- [x] Error handling com toast notifications
- [x] Tipagem completa do Database (8 tabelas)
- [x] Confirmação antes de exclusões
- [x] Testes unitários (Vitest + Testing Library — 34 testes)
- [x] Error boundaries para evitar tela branca
- [x] Loading states/skeletons
- [x] Camada de serviço (services/)
- [x] Custom hooks (useAuth, useTransactions, useAppData)
- [x] React Router para deep linking
- [x] RPC agregada para Projection
- [x] CI/CD pipeline progressivo (feature → develop → main → deploy)
- [x] Display name no controle de acesso
- [x] RBAC granular em todas as páginas (create/update/delete condicionais)
- [x] Badges de status (Pago/Pendente, Ativo/Inativo) para read-only
- [x] Redirect para dashboard após login
- [x] Redirect para `/` ao sair
- [x] Paginação client-side com seleção de itens por página

## 🎯 Curto prazo (quick wins)

- [ ] Exportar para CSV
- [ ] Resumo anual (total receita/despesa/saldo do ano)
- [ ] Comparativo mês anterior (% variação no dashboard)
- [ ] Duplicar mês (copiar lançamentos como base para o próximo)
- [ ] Gráfico de tendência (média móvel de gastos)

## 🔧 Técnico (qualidade)

- [ ] React Query para cache, retry e loading automático
- [ ] Accessibility audit (aria-labels, focus trap em modais, axe-core)
- [ ] Aumentar cobertura de testes (componentes de página)
- [ ] Dark/light mode toggle

## 🚀 Produto (evolução)

- [ ] Importar extrato bancário (CSV/OFX)
- [ ] Metas financeiras (ex: "economizar R$ 5k até dezembro")
- [ ] Tags/labels nos lançamentos (além de categoria)
- [ ] Multi-tenant (cada usuário vê só seus dados via RLS por user_id)

## 🌍 Longo prazo

- [ ] i18n (internacionalização)
- [ ] Notificação por email (Edge Functions + Resend)
- [ ] App nativo (React Native ou Capacitor)
