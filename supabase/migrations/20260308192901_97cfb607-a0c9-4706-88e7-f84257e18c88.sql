
-- Update adjust_crypto_balance to also create a deposit record
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

  -- Create a deposit record so it shows in transaction history
  IF _crypto_amount > 0 THEN
    INSERT INTO public.deposits (user_id, amount, reason)
    VALUES (_target_user_id, _crypto_amount, _reason);
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
