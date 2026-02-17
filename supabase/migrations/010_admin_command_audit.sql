-- ============================================================
-- 010_admin_command_audit.sql — deterministic command audit log
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_command_log (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  command     text        NOT NULL,
  actor_id    uuid        NOT NULL,
  args        jsonb       NOT NULL DEFAULT '{}',
  success     boolean     NOT NULL,
  error_code  text,
  error_msg   text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for querying by actor or command name
CREATE INDEX idx_admin_cmd_log_actor  ON public.admin_command_log (actor_id);
CREATE INDEX idx_admin_cmd_log_cmd    ON public.admin_command_log (command);
CREATE INDEX idx_admin_cmd_log_time   ON public.admin_command_log (created_at DESC);

-- No RLS — only the edge function (service_role) writes to this table.
-- Admins can read via RPC or future dashboard query.
ALTER TABLE public.admin_command_log ENABLE ROW LEVEL SECURITY;

-- Admins can read audit logs
CREATE POLICY "Admins read command log"
  ON public.admin_command_log FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- No insert/update/delete policies — only service_role can write
