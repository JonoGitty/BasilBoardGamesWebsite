ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS launcher_style text NOT NULL DEFAULT 'craft-desk';
