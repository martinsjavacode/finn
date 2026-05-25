# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

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
