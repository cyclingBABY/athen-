
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS registration_number text,
ADD COLUMN IF NOT EXISTS photo_url text;
