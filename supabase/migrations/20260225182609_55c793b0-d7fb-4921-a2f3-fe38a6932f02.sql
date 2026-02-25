
-- Create deposits table to track admin-added funds
CREATE TABLE public.deposits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

-- Users can view own deposits
CREATE POLICY "Users can view own deposits" ON public.deposits
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert deposits
CREATE POLICY "Admins can insert deposits" ON public.deposits
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.deposits;

-- Modify adjust_user_balance to also insert a deposit record for positive adjustments
CREATE OR REPLACE FUNCTION public.adjust_user_balance(_target_user_id uuid, _adjustment numeric, _reason text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check admin role
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Upsert balance
  INSERT INTO public.user_balances (user_id, usdt_balance, updated_at)
  VALUES (_target_user_id, GREATEST(0, _adjustment), now())
  ON CONFLICT (user_id) DO UPDATE
  SET usdt_balance = GREATEST(0, user_balances.usdt_balance + _adjustment),
      updated_at = now();

  -- Log deposit for positive adjustments
  IF _adjustment > 0 THEN
    INSERT INTO public.deposits (user_id, amount, reason)
    VALUES (_target_user_id, _adjustment, _reason);
  END IF;

  -- Audit log
  INSERT INTO public.admin_audit_logs (admin_id, action, target_user_id, details)
  VALUES (auth.uid(), 'adjust_balance', _target_user_id,
    jsonb_build_object('adjustment', _adjustment, 'reason', _reason));

  RETURN true;
END;
$$;
