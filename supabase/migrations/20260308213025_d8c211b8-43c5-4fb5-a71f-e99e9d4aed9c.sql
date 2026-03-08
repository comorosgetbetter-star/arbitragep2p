
-- Banned users table to prevent rejoining
CREATE TABLE public.banned_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  phone text,
  full_name text,
  reason text NOT NULL DEFAULT 'Banned by admin',
  banned_by uuid NOT NULL,
  banned_at timestamptz NOT NULL DEFAULT now()
);

-- Unique on email to prevent duplicates
CREATE UNIQUE INDEX banned_users_email_idx ON public.banned_users (lower(email));

-- RLS
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

-- Only admins can manage
CREATE POLICY "Admins can manage banned users"
  ON public.banned_users FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Anyone can check if banned (needed at registration)
CREATE POLICY "Anyone can check banned status"
  ON public.banned_users FOR SELECT
  USING (true);
