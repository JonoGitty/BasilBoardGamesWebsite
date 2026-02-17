-- ============================================================
-- 008_admin_commands_only.sql — enforce command-only admin writes
-- ============================================================

-- Admin writes now flow through the `admin-command` edge function
-- (service_role + explicit admin role check).
-- Drop direct client-write policies so all mutations use deterministic commands.

DROP POLICY IF EXISTS "Admins update games" ON public.games;
DROP POLICY IF EXISTS "Admins insert games" ON public.games;

DROP POLICY IF EXISTS "Admins insert posts" ON public.posts;
DROP POLICY IF EXISTS "Admins update posts" ON public.posts;
DROP POLICY IF EXISTS "Admins delete posts" ON public.posts;
