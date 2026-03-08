CREATE OR REPLACE FUNCTION public.cancel_staking(_session_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _user_id UUID;
  _staked_amount NUMERIC;
  _daily_return_pct NUMERIC;
  _status TEXT;
  _started_at TIMESTAMPTZ;
  _ends_at TIMESTAMPTZ;
  _elapsed_seconds NUMERIC;
  _elapsed_days NUMERIC;
  _accrued_rewards NUMERIC;
  _total_refund NUMERIC;
BEGIN
  _user_id := auth.uid();

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT staked_amount, status, daily_return_pct, started_at, ends_at
  INTO _staked_amount, _status, _daily_return_pct, _started_at, _ends_at
  FROM public.staking_sessions
  WHERE id = _session_id AND user_id = _user_id;

  IF _staked_amount IS NULL THEN
    RAISE EXCEPTION 'Staking session not found';
  END IF;

  IF _status != 'active' THEN
    RAISE EXCEPTION 'Staking session is not active';
  END IF;

  -- Continuous accrual using fractional elapsed days, capped at lock end
  _elapsed_seconds := GREATEST(
    0,
    EXTRACT(EPOCH FROM (LEAST(now(), _ends_at) - _started_at))
  );

  _elapsed_days := _elapsed_seconds / 86400.0;

  _accrued_rewards := _staked_amount * (_daily_return_pct / 100.0) * _elapsed_days;
  _total_refund := _staked_amount + _accrued_rewards;

  UPDATE public.user_balances
  SET usdt_balance = usdt_balance + _total_refund,
      updated_at = now()
  WHERE user_id = _user_id;

  UPDATE public.staking_sessions
  SET status = 'cancelled',
      cancelled_at = now()
  WHERE id = _session_id;

  RETURN TRUE;
END;
$function$;