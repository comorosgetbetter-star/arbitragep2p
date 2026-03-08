
CREATE OR REPLACE FUNCTION public.start_flywheel(
  _plan_name text,
  _amount numeric,
  _daily_return_pct numeric,
  _lock_minutes integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id UUID;
  _current_balance NUMERIC;
  _session_id UUID;
  _lock_days INTEGER;
BEGIN
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT usdt_balance INTO _current_balance
  FROM public.user_balances
  WHERE user_id = _user_id;

  IF _current_balance IS NULL OR _current_balance < _amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  UPDATE public.user_balances
  SET usdt_balance = usdt_balance - _amount, updated_at = now()
  WHERE user_id = _user_id;

  -- Use 1 as lock_days minimum for the column, but set ends_at based on minutes
  _lock_days := GREATEST(1, _lock_minutes / 1440);

  INSERT INTO public.staking_sessions (user_id, plan_name, staked_amount, daily_return_pct, lock_days, ends_at)
  VALUES (_user_id, _plan_name, _amount, _daily_return_pct, _lock_days, now() + (_lock_minutes || ' minutes')::interval)
  RETURNING id INTO _session_id;

  RETURN _session_id;
END;
$$;
