
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage crypto balances" ON public.user_crypto_balances;
DROP POLICY IF EXISTS "Users can view own crypto balances" ON public.user_crypto_balances;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Users can view own crypto balances"
  ON public.user_crypto_balances FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage crypto balances"
  ON public.user_crypto_balances FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
