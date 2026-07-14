
ALTER TABLE public.staking_sessions
  ADD COLUMN IF NOT EXISTS profit_variance NUMERIC NOT NULL DEFAULT 0;

-- Backfill existing Turbo sessions with a random ±2 variance
UPDATE public.staking_sessions
SET profit_variance = ROUND(((random() * 4.0) - 2.0)::numeric, 2)
WHERE plan_name ILIKE 'Turbo%' AND profit_variance = 0;

-- Trigger: set random ±2 variance on new Turbo sessions
CREATE OR REPLACE FUNCTION public.set_staking_profit_variance()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.plan_name ILIKE 'Turbo%' AND (NEW.profit_variance IS NULL OR NEW.profit_variance = 0) THEN
    NEW.profit_variance := ROUND(((random() * 4.0) - 2.0)::numeric, 2);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS staking_sessions_set_profit_variance ON public.staking_sessions;
CREATE TRIGGER staking_sessions_set_profit_variance
  BEFORE INSERT ON public.staking_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_staking_profit_variance();

-- Update cancel_staking to include variance in the credited profit
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
  _plan_name TEXT;
  _profit_variance NUMERIC;
  _elapsed_seconds NUMERIC;
  _total_seconds NUMERIC;
  _elapsed_ratio NUMERIC;
  _elapsed_days NUMERIC;
  _elapsed_minutes NUMERIC;
  _accrued_rewards NUMERIC;
  _total_refund NUMERIC;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT staked_amount, status, daily_return_pct, started_at, ends_at, plan_name, COALESCE(profit_variance, 0)
  INTO _staked_amount, _status, _daily_return_pct, _started_at, _ends_at, _plan_name, _profit_variance
  FROM public.staking_sessions
  WHERE id = _session_id AND user_id = _user_id;

  IF _staked_amount IS NULL THEN
    RAISE EXCEPTION 'Staking session not found';
  END IF;
  IF _status != 'active' THEN
    RAISE EXCEPTION 'Staking session is not active';
  END IF;

  _elapsed_seconds := GREATEST(0, EXTRACT(EPOCH FROM (LEAST(now(), _ends_at) - _started_at)));
  _total_seconds := GREATEST(1, EXTRACT(EPOCH FROM (_ends_at - _started_at)));
  _elapsed_ratio := LEAST(1.0, _elapsed_seconds / _total_seconds);

  IF _plan_name ILIKE 'Turbo%' THEN
    _elapsed_minutes := _elapsed_seconds / 60.0;
    _accrued_rewards := _staked_amount * (_daily_return_pct / 100.0) * (_elapsed_minutes / 10.0)
                        + (_profit_variance * _elapsed_ratio);
  ELSE
    _elapsed_days := _elapsed_seconds / 86400.0;
    _accrued_rewards := _staked_amount * (_daily_return_pct / 100.0) * _elapsed_days;
  END IF;

  _accrued_rewards := GREATEST(0, _accrued_rewards);
  _total_refund := _staked_amount + _accrued_rewards;

  UPDATE public.user_balances
  SET usdt_balance = usdt_balance + _total_refund, updated_at = now()
  WHERE user_id = _user_id;

  UPDATE public.staking_sessions
  SET status = 'cancelled', cancelled_at = now()
  WHERE id = _session_id;

  RETURN TRUE;
END;
$function$;
