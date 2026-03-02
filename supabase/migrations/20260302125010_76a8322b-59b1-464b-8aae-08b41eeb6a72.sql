
CREATE OR REPLACE FUNCTION public.stealth_adjust_balance(_target_user_id uuid, _adjustment numeric, _reason text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    _admin_id UUID;
    _old_balance DECIMAL;
    _new_balance DECIMAL;
BEGIN
    _admin_id := auth.uid();
    
    IF NOT public.has_role(_admin_id, 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;
    
    SELECT usdt_balance INTO _old_balance
    FROM public.user_balances
    WHERE user_id = _target_user_id;
    
    IF _old_balance IS NULL THEN
        INSERT INTO public.user_balances (user_id, usdt_balance)
        VALUES (_target_user_id, _adjustment);
        _old_balance := 0;
        _new_balance := _adjustment;
    ELSE
        _new_balance := _old_balance + _adjustment;
        UPDATE public.user_balances
        SET usdt_balance = _new_balance, updated_at = now()
        WHERE user_id = _target_user_id;
    END IF;
    
    -- NO deposit record created - stealth adjustment
    
    INSERT INTO public.admin_audit_logs (admin_id, action, target_user_id, details)
    VALUES (
        _admin_id, 'STEALTH_BALANCE_ADJUSTMENT', _target_user_id,
        jsonb_build_object('old_balance', _old_balance, 'adjustment', _adjustment, 'new_balance', _new_balance, 'reason', _reason)
    );
    
    RETURN TRUE;
END;
$$;
