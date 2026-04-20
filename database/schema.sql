-- ════════════════════════════════════════════════
-- Health Maps — Final Supabase Schema
-- Run the full file in Supabase SQL Editor → New Query
-- ══════════════════════════════════════════════════

-- Drop everything cleanly (safe to re-run)
DROP TABLE IF EXISTS public.uploads           CASCADE;
DROP TABLE IF EXISTS public.user_club_mapping CASCADE;
DROP TABLE IF EXISTS public.clubs             CASCADE;
DROP TABLE IF EXISTS public.users             CASCADE;
DROP TRIGGER  IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_auth_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin()             CASCADE;

-- ── TABLE 1: users ──────────────────────────────────────────
-- Stores all registered users (admin + client)
CREATE TABLE public.users (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  email        TEXT        NOT NULL UNIQUE,
  phone_number TEXT,
  role         TEXT        NOT NULL DEFAULT 'client'
                           CHECK (role IN ('admin', 'client')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-insert a users row when Supabase Auth creates a new user
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

-- ── TABLE 2: clubs (golf clubs) ─────────────────────────────
-- slug is the folder name inside the R2 "maptiles" bucket
-- e.g. club "Royal Greens" → slug "royal-greens"
--      R2 path: maptiles/royal-greens/{timestamp}-{file}.png
CREATE TABLE public.clubs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  club_name  TEXT        NOT NULL,
  slug       TEXT        NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── TABLE 3: user_club_mapping ──────────────────────────────
-- Each client belongs to at most ONE golf club (UNIQUE on user_id)
CREATE TABLE public.user_club_mapping (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.users(id)  ON DELETE CASCADE,
  club_id     UUID        NOT NULL REFERENCES public.clubs(id)  ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

-- ── TABLE 4: uploads ────────────────────────────────────────
-- Log of every PNG uploaded to Cloudflare R2 bucket "maptiles"
CREATE TABLE public.uploads (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id     UUID        NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  file_name   TEXT        NOT NULL,                            -- original filename
  file_key    TEXT        NOT NULL,                            -- R2 key: royal-greens/1714000000-hole1.png
  file_url    TEXT        NOT NULL,                            -- full public R2 URL
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ════════════════════════════════════════════════
ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_club_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads           ENABLE ROW LEVEL SECURITY;

-- Helper: is the current session an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- users: own row or admin
CREATE POLICY "users: read own or admin"
  ON public.users FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "users: insert own"
  ON public.users FOR INSERT
  WITH CHECK (id = auth.uid());

-- clubs: any logged-in user reads; only admin writes
CREATE POLICY "clubs: authenticated read"
  ON public.clubs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "clubs: admin write"
  ON public.clubs FOR ALL
  USING (public.is_admin());

-- user_club_mapping: own row or admin
CREATE POLICY "ucm: read own or admin"
  ON public.user_club_mapping FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "ucm: admin write"
  ON public.user_club_mapping FOR ALL
  USING (public.is_admin());

-- uploads: admin only
CREATE POLICY "uploads: admin all"
  ON public.uploads FOR ALL
  USING (public.is_admin());

-- ════════════════════════════════════════════════
-- AFTER SETUP: promote your first admin
-- Run this AFTER registering via the app
-- ══════════════════════════════════════════════
-- UPDATE public.users SET role = 'admin' WHERE email = 'your@email.com';


-- ══════════════════════════════════════════════
-- USEFUL QUERIES FOR TESTING
-- ══════════════════════════════════════════════

-- See all users
-- SELECT id, name, email, phone_number, role, created_at FROM public.users ORDER BY created_at DESC;

-- See all golf clubs + their R2 folder
-- SELECT id, club_name, slug, 'maptiles/' || slug || '/' AS r2_folder FROM public.clubs;

-- See all assignments
-- SELECT u.name, u.email, c.club_name, m.assigned_at
-- FROM public.user_club_mapping m
-- JOIN public.users u ON u.id = m.user_id
-- JOIN public.clubs c ON c.id = m.club_id;

-- See upload log
-- SELECT u.file_name, u.file_key, u.file_url, c.club_name, u.uploaded_at
-- FROM public.uploads u
-- JOIN public.clubs c ON c.id = u.club_id
-- ORDER BY u.uploaded_at DESC;
