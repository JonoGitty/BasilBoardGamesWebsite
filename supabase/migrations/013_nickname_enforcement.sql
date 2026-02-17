-- ============================================================
-- 013_nickname_enforcement.sql — Crown emoji restriction + unique nicknames
-- ============================================================

-- 1. Add nickname_canonical column for uniqueness enforcement
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nickname_canonical text;

-- 2. Backfill canonical forms from existing display_name values
UPDATE public.profiles
SET nickname_canonical = lower(regexp_replace(trim(display_name), '\s+', ' ', 'g'))
WHERE display_name IS NOT NULL AND trim(display_name) <> '';

-- Empty/blank display names get NULL canonical (excluded from uniqueness)
UPDATE public.profiles
SET nickname_canonical = NULL
WHERE display_name IS NULL OR trim(display_name) = '';

-- 3. Resolve pre-existing duplicate canonical nicknames
--    Keep the earliest user's nickname; append -2, -3, etc. to later ones
WITH dupes AS (
  SELECT id, nickname_canonical,
         row_number() OVER (
           PARTITION BY nickname_canonical
           ORDER BY updated_at ASC
         ) AS rn
  FROM public.profiles
  WHERE nickname_canonical IS NOT NULL
)
UPDATE public.profiles p
SET display_name       = p.display_name || '-' || d.rn::text,
    nickname_canonical = d.nickname_canonical || '-' || d.rn::text
FROM dupes d
WHERE p.id = d.id AND d.rn > 1;

-- 4. Partial unique index (only non-null canonical names participate)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_nickname_canonical
  ON public.profiles (nickname_canonical)
  WHERE nickname_canonical IS NOT NULL;

-- 5. Trigger: auto-compute canonical + enforce crown restriction
CREATE OR REPLACE FUNCTION public.enforce_nickname_rules()
RETURNS trigger AS $$
BEGIN
  -- Compute canonical form from display_name
  IF NEW.display_name IS NOT NULL AND trim(NEW.display_name) <> '' THEN
    NEW.nickname_canonical := lower(regexp_replace(trim(NEW.display_name), '\s+', ' ', 'g'));
  ELSE
    NEW.nickname_canonical := NULL;
  END IF;

  -- Crown emoji (U+1F451): only admins may use it in display_name
  IF position(chr(128081) in coalesce(NEW.display_name, '')) > 0
     AND NEW.role <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can use 👑 in nicknames'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_nickname_rules ON public.profiles;

CREATE TRIGGER trg_enforce_nickname_rules
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_nickname_rules();

-- 6. RPC for frontend uniqueness checks (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_nickname_taken(candidate text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  canonical text;
  taken boolean;
BEGIN
  canonical := lower(regexp_replace(trim(candidate), '\s+', ' ', 'g'));

  IF canonical IS NULL OR canonical = '' THEN
    RETURN false;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM profiles
    WHERE nickname_canonical = canonical
      AND id <> auth.uid()
  ) INTO taken;

  RETURN taken;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_nickname_taken(text) TO authenticated;
