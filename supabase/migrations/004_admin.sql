-- ============================================================
-- 004_admin.sql — Admin role, posts table, admin-only writes
-- ============================================================

-- 1. Add role column to profiles
ALTER TABLE public.profiles
  ADD COLUMN role text NOT NULL DEFAULT 'user'
  CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));

-- Prevent users from changing their own role via RLS.
-- Drop and recreate the update policy with a WITH CHECK guard.
DROP POLICY "Users update own profile" ON public.profiles;

CREATE POLICY "Users update own profile (no role change)"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  );

-- 2. Add updated_at to games table (audit field)
ALTER TABLE public.games
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

-- Admin write policies for games
CREATE POLICY "Admins update games"
  ON public.games FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins insert games"
  ON public.games FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. Posts table (What's New content)
CREATE TABLE public.posts (
  id           text        PRIMARY KEY,
  title        text        NOT NULL,
  description  text        NOT NULL,
  emoji        text        NOT NULL,
  category     text        NOT NULL CHECK (category IN ('patch', 'experiment', 'announcement')),
  published    boolean     NOT NULL DEFAULT false,
  published_at timestamptz,
  created_by   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read published posts
CREATE POLICY "Public read published posts"
  ON public.posts FOR SELECT
  USING (published = true);

-- Admins can read all posts (including drafts)
CREATE POLICY "Admins read all posts"
  ON public.posts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can insert posts
CREATE POLICY "Admins insert posts"
  ON public.posts FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update posts
CREATE POLICY "Admins update posts"
  ON public.posts FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can delete posts
CREATE POLICY "Admins delete posts"
  ON public.posts FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. Seed existing What's New posts
INSERT INTO public.posts (id, title, description, emoji, category, published, published_at) VALUES
  ('ann-game-night',        'Game Night This Friday',       'Join us for an evening of Almost, Sidequests, and more at the community hall. Doors open at 6 pm.', '🎲', 'announcement', true, '2026-02-14T00:00:00Z'),
  ('patch-almost-v1.2',     'Almost v1.2 Balance Patch',    'Adjusted scoring for near-miss rounds and fixed the tie-breaker edge case.',                       '🔧', 'patch',        true, '2026-02-12T00:00:00Z'),
  ('exp-elam-draft',        'Elam: Draft Variant Experiment','Trying a card-draft opener before the main trade phase. Playtest feedback welcome.',               '🧪', 'experiment',   true, '2026-02-10T00:00:00Z'),
  ('ann-hex-havoc-launch',  'Hex Havoc Now Active',         'Our newest territorial strategy game is live in the library. Grab a copy and try it out.',          '⬡',  'announcement', true, '2026-02-08T00:00:00Z'),
  ('patch-interrogate-v2.0','Interrogate v2.0 Overhaul',    'Major rules rewrite: new question deck, shorter rounds, and a solo mode.',                         '📋', 'patch',        true, '2026-02-05T00:00:00Z'),
  ('exp-sidequests-coop',   'Sidequests Co-op Mode Test',   'Can Sidequests work as a fully cooperative experience? Early playtests say yes.',                   '🤝', 'experiment',   true, '2026-02-01T00:00:00Z'),
  ('ann-tall-tales-preview','Tall Tales: Sneak Peek',       'First look at the storytelling bluff game joining the active roster next month.',                   '📖', 'announcement', true, '2026-01-28T00:00:00Z');
