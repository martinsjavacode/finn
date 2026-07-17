-- ============================================================
-- Migration 036: Sync entries paid status with card invoices
-- ============================================================
-- Corrige dados legados: entries de cartão que estão como paid=false
-- mas cuja fatura (card_invoices) já está totalmente paga.
-- ============================================================

WITH fully_paid_invoices AS (
  SELECT ci.card, ci.month, ci.account_id, ci.paid_amount,
    (SELECT COALESCE(SUM(e.amount), 0)
     FROM entries e
     WHERE e.card = ci.card
       AND e.month >= ci.month
       AND e.month < ci.month + interval '1 month'
       AND e.account_id = ci.account_id
    ) as total
  FROM card_invoices ci
),
invoices_paid AS (
  SELECT card, month, account_id
  FROM fully_paid_invoices
  WHERE paid_amount >= total AND total > 0
)
UPDATE entries e
SET paid = true
FROM invoices_paid ip
WHERE e.card = ip.card
  AND e.month >= ip.month
  AND e.month < ip.month + interval '1 month'
  AND e.account_id = ip.account_id
  AND e.paid = false;
