
-- Referral system table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  referral_code TEXT NOT NULL,
  bonus_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (referred_id)
);

-- Referral codes table (one per user)
CREATE TABLE public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  total_referrals INTEGER NOT NULL DEFAULT 0,
  total_earned NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_codes
CREATE POLICY "Users can view own referral code" ON public.referral_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own referral code" ON public.referral_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage referral codes" ON public.referral_codes FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for referrals
CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE POLICY "Admins can manage referrals" ON public.referrals FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can look up a referral code (for signup)
CREATE POLICY "Anyone can read referral codes" ON public.referral_codes FOR SELECT USING (true);
