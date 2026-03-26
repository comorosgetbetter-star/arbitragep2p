
CREATE TABLE public.bot_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bot_id text NOT NULL,
  subscribed_at timestamp with time zone NOT NULL DEFAULT now(),
  amount_paid numeric NOT NULL,
  UNIQUE (user_id, bot_id)
);

ALTER TABLE public.bot_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON public.bot_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON public.bot_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage subscriptions"
  ON public.bot_subscriptions
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to subscribe to a bot: checks balance, deducts, creates subscription
CREATE OR REPLACE FUNCTION public.subscribe_to_bot(_bot_id text, _cost numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id UUID;
  _current_balance NUMERIC;
BEGIN
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if already subscribed
  IF EXISTS (SELECT 1 FROM public.bot_subscriptions WHERE user_id = _user_id AND bot_id = _bot_id) THEN
    RAISE EXCEPTION 'Already subscribed';
  END IF;

  -- Check balance
  SELECT usdt_balance INTO _current_balance
  FROM public.user_balances
  WHERE user_id = _user_id;

  IF _current_balance IS NULL OR _current_balance < _cost THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Deduct balance
  UPDATE public.user_balances
  SET usdt_balance = usdt_balance - _cost, updated_at = now()
  WHERE user_id = _user_id;

  -- Create subscription
  INSERT INTO public.bot_subscriptions (user_id, bot_id, amount_paid)
  VALUES (_user_id, _bot_id, _cost);

  RETURN TRUE;
END;
$$;
