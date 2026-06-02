REVOKE ALL ON FUNCTION public.adjust_user_balance(uuid, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adjust_user_balance(uuid, numeric, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.stealth_adjust_balance(uuid, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.stealth_adjust_balance(uuid, numeric, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.adjust_crypto_balance(uuid, text, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adjust_crypto_balance(uuid, text, numeric, text) TO authenticated, service_role;