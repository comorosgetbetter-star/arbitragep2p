-- Fix address_rotation RLS policies - they are all RESTRICTIVE which causes AND logic
-- Drop existing restrictive policies and recreate as PERMISSIVE

DROP POLICY IF EXISTS "Admins can manage rotation" ON public.address_rotation;
DROP POLICY IF EXISTS "Anyone can read rotation" ON public.address_rotation;
DROP POLICY IF EXISTS "Auth users can update rotation" ON public.address_rotation;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Anyone can read rotation"
ON public.address_rotation
FOR SELECT
USING (true);

CREATE POLICY "Auth users can update rotation"
ON public.address_rotation
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage rotation"
ON public.address_rotation
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Also fix usdt_addresses policies - "Anyone can view active addresses" is RESTRICTIVE
DROP POLICY IF EXISTS "Anyone can view active addresses" ON public.usdt_addresses;
DROP POLICY IF EXISTS "Admins can manage addresses" ON public.usdt_addresses;

CREATE POLICY "Anyone can view active addresses"
ON public.usdt_addresses
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage addresses"
ON public.usdt_addresses
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));