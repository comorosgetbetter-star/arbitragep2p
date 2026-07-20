GRANT SELECT ON public.app_settings TO anon;
CREATE POLICY "Public can read sol_price_adjustment"
ON public.app_settings
FOR SELECT
TO anon, authenticated
USING (key = 'sol_price_adjustment');