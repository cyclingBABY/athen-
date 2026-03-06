
-- Add a library_card_number column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS library_card_number TEXT UNIQUE;

-- Create a sequence for generating unique card numbers
CREATE SEQUENCE IF NOT EXISTS public.library_card_seq START WITH 1001;

-- Function to generate library card numbers
CREATE OR REPLACE FUNCTION public.generate_library_card_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    prefix TEXT;
    seq_val INT;
    card_number TEXT;
BEGIN
    -- Get the role for this user
    SELECT role INTO prefix FROM public.user_roles WHERE user_id = NEW.user_id LIMIT 1;
    
    seq_val := nextval('public.library_card_seq');
    
    IF prefix = 'admin' THEN
        card_number := 'ATH-ADM-' || LPAD(seq_val::TEXT, 5, '0');
    ELSIF prefix = 'lecturer' THEN
        card_number := 'ATH-STF-' || LPAD(seq_val::TEXT, 5, '0');
    ELSE
        card_number := 'ATH-STD-' || LPAD(seq_val::TEXT, 5, '0');
    END IF;
    
    NEW.library_card_number := card_number;
    RETURN NEW;
END;
$$;

-- Trigger to auto-assign card number on profile creation
CREATE TRIGGER assign_library_card_number
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    WHEN (NEW.library_card_number IS NULL)
    EXECUTE FUNCTION public.generate_library_card_number();
