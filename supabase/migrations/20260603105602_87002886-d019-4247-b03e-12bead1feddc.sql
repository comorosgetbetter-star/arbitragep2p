
-- Add order_type to p2p_orders to support both buy and sell P2P ads
ALTER TABLE public.p2p_orders
  ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT 'buy'
  CHECK (order_type IN ('buy', 'sell'));

CREATE INDEX IF NOT EXISTS idx_p2p_orders_order_type ON public.p2p_orders(order_type);

-- RPC: user sells USDT to an admin "buy" ad (order_type='sell' on our side = sell ad for user)
-- Min $35 balance required. Deducts USDT, records trade. Validates amount <= balance.
CREATE OR REPLACE FUNCTION public.p2p_sell_usdt(_order_id uuid, _amount numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid;
  _balance numeric;
  _order RECORD;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  SELECT * INTO _order FROM public.p2p_orders
    WHERE id = _order_id AND is_active = true AND order_type = 'sell';
  IF _order.id IS NULL THEN
    RAISE EXCEPTION 'Sell ad not found';
  END IF;

  IF _amount < _order.min_amount OR _amount > _order.max_amount THEN
    RAISE EXCEPTION 'Amount out of allowed range';
  END IF;

  SELECT usdt_balance INTO _balance FROM public.user_balances
    WHERE user_id = _uid FOR UPDATE;

  IF _balance IS NULL OR _balance < 35 THEN
    RAISE EXCEPTION 'MIN_BALANCE';
  END IF;

  IF _balance < _amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE';
  END IF;

  UPDATE public.user_balances
    SET usdt_balance = usdt_balance - _amount, updated_at = now()
    WHERE user_id = _uid;

  INSERT INTO public.trades (user_id, trade_type, amount, fiat_amount, fiat_currency, crypto_type, payment_method, status, completed_at)
  VALUES (_uid, 'sell', _amount, _amount, 'USD', 'USDT', _order.payment_method, 'completed', now());

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.p2p_sell_usdt(uuid, numeric) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.p2p_sell_usdt(uuid, numeric) FROM PUBLIC, anon;
