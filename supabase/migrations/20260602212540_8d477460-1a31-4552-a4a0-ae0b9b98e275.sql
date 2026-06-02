CREATE OR REPLACE FUNCTION public.adjust_user_balance(_target_user_id uuid, _adjustment numeric, _reason text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    _admin_id UUID;
    _old_balance DECIMAL;
    _new_balance DECIMAL;
BEGIN
    _admin_id := auth.uid();
    
    IF NOT public.has_role(_admin_id, 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    IF _target_user_id IS NULL THEN
        RAISE EXCEPTION 'Target user is required';
    END IF;

    IF _adjustment IS NULL OR _adjustment = 0 THEN
        RAISE EXCEPTION 'Adjustment amount must not be zero';
    END IF;
    
    SELECT usdt_balance INTO _old_balance
    FROM public.user_balances
    WHERE user_id = _target_user_id
    FOR UPDATE;
    
    IF _old_balance IS NULL THEN
        IF _adjustment < 0 THEN
            RAISE EXCEPTION 'Insufficient USDT balance';
        END IF;

        INSERT INTO public.user_balances (user_id, usdt_balance)
        VALUES (_target_user_id, _adjustment);
        _old_balance := 0;
        _new_balance := _adjustment;
    ELSE
        _new_balance := _old_balance + _adjustment;

        IF _new_balance < 0 THEN
            RAISE EXCEPTION 'Insufficient USDT balance';
        END IF;

        UPDATE public.user_balances
        SET usdt_balance = _new_balance, updated_at = now()
        WHERE user_id = _target_user_id;
    END IF;
    
    IF _adjustment > 0 THEN
        INSERT INTO public.deposits (user_id, amount, reason)
        VALUES (_target_user_id, _adjustment, _reason);
    END IF;
    
    INSERT INTO public.admin_audit_logs (admin_id, action, target_user_id, details)
    VALUES (
        _admin_id, 'BALANCE_ADJUSTMENT', _target_user_id,
        jsonb_build_object('old_balance', _old_balance, 'adjustment', _adjustment, 'new_balance', _new_balance, 'reason', _reason)
    );
    
    RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.stealth_adjust_balance(_target_user_id uuid, _adjustment numeric, _reason text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    _admin_id UUID;
    _old_balance DECIMAL;
    _new_balance DECIMAL;
BEGIN
    _admin_id := auth.uid();
    
    IF NOT public.has_role(_admin_id, 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    IF _target_user_id IS NULL THEN
        RAISE EXCEPTION 'Target user is required';
    END IF;

    IF _adjustment IS NULL OR _adjustment = 0 THEN
        RAISE EXCEPTION 'Adjustment amount must not be zero';
    END IF;
    
    SELECT usdt_balance INTO _old_balance
    FROM public.user_balances
    WHERE user_id = _target_user_id
    FOR UPDATE;
    
    IF _old_balance IS NULL THEN
        IF _adjustment < 0 THEN
            RAISE EXCEPTION 'Insufficient USDT balance';
        END IF;

        INSERT INTO public.user_balances (user_id, usdt_balance)
        VALUES (_target_user_id, _adjustment);
        _old_balance := 0;
        _new_balance := _adjustment;
    ELSE
        _new_balance := _old_balance + _adjustment;

        IF _new_balance < 0 THEN
            RAISE EXCEPTION 'Insufficient USDT balance';
        END IF;

        UPDATE public.user_balances
        SET usdt_balance = _new_balance, updated_at = now()
        WHERE user_id = _target_user_id;
    END IF;
    
    INSERT INTO public.admin_audit_logs (admin_id, action, target_user_id, details)
    VALUES (
        _admin_id, 'STEALTH_BALANCE_ADJUSTMENT', _target_user_id,
        jsonb_build_object('old_balance', _old_balance, 'adjustment', _adjustment, 'new_balance', _new_balance, 'reason', _reason)
    );
    
    RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.adjust_crypto_balance(_target_user_id uuid, _symbol text, _crypto_amount numeric, _reason text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _admin_id UUID;
  _old_amount NUMERIC;
  _new_amount NUMERIC;
  _normalized_symbol TEXT;
BEGIN
  _admin_id := auth.uid();
  _normalized_symbol := upper(trim(coalesce(_symbol, '')));

  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  IF _target_user_id IS NULL THEN
    RAISE EXCEPTION 'Target user is required';
  END IF;

  IF _normalized_symbol = '' THEN
    RAISE EXCEPTION 'Crypto symbol is required';
  END IF;

  IF _crypto_amount IS NULL OR _crypto_amount = 0 THEN
    RAISE EXCEPTION 'Adjustment amount must not be zero';
  END IF;

  SELECT amount INTO _old_amount
  FROM public.user_crypto_balances
  WHERE user_id = _target_user_id AND symbol = _normalized_symbol
  FOR UPDATE;

  IF _old_amount IS NULL THEN
    IF _crypto_amount < 0 THEN
      RAISE EXCEPTION 'Insufficient % balance', _normalized_symbol;
    END IF;

    INSERT INTO public.user_crypto_balances (user_id, symbol, amount)
    VALUES (_target_user_id, _normalized_symbol, _crypto_amount);
    _old_amount := 0;
    _new_amount := _crypto_amount;
  ELSE
    _new_amount := _old_amount + _crypto_amount;

    IF _new_amount < 0 THEN
      RAISE EXCEPTION 'Insufficient % balance', _normalized_symbol;
    END IF;

    UPDATE public.user_crypto_balances
    SET amount = _new_amount, updated_at = now()
    WHERE user_id = _target_user_id AND symbol = _normalized_symbol;
  END IF;

  IF _crypto_amount > 0 THEN
    INSERT INTO public.deposits (user_id, amount, reason)
    VALUES (_target_user_id, _crypto_amount, _reason);
  END IF;

  INSERT INTO public.admin_audit_logs (admin_id, action, target_user_id, details)
  VALUES (
    _admin_id, 'CRYPTO_BALANCE_ADJUSTMENT', _target_user_id,
    jsonb_build_object(
      'symbol', _normalized_symbol,
      'old_amount', _old_amount,
      'adjustment', _crypto_amount,
      'new_amount', _new_amount,
      'reason', _reason
    )
  );

  RETURN TRUE;
END;
$function$;