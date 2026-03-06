
-- Add cover_image_url to books
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS cover_image_url text;

-- Create book_copies table for individual copy tracking
CREATE TABLE public.book_copies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  copy_number integer NOT NULL DEFAULT 1,
  copy_id text NOT NULL UNIQUE,
  qr_code_url text,
  status text NOT NULL DEFAULT 'available',
  condition text DEFAULT 'good',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.book_copies ENABLE ROW LEVEL SECURITY;

-- RLS policies for book_copies
CREATE POLICY "Anyone can view book copies" ON public.book_copies
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage book copies" ON public.book_copies
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Create borrow_records table for QR-based circulation
CREATE TABLE public.borrow_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  copy_id uuid NOT NULL REFERENCES public.book_copies(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  borrow_date timestamptz NOT NULL DEFAULT now(),
  due_date timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  return_date timestamptz,
  status text NOT NULL DEFAULT 'borrowed',
  renewed_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.borrow_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage borrow records" ON public.borrow_records
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own borrow records" ON public.borrow_records
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Storage bucket for book covers
INSERT INTO storage.buckets (id, name, public)
VALUES ('book-covers', 'book-covers', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can upload book covers"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'book-covers' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete book covers"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'book-covers' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view book covers"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'book-covers');
