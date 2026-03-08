
-- Table for storing user crypto holdings (non-USDT)
CREATE TABLE public.user_crypto_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  symbol text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, symbol)
);

-- Enable RLS
ALTER TABLE public.user_crypto_balances ENABLE ROW LEVEL SECURITY;

-- Users can view their own crypto balances
CREATE POLICY "Users can view own crypto balances"
  ON public.user_crypto_balances FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Admins can manage all crypto balances
CREATE POLICY "Admins can manage crypto balances"
  ON public.user_crypto_balances FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_user_crypto_balances_updated_at
  BEFORE UPDATE ON public.user_crypto_balances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for instant UI updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_crypto_balances;

-- Function to adjust crypto balance (admin only)
CREATE OR REPLACE FUNCTION public.adjust_crypto_balance(
  _target_user_id uuid,
  _symbol text,
  _crypto_amount numeric,
  _reason text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _admin_id UUID;
  _old_amount NUMERIC;
  _new_amount NUMERIC;
BEGIN
  _admin_id := auth.uid();

  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Upsert the crypto balance
  SELECT amount INTO _old_amount
  FROM public.user_crypto_balances
  WHERE user_id = _target_user_id AND symbol = _symbol;

  IF _old_amount IS NULL THEN
    INSERT INTO public.user_crypto_balances (user_id, symbol, amount)
    VALUES (_target_user_id, _symbol, _crypto_amount);
    _old_amount := 0;
    _new_amount := _crypto_amount;
  ELSE
    _new_amount := _old_amount + _crypto_amount;
    UPDATE public.user_crypto_balances
    SET amount = _new_amount, updated_at = now()
    WHERE user_id = _target_user_id AND symbol = _symbol;
  END IF;

  -- Audit log
  INSERT INTO public.admin_audit_logs (admin_id, action, target_user_id, details)
  VALUES (
    _admin_id, 'CRYPTO_BALANCE_ADJUSTMENT', _target_user_id,
    jsonb_build_object(
      'symbol', _symbol,
      'old_amount', _old_amount,
      'adjustment', _crypto_amount,
      'new_amount', _new_amount,
      'reason', _reason
    )
  );

  RETURN TRUE;
END;
$$;
