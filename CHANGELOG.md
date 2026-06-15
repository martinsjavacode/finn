# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [0.1.3](https://github.com/martinsjavacode/finn/compare/v0.1.2...v0.1.3) (2026-06-15)


### Features

* **rls:** add cards RLS permission function and property-based tests ([853fd74](https://github.com/martinsjavacode/finn/commit/853fd746ee2a22480f4068f9c1eaa4630a3f7c8b))
* **transactions:** add batch selection and bulk payment actions ([f4485cc](https://github.com/martinsjavacode/finn/commit/f4485cc2400a1aeee7807b9fa697a253e330d071))

## [0.1.2](https://github.com/martinsjavacode/finn/compare/v0.1.1...v0.1.2) (2026-05-31)


### Features

* add category to recurring cards, group cards by card, fix categories RLS ([d35852e](https://github.com/martinsjavacode/finn/commit/d35852e48a4e4cf9986d88bf6d7c84ba750b8a65))
* add investments page with CRUD, portfolio tracking and account dropdown ([9d32da3](https://github.com/martinsjavacode/finn/commit/9d32da37a541089eab17a6bca4523a1df898c8a2))

## [0.1.1](https://github.com/martinsjavacode/finn/compare/v0.1.0...v0.1.1) (2026-05-27)


### Features

* add account migration for superadmin (entries, budgets, installments) ([c29fbf3](https://github.com/martinsjavacode/finn/commit/c29fbf33a0ab51843f55199364c36e651bd43dd1))

## [0.1.0](https://github.com/martinsjavacode/finn/compare/v0.0.13...v0.1.0) (2026-05-27)


### ⚠ BREAKING CHANGES

* owner field removed, requires migration 025+026

### Features

* **accounts:** add members management per account ([74898ec](https://github.com/martinsjavacode/finn/commit/74898ece94ee41f9406442df4afcca4ec9c3593d))
* add RBAC RLS, useMediaQuery, unified modals, offline support ([0951e7d](https://github.com/martinsjavacode/finn/commit/0951e7dfd4569aa9af48962331e14f24519a3b1c))
* migrate from owner to accounts model with per-account RBAC ([95aa3f0](https://github.com/martinsjavacode/finn/commit/95aa3f034d77d8a9c4ed3ad7ab4750436e8af7c1))


### Bug Fixes

* permissionsLoaded stuck false for superadmin ([4494f57](https://github.com/martinsjavacode/finn/commit/4494f571e72b857aeec844ac070b575311b490d6))
* scope all queries by activeAccountId with enabled guards ([62c057f](https://github.com/martinsjavacode/finn/commit/62c057fd6dd1057eff67d756b0b2889d72800b87))
* sync account switch across all pages and filter by account_id ([f829c7c](https://github.com/martinsjavacode/finn/commit/f829c7cfedc0b1f6a34f90d47ed681883bc74cb5))
* **test:** pass accountId to useTransactions in tests ([40c2ce1](https://github.com/martinsjavacode/finn/commit/40c2ce1263e3e3b8f0a415bfe5dab63f34b1faf3))

## [0.0.13](https://github.com/martinsjavacode/finn/compare/v0.0.12...v0.0.13) (2026-05-26)


### Features

* adicionar contagem de itens no título de todas as páginas CRUD ([0caea5d](https://github.com/martinsjavacode/finn/commit/0caea5d49baa92d8f3446bbe10dd44e7c59583be))
* melhorar UX da tela de lançamentos ([26a5a2c](https://github.com/martinsjavacode/finn/commit/26a5a2c6d8d5f0a31354865a4060acd618dbf2b3))
* polish dashboard - hover nos summary cards e feedback positivo de contas em dia ([99a566b](https://github.com/martinsjavacode/finn/commit/99a566b220a11c30dfbbbbabf57a5159637cfc42))
* redesign categorias e cartões com CardGrid componentizado ([dd01384](https://github.com/martinsjavacode/finn/commit/dd01384777b180953ca694e09dd5d37d0601545d))
* redesign orçamentos com CardGrid e ações laterais no card ([84e3f77](https://github.com/martinsjavacode/finn/commit/84e3f7737e43818343f91303ae3478cba1c98181))
* redesign projeção com cards, barras de progresso e total geral ([b0e27a3](https://github.com/martinsjavacode/finn/commit/b0e27a38a515939a6c8cb55dbafe5afeb262c635))
* redesign tela de permissões - tabs, labels em português, badge toggle na matriz ([5e044d7](https://github.com/martinsjavacode/finn/commit/5e044d73516ba4cfaf4d8936a1d0414b358ac224))


### Bug Fixes

* aguardar permissões carregarem antes de redirecionar rotas protegidas ([d8fcc15](https://github.com/martinsjavacode/finn/commit/d8fcc15470aa44e55b31c803e9e203447a00809c))

## [0.0.12](https://github.com/martinsjavacode/finn/compare/v0.0.11...v0.0.12) (2026-05-26)


### Bug Fixes

* padronizar payment_method enum e corrigir modais ([dcc3a20](https://github.com/martinsjavacode/finn/commit/dcc3a20dcbb8791ed156b820eac76be53827f8d3))
* tipar target state como payment_method enum ([e06770a](https://github.com/martinsjavacode/finn/commit/e06770a196d547511b12601d5baf2d0877803329))
* tipar Template.target como payment_method ([3c84d48](https://github.com/martinsjavacode/finn/commit/3c84d48f2c739fe09dbeb8b4619a661e949d5ace))

## [0.0.11](https://github.com/martinsjavacode/finn/compare/v0.0.10...v0.0.11) (2026-05-26)


### Features

* **cards:** add closing rule engine for invoice month resolution ([1fc1751](https://github.com/martinsjavacode/finn/commit/1fc17516d2dc6369c19ce7da5370fa52439778dd))
* complete medium-priority - CSS split, useMemo, hooks ([46393bf](https://github.com/martinsjavacode/finn/commit/46393bf6ecafe9587c5261b9b06e06164dc03b46))
* generate Supabase types, eliminate all as never casts ([362ea9f](https://github.com/martinsjavacode/finn/commit/362ea9fa118e0f7ffe4b5b27476917484a6b29b4))
* implement high-priority UX/accessibility improvements ([8f988ca](https://github.com/martinsjavacode/finn/commit/8f988ca26bf8ec63a04e5ec5e90de3bf596b9368))
* low-priority improvements - fonts, layout, dashboard, perf ([d0574be](https://github.com/martinsjavacode/finn/commit/d0574bef0159fbfd15310e88e462937e6a7169da))
* medium-priority improvements - Modal, TanStack Query, Badge/Input ([3217813](https://github.com/martinsjavacode/finn/commit/3217813f4996d3149b62fe037470c4ed1a39efa0))


### Bug Fixes

* resolve 4 potential runtime bugs ([d414f2a](https://github.com/martinsjavacode/finn/commit/d414f2ac8c9cc4b09b3250473b0dab7a4afd7df2))

## [0.0.10](https://github.com/martinsjavacode/finn/compare/v0.0.9...v0.0.10) (2026-05-26)


### Features

* **categories:** add subcategories with parent_id and grouped selects ([1baf863](https://github.com/martinsjavacode/finn/commit/1baf86391ce6a9790223b22fc3614bb6067fa052))


### Bug Fixes

* prevent input focus loss by removing useAppData from AppLayout ([0806fc2](https://github.com/martinsjavacode/finn/commit/0806fc283fb378638b97c298777f7eb4f31c5bb0))
* **ui:** mobile edit modals, hamburger layout, and docs update ([8030edc](https://github.com/martinsjavacode/finn/commit/8030edcd2f0157e7cfb080269f09750e2fb8e020))

## [0.0.9](https://github.com/martinsjavacode/finn/compare/v0.0.8...v0.0.9) (2026-05-26)


### Features

* **a11y:** accessibility audit - aria-labels, focus trap, landmarks ([22d5dee](https://github.com/martinsjavacode/finn/commit/22d5deef0fe5a0f8d9e5f9c5f5cfb55de8aae003))
* card invoices with partial payment, category in credit cards, improved UX ([a1c38a7](https://github.com/martinsjavacode/finn/commit/a1c38a74a02c34d9a4dad6ba6d54c4ae80dbd9ce))
* integrate TanStack Query replacing manual data fetching ([1bdffe8](https://github.com/martinsjavacode/finn/commit/1bdffe87dbc90772ef60d1bd67930b005a78bf68))
* standardize mutations with useMutation, migrate Dashboard to TanStack Query, add tests to CI ([15d95bc](https://github.com/martinsjavacode/finn/commit/15d95bc604af598d6f1fdf5069a1c43b4d8744db))
* **transactions:** add installment CRUD with cascade delete and category support ([e0deb97](https://github.com/martinsjavacode/finn/commit/e0deb9753d4dba7e467906d04742de17dc20c31d))
* **transactions:** add installment purchase form with toggle and preview ([410287c](https://github.com/martinsjavacode/finn/commit/410287c0398af8b8ab6c62e56aa50f8aceb3086b))

## [0.0.8](https://github.com/martinsjavacode/finn/compare/v0.0.7...v0.0.8) (2026-05-26)


### Features

* **auth:** navigate to / on sign out ([6dd4133](https://github.com/martinsjavacode/finn/commit/6dd41337af4b2b8786e2adfe3dc41be3c8aba76a))
* **auth:** redirect to dashboard after login ([5f18438](https://github.com/martinsjavacode/finn/commit/5f1843833c10f3e70ad3231f89c24cc6d0c4ab69))
* **dashboard:** add trend line, summary cards, tooltip, fade-in and balance area ([beb662d](https://github.com/martinsjavacode/finn/commit/beb662d5643ae2c61f380988d126e9cb8db10411))
* **rbac:** enforce granular permissions on all CRUD actions ([57fcbe4](https://github.com/martinsjavacode/finn/commit/57fcbe49490d6bde9b199c7adc6f2c1cd39d6738))
* **ui:** add pagination with per-page selector to transactions tables ([301d060](https://github.com/martinsjavacode/finn/commit/301d06017880b0c28df2db6206dadbb10fc89bd4))
* **ui:** use card color as visual indicator in credit card table ([ed4748d](https://github.com/martinsjavacode/finn/commit/ed4748d6fa4883af2f16ec14e65bfb410c119351))


### Bug Fixes

* add transactions page title and fix icon-text gap in tabs ([e4dc4ae](https://github.com/martinsjavacode/finn/commit/e4dc4ae7f4edc6b8bb1ed97075f9968b890038c0))
* auto-login after signup so user is immediately activated ([abebda9](https://github.com/martinsjavacode/finn/commit/abebda9c9cfdfc5fcdee3403bbbb36950da88886))
* **lint:** remove redundant roleId default in AccessPage useEffect ([d0c4c14](https://github.com/martinsjavacode/finn/commit/d0c4c141c530dfab3c8c321b3d942e39e5560c24))

## [0.0.7](https://github.com/martinsjavacode/finn/compare/v0.0.5...v0.0.7) (2026-05-25)


### Features

* add payment filter, projection RPC and fix deploy pipeline ([ce954b5](https://github.com/martinsjavacode/finn/commit/ce954b567256490da4e28dfa955aec1458526076))
* apply RBAC permissions in frontend ([e86704b](https://github.com/martinsjavacode/finn/commit/e86704ba9c979f3de68d12b29e216fb0c8ad7791))
* RBAC system with roles, permissions and user management ([0f6135e](https://github.com/martinsjavacode/finn/commit/0f6135e1e626d17641b65c3ae47a0914a36bdf30))
* responsive mobile layout, PWA and UX improvements ([1ff3341](https://github.com/martinsjavacode/finn/commit/1ff33414c9139577668f051632cca156121a50fe))


### Bug Fixes

* auto-activate user on first login, remove redundant signup update ([9cc36ea](https://github.com/martinsjavacode/finn/commit/9cc36ea6988a5d75c43d9015789e52bb09cad20e))
* **ci:** push only tags to avoid branch protection rule violation ([1888021](https://github.com/martinsjavacode/finn/commit/1888021ec3f7efa4232c7536d7dc2cbe47f6b326))
* **ci:** revert to push --follow-tags (requires bypass rule) ([05a05f3](https://github.com/martinsjavacode/finn/commit/05a05f37273904fe36de642756212c95766c900e))

## [0.0.5](https://github.com/martinsjavacode/finn/compare/v0.0.4...v0.0.5) (2026-05-25)


### Bug Fixes

* **ci:** trigger deploy via workflow_dispatch after tag creation ([cc6cbbc](https://github.com/martinsjavacode/finn/commit/cc6cbbc79ae69a341e297f8ccbc016862c45948d))

## [0.0.4](https://github.com/martinsjavacode/finn/compare/v0.0.3...v0.0.4) (2026-05-25)


### Bug Fixes

* **ci:** use PAT to push tags so deploy workflow triggers ([4df54c1](https://github.com/martinsjavacode/finn/commit/4df54c19f47a436c27450d8f9f75d6ef6a7e36e0))

## [0.0.3](https://github.com/martinsjavacode/finn/compare/v0.0.2...v0.0.3) (2026-05-25)


### Features

* **ui:** add error handling, toast notifications and delete confirmation ([2841f3d](https://github.com/martinsjavacode/finn/commit/2841f3dda4b20df31ee266dc19677dd42e45faec))


### Bug Fixes

* **ci:** use correct git user for tag creation ([cdd62be](https://github.com/martinsjavacode/finn/commit/cdd62be956828b6765423653d8be1fb002ced1ed))

## [0.0.2](https://github.com/martinsjavacode/finn/compare/v0.0.1...v0.0.2) (2026-05-25)


### Bug Fixes

* redirect OAuth para /finn/ no GitHub Pages ([fd82f6c](https://github.com/martinsjavacode/finn/commit/fd82f6ca2d5a65f0f64f15de5236e0f79909fd10))

## 0.0.1 (2026-05-25)


### Features

* busca por descrição nos lançamentos, padronização visual dos controles ([8f93501](https://github.com/martinsjavacode/finn/commit/8f9350107656a40055da4451d1928ee5391e6943))
* controle de acesso (viewer/editor), login OTP por email, menu acessos só para owner ([c721102](https://github.com/martinsjavacode/finn/commit/c721102cd24556c11b8350a5be0312f70b6eb82a))
* CRUD, página recorrentes, componentização, filtro meses ASC ([99ce441](https://github.com/martinsjavacode/finn/commit/99ce441a73082394af31fd4663b1d9a350f8c2ad))
* dashboard com gráfico anual, pizza por categoria e progresso de pagamento ([10a04e6](https://github.com/martinsjavacode/finn/commit/10a04e630340dcd35ea1fe1696b0e09e90296fcf))
* edição de data nos lançamentos ([3aeff9d](https://github.com/martinsjavacode/finn/commit/3aeff9da6f360801263dd18314029d4e7f716210))
* edição inline nos lançamentos (descrição, valor, categoria, responsável) ([cfdfdd5](https://github.com/martinsjavacode/finn/commit/cfdfdd5808c8403afe093b2ed1d3789bb57626db))
* initial financial dashboard with Supabase + React + TS ([63840aa](https://github.com/martinsjavacode/finn/commit/63840aaa0c704dab61205d147f0ec9d2f27e9fa3))
* página CRUD de cartões (nome, limite, fechamento, vencimento, cor) ([ab8f06c](https://github.com/martinsjavacode/finn/commit/ab8f06cfde332b331b705b5c966287d774cc7a66))
* página CRUD de categorias ([d6f1249](https://github.com/martinsjavacode/finn/commit/d6f1249f11e1d7108ba3f3921c96c4e62e227a51))
* planejamento (orçamentos, projeção, alertas), componente Button, reorganização por feature ([e0ffd2e](https://github.com/martinsjavacode/finn/commit/e0ffd2e93ab42121197132729237c9affa8c1ee3))
* reload geral ao salvar (categorias + meses + dados) ([f693040](https://github.com/martinsjavacode/finn/commit/f693040d6e67b3d4d5da4ed449d04bededdd9a22))
* sidebar, filtros, login GitHub, campo pago e select customizado ([24500c5](https://github.com/martinsjavacode/finn/commit/24500c5d115e620e4a5b4884eae1b76eab32b8b0))


### Bug Fixes

* exibir label da categoria no orçamento do dashboard ([b9a822c](https://github.com/martinsjavacode/finn/commit/b9a822ce5924f3c8cdff9c9baa52320ef3ccb26d))
* fallback para mês seguinte se atual não tiver dados ([e36e5b8](https://github.com/martinsjavacode/finn/commit/e36e5b8c9488514ba9449d978c9d5a1019b5e831))
* lançamentos inicia no mês atual ([7e013eb](https://github.com/martinsjavacode/finn/commit/7e013ebe676839a95694fd3f300929dfa6b5dbfe))
* manter mês atual mesmo sem dados, usuário troca manualmente ([a14ab98](https://github.com/martinsjavacode/finn/commit/a14ab98a08b6d28855284fd094253a81a33cb6fe))
* projeção considera apenas despesas recorrentes ([30dd752](https://github.com/martinsjavacode/finn/commit/30dd752bd8ccbb25b92071b40ca9bbbdefebc37e))
* resolver erro de lint (setState em effect) ([b1306a0](https://github.com/martinsjavacode/finn/commit/b1306a0f88d49640f0625b4f91ea1a7f4d6cb71f))
