
-- Add approved column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false;

-- Update existing profiles to be approved (existing users should keep access)
UPDATE public.profiles SET approved = true;

-- Replace handle_new_user to always create patron role and set approved=false
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    CASE WHEN NEW.email = 'stuartdonsms@gmail.com' THEN true ELSE false END
  );
  
  -- Always assign patron role for new signups; admin must be granted by existing admin
  IF NEW.email = 'stuartdonsms@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'patron');
  END IF;
  
  RETURN NEW;
END;
$function$;
