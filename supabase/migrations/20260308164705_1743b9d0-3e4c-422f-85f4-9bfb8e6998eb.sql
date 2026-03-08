
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
  _days_elapsed INTEGER;
  _accrued_rewards NUMERIC;
  _total_refund NUMERIC;
BEGIN
  _user_id := auth.uid();

  SELECT staked_amount, status, daily_return_pct, started_at 
  INTO _staked_amount, _status, _daily_return_pct, _started_at
  FROM public.staking_sessions
  WHERE id = _session_id AND user_id = _user_id;

  IF _staked_amount IS NULL THEN
    RAISE EXCEPTION 'Staking session not found';
  END IF;

  IF _status != 'active' THEN
    RAISE EXCEPTION 'Staking session is not active';
  END IF;

  -- Calculate days elapsed (at least 0)
  _days_elapsed := GREATEST(0, EXTRACT(DAY FROM (now() - _started_at))::integer);
  
  -- Calculate accrued rewards
  _accrued_rewards := _staked_amount * (_daily_return_pct / 100.0) * _days_elapsed;
  _total_refund := _staked_amount + _accrued_rewards;

  -- Return principal + accrued rewards to balance
  UPDATE public.user_balances
  SET usdt_balance = usdt_balance + _total_refund, updated_at = now()
  WHERE user_id = _user_id;

  -- Mark as cancelled
  UPDATE public.staking_sessions
  SET status = 'cancelled', cancelled_at = now()
  WHERE id = _session_id;

  RETURN TRUE;
END;
$function$;
