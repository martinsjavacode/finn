
SELECT * FROM public.entries WHERE payment_method = 'credit_card' and month = '2026-07-01' and card like 'mercado%';

UPDATE public.entries SET paid = false WHERE id = 'dadfb23a-7498-413c-b1fd-65787cf9239b';