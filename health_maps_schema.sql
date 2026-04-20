-- ========================================
-- HEALTH MAPS DATABASE SCHEMA
-- ========================================

-- Drop everything cleanly
DROP TABLE IF EXISTS public.uploads           CASCADE;
DROP TABLE IF EXISTS public.user_club_mapping CASCADE;
DROP TABLE IF EXISTS public.clubs             CASCADE;
DROP TABLE IF EXISTS public.users             CASCADE;
DROP TRIGGER  IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_auth_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin()             CASCADE;

CREATE TABLE public.users (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  email        TEXT        NOT NULL UNIQUE,
  phone_number TEXT,
  role         TEXT        NOT NULL DEFAULT 'client'
                           CHECK (role IN ('admin', 'client')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'client'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

CREATE TABLE public.clubs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  club_name  TEXT        NOT NULL,
  slug       TEXT        NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.user_club_mapping (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.users(id)  ON DELETE CASCADE,
  club_id     UUID        NOT NULL REFERENCES public.clubs(id)  ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE TABLE public.uploads (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id     UUID        NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  file_name   TEXT        NOT NULL,
  file_key    TEXT        NOT NULL,
  file_url    TEXT        NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_club_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads           ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE POLICY "users: read own or admin"
  ON public.users FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "users: insert own"
  ON public.users FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "clubs: authenticated read"
  ON public.clubs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "clubs: admin write"
  ON public.clubs FOR ALL
  USING (public.is_admin());

CREATE POLICY "ucm: read own or admin"
  ON public.user_club_mapping FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "ucm: admin write"
  ON public.user_club_mapping FOR ALL
  USING (public.is_admin());

CREATE POLICY "uploads: admin all"
  ON public.uploads FOR ALL
  USING (public.is_admin());

-- After registering, promote yourself to admin:
-- UPDATE public.users SET role = 'admin' WHERE email = 'your@email.com';
