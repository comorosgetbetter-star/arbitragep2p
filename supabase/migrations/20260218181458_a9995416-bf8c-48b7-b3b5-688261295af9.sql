
-- Create p2p_orders table for admin-created sell orders
CREATE TABLE public.p2p_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_name TEXT NOT NULL,
  seller_avatar_url TEXT,
  min_amount NUMERIC NOT NULL,
  max_amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'USDT',
  payment_address TEXT NOT NULL,
  payment_window_minutes INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.p2p_orders ENABLE ROW LEVEL SECURITY;

-- Anyone can view active orders
CREATE POLICY "Anyone can view active p2p orders"
ON public.p2p_orders
FOR SELECT
USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage p2p orders"
ON public.p2p_orders
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_p2p_orders_updated_at
BEFORE UPDATE ON public.p2p_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
