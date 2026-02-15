
-- Update handle_new_user to only create profile AFTER email confirmation
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only create profile if email is confirmed
  IF NEW.email_confirmed_at IS NOT NULL THEN
    -- Check if profile already exists (prevent duplicates)
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
      INSERT INTO public.profiles (user_id, full_name, email, phone, country)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'country', '')
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Update handle_new_user_balance to only create balance/role AFTER email confirmation
CREATE OR REPLACE FUNCTION public.handle_new_user_balance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only create balance and role if email is confirmed
  IF NEW.email_confirmed_at IS NOT NULL THEN
    -- Check if balance already exists (prevent duplicates)
    IF NOT EXISTS (SELECT 1 FROM public.user_balances WHERE user_id = NEW.id) THEN
      INSERT INTO public.user_balances (user_id, usdt_balance)
      VALUES (NEW.id, 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'user');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Add UPDATE triggers on auth.users so when email gets confirmed, profile/balance are created
CREATE OR REPLACE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE TRIGGER on_auth_user_confirmed_balance
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user_balance();
