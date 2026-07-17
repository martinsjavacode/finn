-- ============================================================
-- Cards: adicionar account_id para isolamento por conta
-- ============================================================

-- 0. Remover overloads legados de RPCs (1-param) para evitar chamada duplicada via PostgREST
drop function if exists generate_recurring(date);
drop function if exists get_projection(int);

-- 1. Adicionar coluna account_id (nullable inicialmente para migração)
alter table cards add column account_id uuid references accounts(id);

-- 2. Migrar dados: atribuir todos os cartões à conta padrão
update cards set account_id = '00000000-0000-0000-0000-000000000001';

-- 3. Tornar NOT NULL após migração
alter table cards alter column account_id set not null;

-- 4. Remover FKs que dependem de UNIQUE(name) antes de poder dropar a constraint
alter table entries drop constraint if exists entries_card_fkey;
alter table installment_purchases drop constraint if exists fk_installment_card;
alter table recurring_templates drop constraint if exists fk_recurring_card;
alter table card_invoices drop constraint if exists fk_invoice_card;

-- 5. Atualizar constraint de unicidade: nome único apenas dentro da mesma conta
alter table cards drop constraint cards_name_key;
alter table cards add constraint cards_account_name_key unique(account_id, name);

-- 6. Recriar FKs como compostas referenciando (account_id, name)
alter table entries add constraint entries_card_fkey
  foreign key (account_id, card) references cards(account_id, name);

alter table installment_purchases add constraint fk_installment_card
  foreign key (account_id, card) references cards(account_id, name);

alter table recurring_templates add constraint fk_recurring_card
  foreign key (account_id, card) references cards(account_id, name);

alter table card_invoices add constraint fk_invoice_card
  foreign key (account_id, card) references cards(account_id, name);

-- ============================================================
-- RLS: migrar de has_global_permission para has_account_permission
-- ============================================================

-- 7. Remover políticas antigas
drop policy if exists "Auth read" on cards;
drop policy if exists "Permission write" on cards;
drop policy if exists "Permission update" on cards;
drop policy if exists "Permission delete" on cards;

-- 8. Criar novas políticas com escopo por conta
create policy "Account read" on cards for select using (
  is_superadmin() or (account_id in (select user_account_ids()) and has_account_permission(account_id, 'cards', 'read'))
);

create policy "Account insert" on cards for insert with check (
  has_account_permission(account_id, 'cards', 'create')
);

create policy "Account update" on cards for update using (
  has_account_permission(account_id, 'cards', 'update')
);

create policy "Account delete" on cards for delete using (
  has_account_permission(account_id, 'cards', 'delete')
);
