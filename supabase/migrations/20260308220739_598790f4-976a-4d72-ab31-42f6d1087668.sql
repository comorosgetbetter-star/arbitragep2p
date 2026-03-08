
-- KYC submissions table
CREATE TABLE public.kyc_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL, -- 'id', 'dl', 'passport'
  document_url TEXT NOT NULL,
  selfie_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'declined'
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  decline_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "Users can view own kyc" ON public.kyc_submissions
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Users can insert own submissions
CREATE POLICY "Users can insert own kyc" ON public.kyc_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can update submissions
CREATE POLICY "Admins can update kyc" ON public.kyc_submissions
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false);

-- Users can upload to their own folder
CREATE POLICY "Users can upload kyc docs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can view their own docs
CREATE POLICY "Users can view own kyc docs" ON storage.objects
  FOR SELECT USING (bucket_id = 'kyc-documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));

-- Admins can view all kyc docs
CREATE POLICY "Admins can view all kyc docs" ON storage.objects
  FOR SELECT USING (bucket_id = 'kyc-documents' AND public.has_role(auth.uid(), 'admin'));
