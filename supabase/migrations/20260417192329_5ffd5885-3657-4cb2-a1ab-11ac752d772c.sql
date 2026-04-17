CREATE OR REPLACE FUNCTION public.normalize_withdrawal_symbol(_crypto_symbol text, _network text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF _crypto_symbol IS NOT NULL AND upper(_crypto_symbol) <> 'USDT' THEN
    RETURN upper(_crypto_symbol);
  END IF;

  CASE lower(coalesce(_network, ''))
    WHEN 'btc' THEN RETURN 'BTC';
    WHEN 'btc-lightning' THEN RETURN 'BTC';
    WHEN 'solana' THEN RETURN 'SOL';
    WHEN 'xrp' THEN RETURN 'XRP';
    WHEN 'ltc' THEN RETURN 'LTC';
    WHEN 'doge' THEN RETURN 'DOGE';
    WHEN 'arbitrum' THEN RETURN 'ETH';
    WHEN 'bep2' THEN RETURN 'BNB';
    ELSE RETURN coalesce(upper(_crypto_symbol), 'USDT');
  END CASE;
END;
$$;