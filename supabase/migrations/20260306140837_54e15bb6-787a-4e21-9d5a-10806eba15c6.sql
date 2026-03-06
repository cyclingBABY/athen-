
-- Add 'lecturer' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'lecturer';

-- Add department and staff_id columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS staff_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_expires_at TIMESTAMP WITH TIME ZONE;

-- Course reading lists table
CREATE TABLE IF NOT EXISTS public.course_reading_lists (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lecturer_id UUID NOT NULL,
    course_name TEXT NOT NULL,
    course_code TEXT,
    description TEXT,
    semester TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reading list items (books in a reading list)
CREATE TABLE IF NOT EXISTS public.reading_list_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    reading_list_id UUID NOT NULL REFERENCES public.course_reading_lists(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id),
    is_required BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Book recommendations by lecturers
CREATE TABLE IF NOT EXISTS public.book_recommendations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lecturer_id UUID NOT NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    isbn TEXT,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.course_reading_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS policies for course_reading_lists
CREATE POLICY "Admins can manage reading lists" ON public.course_reading_lists FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Lecturers can manage own reading lists" ON public.course_reading_lists FOR ALL USING (auth.uid() = lecturer_id);
CREATE POLICY "Anyone can view reading lists" ON public.course_reading_lists FOR SELECT USING (true);

-- RLS policies for reading_list_items
CREATE POLICY "Admins can manage reading list items" ON public.reading_list_items FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Lecturers can manage own list items" ON public.reading_list_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.course_reading_lists WHERE id = reading_list_items.reading_list_id AND lecturer_id = auth.uid())
);
CREATE POLICY "Anyone can view reading list items" ON public.reading_list_items FOR SELECT USING (true);

-- RLS policies for book_recommendations
CREATE POLICY "Admins can manage recommendations" ON public.book_recommendations FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Lecturers can manage own recommendations" ON public.book_recommendations FOR ALL USING (auth.uid() = lecturer_id);
CREATE POLICY "Lecturers can view own recommendations" ON public.book_recommendations FOR SELECT USING (auth.uid() = lecturer_id);

-- Update handle_new_user to set expiry for patrons (4 years)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, email, registration_number, photo_url, approved, account_expires_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'registration_number', ''),
        COALESCE(NEW.raw_user_meta_data->>'photo_url', ''),
        CASE WHEN NEW.email = 'stuartdonsms@gmail.com' THEN true ELSE false END,
        CASE 
            WHEN NEW.email = 'stuartdonsms@gmail.com' THEN NULL
            ELSE (now() + INTERVAL '4 years')
        END
    );

    IF NEW.email = 'stuartdonsms@gmail.com' THEN
        INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
    ELSE
        INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'patron');
    END IF;

    RETURN NEW;
END;
$$;
