CREATE INDEX IF NOT EXISTS idx_deposits_user_created_at_desc
ON public.deposits (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_created_at_desc
ON public.withdrawals (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_withdrawals_status_created_at_desc
ON public.withdrawals (status, created_at DESC);