-- 014_feedback.sql — Anonymous feedback from any game or page

CREATE TABLE public.feedback (
  id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at         timestamptz NOT NULL DEFAULT now(),
  game_id            text,
  page               text NOT NULL DEFAULT 'unknown',
  source             text NOT NULL DEFAULT 'ui',
  feedback_text      text NOT NULL CHECK (char_length(feedback_text) BETWEEN 1 AND 500),
  context_json       jsonb DEFAULT '{}',
  client_feedback_id text NOT NULL,
  ip_hash            text,
  status             text NOT NULL DEFAULT 'new'
                     CHECK (status IN ('new','reviewed','resolved','dismissed')),
  admin_note         text
);

CREATE UNIQUE INDEX idx_feedback_client_id ON public.feedback (client_feedback_id);
CREATE INDEX idx_feedback_ip_created ON public.feedback (ip_hash, created_at) WHERE ip_hash IS NOT NULL;
CREATE INDEX idx_feedback_status ON public.feedback (status);
CREATE INDEX idx_feedback_game ON public.feedback (game_id) WHERE game_id IS NOT NULL;
CREATE INDEX idx_feedback_created ON public.feedback (created_at DESC);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- No INSERT policy: only service_role (edge function) can insert
CREATE POLICY "Admins read feedback" ON public.feedback FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins update feedback" ON public.feedback FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
