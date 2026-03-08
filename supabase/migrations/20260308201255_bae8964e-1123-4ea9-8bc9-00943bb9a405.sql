
CREATE OR REPLACE FUNCTION public.convert_crypto(
  _from_symbol text,
  _to_symbol text,
  _from_amount numeric,
  _to_amount numeric
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id UUID;
  _current_from_balance NUMERIC;
BEGIN
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _from_amount <= 0 OR _to_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amounts';
  END IF;

  IF _from_symbol = _to_symbol THEN
    RAISE EXCEPTION 'Cannot convert to same currency';
  END IF;

  -- Check and deduct from source
  IF _from_symbol = 'USDT' THEN
    SELECT usdt_balance INTO _current_from_balance
    FROM public.user_balances WHERE user_id = _user_id;
    
    IF _current_from_balance IS NULL OR _current_from_balance < _from_amount THEN
      RAISE EXCEPTION 'Insufficient balance';
    END IF;
    
    UPDATE public.user_balances
    SET usdt_balance = usdt_balance - _from_amount, updated_at = now()
    WHERE user_id = _user_id;
  ELSE
    SELECT amount INTO _current_from_balance
    FROM public.user_crypto_balances
    WHERE user_id = _user_id AND symbol = _from_symbol;
    
    IF _current_from_balance IS NULL OR _current_from_balance < _from_amount THEN
      RAISE EXCEPTION 'Insufficient balance';
    END IF;
    
    UPDATE public.user_crypto_balances
    SET amount = amount - _from_amount, updated_at = now()
    WHERE user_id = _user_id AND symbol = _from_symbol;
  END IF;

  -- Add to destination
  IF _to_symbol = 'USDT' THEN
    UPDATE public.user_balances
    SET usdt_balance = usdt_balance + _to_amount, updated_at = now()
    WHERE user_id = _user_id;
  ELSE
    INSERT INTO public.user_crypto_balances (user_id, symbol, amount)
    VALUES (_user_id, _to_symbol, _to_amount)
    ON CONFLICT (user_id, symbol) DO UPDATE
    SET amount = user_crypto_balances.amount + _to_amount, updated_at = now();
  END IF;

  RETURN TRUE;
END;
$$;
