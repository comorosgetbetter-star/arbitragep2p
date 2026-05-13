
-- Add VIP auto-complete flag to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vip_auto_complete boolean NOT NULL DEFAULT false;

-- Allow admins to update profiles (needed to toggle VIP flag)
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles"
  ON public.profiles
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Function: VIP users can self-credit their USDT balance after a P2P/Express trade
CREATE OR REPLACE FUNCTION public.vip_complete_trade(_amount numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid;
  _vip boolean;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  SELECT vip_auto_complete INTO _vip FROM public.profiles WHERE user_id = _uid;
  IF NOT COALESCE(_vip, false) THEN
    RAISE EXCEPTION 'VIP auto-complete not enabled';
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_balances WHERE user_id = _uid) THEN
    UPDATE public.user_balances
       SET usdt_balance = usdt_balance + _amount, updated_at = now()
     WHERE user_id = _uid;
  ELSE
    INSERT INTO public.user_balances (user_id, usdt_balance) VALUES (_uid, _amount);
  END IF;

  INSERT INTO public.deposits (user_id, amount, reason)
  VALUES (_uid, _amount, 'P2P trade settlement');

  RETURN TRUE;
END;
$$;
