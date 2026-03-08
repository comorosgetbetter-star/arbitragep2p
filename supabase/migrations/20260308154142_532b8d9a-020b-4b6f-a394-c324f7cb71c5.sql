
-- Staking sessions table
CREATE TABLE public.staking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_name TEXT NOT NULL,
  staked_amount NUMERIC NOT NULL,
  daily_return_pct NUMERIC NOT NULL DEFAULT 5,
  lock_days INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.staking_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own staking sessions
CREATE POLICY "Users can view own staking sessions"
  ON public.staking_sessions FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Users can insert their own staking sessions
CREATE POLICY "Users can insert own staking sessions"
  ON public.staking_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can cancel their own active staking sessions
CREATE POLICY "Users can update own staking sessions"
  ON public.staking_sessions FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Admins can manage all
CREATE POLICY "Admins can manage staking sessions"
  ON public.staking_sessions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.staking_sessions;

-- Function to start a stake (deducts balance, creates session)
CREATE OR REPLACE FUNCTION public.start_staking(
  _plan_name TEXT,
  _amount NUMERIC,
  _daily_return_pct NUMERIC,
  _lock_days INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id UUID;
  _current_balance NUMERIC;
  _session_id UUID;
BEGIN
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get current balance
  SELECT usdt_balance INTO _current_balance
  FROM public.user_balances
  WHERE user_id = _user_id;

  IF _current_balance IS NULL OR _current_balance < _amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Deduct balance
  UPDATE public.user_balances
  SET usdt_balance = usdt_balance - _amount, updated_at = now()
  WHERE user_id = _user_id;

  -- Create staking session
  INSERT INTO public.staking_sessions (user_id, plan_name, staked_amount, daily_return_pct, lock_days, ends_at)
  VALUES (_user_id, _plan_name, _amount, _daily_return_pct, _lock_days, now() + (_lock_days || ' days')::interval)
  RETURNING id INTO _session_id;

  RETURN _session_id;
END;
$$;

-- Function to cancel a stake (returns principal only, no earnings)
CREATE OR REPLACE FUNCTION public.cancel_staking(_session_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id UUID;
  _staked_amount NUMERIC;
  _status TEXT;
BEGIN
  _user_id := auth.uid();

  SELECT staked_amount, status INTO _staked_amount, _status
  FROM public.staking_sessions
  WHERE id = _session_id AND user_id = _user_id;

  IF _staked_amount IS NULL THEN
    RAISE EXCEPTION 'Staking session not found';
  END IF;

  IF _status != 'active' THEN
    RAISE EXCEPTION 'Staking session is not active';
  END IF;

  -- Return principal to balance
  UPDATE public.user_balances
  SET usdt_balance = usdt_balance + _staked_amount, updated_at = now()
  WHERE user_id = _user_id;

  -- Mark as cancelled
  UPDATE public.staking_sessions
  SET status = 'cancelled', cancelled_at = now()
  WHERE id = _session_id;

  RETURN TRUE;
END;
$$;
