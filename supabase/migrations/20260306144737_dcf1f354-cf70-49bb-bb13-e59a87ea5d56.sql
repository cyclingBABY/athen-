
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
            WHEN COALESCE(NEW.raw_user_meta_data->>'account_type', 'patron') = 'lecturer' THEN (now() + INTERVAL '6 years')
            ELSE (now() + INTERVAL '4 years')
        END
    );

    IF NEW.email = 'stuartdonsms@gmail.com' THEN
        INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
    ELSIF COALESCE(NEW.raw_user_meta_data->>'account_type', 'patron') = 'lecturer' THEN
        INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'lecturer');
    ELSE
        INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'patron');
    END IF;

    RETURN NEW;
END;
$function$;
