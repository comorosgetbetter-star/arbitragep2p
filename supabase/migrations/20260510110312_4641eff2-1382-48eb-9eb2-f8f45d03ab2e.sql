CREATE OR REPLACE VIEW public.transaction_history
WITH (security_invoker = on) AS
SELECT
  d.id,
  d.user_id,
  'deposit'::text AS type,
  d.amount,
  'approved'::text AS status,
  ''::text AS network,
  'USDT'::text AS symbol,
  d.reason,
  d.created_at
FROM public.deposits d
UNION ALL
SELECT
  w.id,
  w.user_id,
  'withdrawal'::text AS type,
  w.amount,
  w.status,
  w.network,
  public.normalize_withdrawal_symbol(w.crypto_symbol, w.network)::text AS symbol,
  NULL::text AS reason,
  w.created_at
FROM public.withdrawals w;

CREATE INDEX IF NOT EXISTS idx_deposits_created_at_desc
ON public.deposits (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at_desc
ON public.withdrawals (created_at DESC);