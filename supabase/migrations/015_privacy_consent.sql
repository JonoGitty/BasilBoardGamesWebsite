-- 015_privacy_consent.sql — Track when users accept privacy policy

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS privacy_policy_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS privacy_policy_version text;
