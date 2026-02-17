-- 008_account_deletion.sql — Soft-delete: add deletion_requested_at + RPC

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz;

-- RPC that authenticated users call to request their own account deletion.
-- Uses SECURITY DEFINER so it bypasses RLS; scoped to auth.uid() only.
CREATE OR REPLACE FUNCTION public.request_account_deletion()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET deletion_requested_at = now()
  WHERE id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_account_deletion() TO authenticated;
