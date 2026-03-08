
-- Table for managing which cryptos are enabled for deposits
CREATE TABLE public.deposit_crypto_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL UNIQUE,
  name text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT false,
  deposit_address text DEFAULT '',
  network text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deposit_crypto_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read (needed for deposit page)
CREATE POLICY "Anyone can read crypto settings"
  ON public.deposit_crypto_settings FOR SELECT
  USING (true);

-- Only admins can manage
CREATE POLICY "Admins can manage crypto settings"
  ON public.deposit_crypto_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default cryptos (USDT enabled, others disabled)
INSERT INTO public.deposit_crypto_settings (symbol, name, is_enabled, network) VALUES
  ('USDT', 'Tether', true, 'trc20'),
  ('BTC', 'Bitcoin', false, ''),
  ('ETH', 'Ethereum', false, ''),
  ('BNB', 'BNB', false, ''),
  ('SOL', 'Solana', false, ''),
  ('XRP', 'XRP', false, '');

-- Trigger for updated_at
CREATE TRIGGER update_deposit_crypto_settings_updated_at
  BEFORE UPDATE ON public.deposit_crypto_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
