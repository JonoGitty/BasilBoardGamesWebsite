-- 017_promote_user_4a8567e3.sql
-- One-off operational migration to grant admin role to a specific user.

DO $$
DECLARE
  updated_rows integer;
BEGIN
  UPDATE public.profiles
  SET role = 'admin',
      updated_at = now()
  WHERE id = '4a8567e3-792c-44ab-a9ba-3001bc55d57a';

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  IF updated_rows = 0 THEN
    RAISE EXCEPTION 'Profile % not found; admin role not granted', '4a8567e3-792c-44ab-a9ba-3001bc55d57a';
  END IF;
END $$;
