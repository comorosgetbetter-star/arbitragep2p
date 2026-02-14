
-- Fix address_rotation: remove restrictive ALL policy that blocks non-admin SELECT
DROP POLICY IF EXISTS "Admins can manage rotation" ON public.address_rotation;

-- Admin-specific policies (permissive, won't block other SELECT)
CREATE POLICY "Admins can insert rotation"
  ON public.address_rotation FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete rotation"
  ON public.address_rotation FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix usdt_addresses: remove restrictive ALL policy that blocks non-admin SELECT
DROP POLICY IF EXISTS "Admins can manage addresses" ON public.usdt_addresses;

-- Replace with specific admin policies
CREATE POLICY "Admins can insert addresses"
  ON public.usdt_addresses FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update addresses"
  ON public.usdt_addresses FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete addresses"
  ON public.usdt_addresses FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));
