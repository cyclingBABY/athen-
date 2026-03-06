-- ============================================
-- Athena Library Management System
-- Database Schema
-- ============================================

-- ==================
-- ENUMS
-- ==================
CREATE TYPE public.app_role AS ENUM ('admin', 'patron', 'lecturer');

-- ==================
-- TABLES
-- ==================

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    avatar_url TEXT,
    registration_number TEXT,
    photo_url TEXT,
    department TEXT,
    staff_id TEXT,
    account_expires_at TIMESTAMP WITH TIME ZONE,
    approved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Roles
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    role app_role NOT NULL DEFAULT 'patron',
    UNIQUE (user_id, role)
);

-- Books
CREATE TABLE public.books (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    isbn TEXT,
    category TEXT NOT NULL DEFAULT 'General',
    description TEXT,
    cover_color TEXT DEFAULT 'hsl(210 60% 50%)',
    cover_image_url TEXT,
    publish_year INTEGER,
    total_copies INTEGER NOT NULL DEFAULT 1,
    available_copies INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'available',
    shelf_location TEXT,
    barcode TEXT,
    digital_file_url TEXT,
    digital_file_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Book Copies
CREATE TABLE public.book_copies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    copy_id TEXT NOT NULL,
    book_id UUID NOT NULL REFERENCES public.books(id),
    copy_number INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'available',
    condition TEXT DEFAULT 'good',
    notes TEXT,
    qr_code_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Circulation Records
CREATE TABLE public.circulation_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID NOT NULL REFERENCES public.books(id),
    user_id UUID NOT NULL,
    checkout_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '14 days'),
    return_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'checked-out',
    renewed_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Borrow Records
CREATE TABLE public.borrow_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID NOT NULL REFERENCES public.books(id),
    copy_id UUID NOT NULL REFERENCES public.book_copies(id),
    user_id UUID NOT NULL,
    borrow_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '14 days'),
    return_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'borrowed',
    renewed_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reservations
CREATE TABLE public.reservations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID NOT NULL REFERENCES public.books(id),
    user_id UUID NOT NULL,
    reservation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Fines
CREATE TABLE public.fines (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    circulation_id UUID REFERENCES public.circulation_records(id),
    amount NUMERIC NOT NULL DEFAULT 0,
    reason TEXT,
    paid BOOLEAN NOT NULL DEFAULT false,
    paid_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Course Reading Lists (Lecturers)
CREATE TABLE public.course_reading_lists (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lecturer_id UUID NOT NULL,
    course_name TEXT NOT NULL,
    course_code TEXT,
    description TEXT,
    semester TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reading List Items
CREATE TABLE public.reading_list_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    reading_list_id UUID NOT NULL REFERENCES public.course_reading_lists(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id),
    is_required BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Book Recommendations (Lecturers)
CREATE TABLE public.book_recommendations (
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

-- ==================
-- ROW LEVEL SECURITY
-- ==================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_copies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circulation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrow_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_reading_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_recommendations ENABLE ROW LEVEL SECURITY;

-- ==================
-- FUNCTIONS
-- ==================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

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

-- ==================
-- TRIGGERS
-- ==================

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==================
-- RLS POLICIES
-- ==================

-- profiles
CREATE POLICY "Admins can manage profiles" ON public.profiles FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- user_roles
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- books
CREATE POLICY "Admins can manage books" ON public.books FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view books" ON public.books FOR SELECT USING (true);

-- book_copies
CREATE POLICY "Admins can manage book copies" ON public.book_copies FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view book copies" ON public.book_copies FOR SELECT USING (true);

-- circulation_records
CREATE POLICY "Admins can manage circulation" ON public.circulation_records FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own records" ON public.circulation_records FOR SELECT USING (auth.uid() = user_id);

-- borrow_records
CREATE POLICY "Admins can manage borrow records" ON public.borrow_records FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own borrow records" ON public.borrow_records FOR SELECT USING (auth.uid() = user_id);

-- reservations
CREATE POLICY "Admins can manage reservations" ON public.reservations FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create reservations" ON public.reservations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own reservations" ON public.reservations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can cancel own reservations" ON public.reservations FOR UPDATE USING (auth.uid() = user_id);

-- fines
CREATE POLICY "Admins can manage fines" ON public.fines FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own fines" ON public.fines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can pay own fines" ON public.fines FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- course_reading_lists
CREATE POLICY "Admins can manage reading lists" ON public.course_reading_lists FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Lecturers can manage own reading lists" ON public.course_reading_lists FOR ALL USING (auth.uid() = lecturer_id);
CREATE POLICY "Anyone can view reading lists" ON public.course_reading_lists FOR SELECT USING (true);

-- reading_list_items
CREATE POLICY "Admins can manage reading list items" ON public.reading_list_items FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Lecturers can manage own list items" ON public.reading_list_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.course_reading_lists WHERE id = reading_list_items.reading_list_id AND lecturer_id = auth.uid())
);
CREATE POLICY "Anyone can view reading list items" ON public.reading_list_items FOR SELECT USING (true);

-- book_recommendations
CREATE POLICY "Admins can manage recommendations" ON public.book_recommendations FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Lecturers can manage own recommendations" ON public.book_recommendations FOR ALL USING (auth.uid() = lecturer_id);
CREATE POLICY "Lecturers can view own recommendations" ON public.book_recommendations FOR SELECT USING (auth.uid() = lecturer_id);

-- ==================
-- STORAGE BUCKETS
-- ==================

INSERT INTO storage.buckets (id, name, public) VALUES ('digital-library', 'digital-library', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('book-covers', 'book-covers', true);

-- ==================
-- SCHEDULED JOBS
-- ==================
-- A cron job runs daily at 2 AM to invoke the cleanup-expired-accounts edge function.
-- Patron accounts expire after 4 years, lecturer accounts after 6 years.
