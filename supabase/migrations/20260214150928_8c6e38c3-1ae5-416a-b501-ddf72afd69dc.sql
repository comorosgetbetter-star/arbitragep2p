-- verification_codes should only be accessed by service_role (edge functions)
-- Deny all access for regular users
CREATE POLICY "No public access to verification codes"
ON public.verification_codes
FOR ALL
USING (false)
WITH CHECK (false);