
-- Fix 1: Replace public SELECT on banned_users with a function-based check
DROP POLICY IF EXISTS "Anyone can check banned status" ON public.banned_users;

-- Create a security definer function to check ban status without exposing PII
CREATE OR REPLACE FUNCTION public.is_email_banned(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.banned_users
    WHERE lower(email) = lower(_email)
  )
$$;

-- Fix 2: Restrict address_rotation UPDATE to admins only
DROP POLICY IF EXISTS "Auth users can update rotation" ON public.address_rotation;
CREATE POLICY "Admins can update rotation"
  ON public.address_rotation FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
