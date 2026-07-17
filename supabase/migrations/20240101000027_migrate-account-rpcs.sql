-- ============================================================
-- RPCs para migrar registros entre contas (superadmin only)
-- ============================================================

-- Migrar lançamentos avulsos
create or replace function migrate_entries(entry_ids uuid[], target_account_id uuid)
returns int as $$
declare
  affected int;
begin
  if not exists (select 1 from users where id = auth.uid() and is_superadmin = true) then
    raise exception 'Apenas superadmin pode migrar lançamentos';
  end if;
  if not exists (select 1 from accounts where id = target_account_id) then
    raise exception 'Conta destino não encontrada';
  end if;

  update entries set account_id = target_account_id
  where id = any(entry_ids) and installment_purchase_id is null;
  get diagnostics affected = row_count;
  return affected;
end;
$$ language plpgsql security definer;

-- Migrar orçamentos
create or replace function migrate_budgets(budget_ids uuid[], target_account_id uuid)
returns int as $$
declare
  affected int;
begin
  if not exists (select 1 from users where id = auth.uid() and is_superadmin = true) then
    raise exception 'Apenas superadmin pode migrar orçamentos';
  end if;
  if not exists (select 1 from accounts where id = target_account_id) then
    raise exception 'Conta destino não encontrada';
  end if;

  update budgets set account_id = target_account_id
  where id = any(budget_ids);
  get diagnostics affected = row_count;
  return affected;
end;
$$ language plpgsql security definer;

-- Migrar parcelamentos (move purchase + parcelas geradas)
create or replace function migrate_installment_purchases(purchase_ids uuid[], target_account_id uuid)
returns int as $$
declare
  affected int;
begin
  if not exists (select 1 from users where id = auth.uid() and is_superadmin = true) then
    raise exception 'Apenas superadmin pode migrar parcelamentos';
  end if;
  if not exists (select 1 from accounts where id = target_account_id) then
    raise exception 'Conta destino não encontrada';
  end if;

  update installment_purchases set account_id = target_account_id
  where id = any(purchase_ids);
  get diagnostics affected = row_count;

  update entries set account_id = target_account_id
  where installment_purchase_id = any(purchase_ids);

  return affected;
end;
$$ language plpgsql security definer;
