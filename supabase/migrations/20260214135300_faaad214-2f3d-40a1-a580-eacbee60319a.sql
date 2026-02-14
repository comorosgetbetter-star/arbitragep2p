
-- Table for admin-managed USDT addresses
CREATE TABLE public.usdt_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  network TEXT NOT NULL, -- trc20, erc20, bep20
  address_type TEXT NOT NULL, -- 'deposit' for Add Funds, 'trade' for offer/payment page
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.usdt_addresses ENABLE ROW LEVEL SECURITY;

-- Everyone can read active addresses
CREATE POLICY "Anyone can view active addresses"
ON public.usdt_addresses
FOR SELECT
USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage addresses"
ON public.usdt_addresses
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Track which trade address was last used for rotation
CREATE TABLE public.address_rotation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address_type TEXT NOT NULL UNIQUE, -- 'trade'
  last_used_index INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.address_rotation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rotation"
ON public.address_rotation
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage rotation"
ON public.address_rotation
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can update rotation index
CREATE POLICY "Auth users can update rotation"
ON public.address_rotation
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Initialize rotation tracker
INSERT INTO public.address_rotation (address_type, last_used_index) VALUES ('trade', 0);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.usdt_addresses;
