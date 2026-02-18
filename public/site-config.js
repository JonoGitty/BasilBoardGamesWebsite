/**
 * Runtime configuration for static game pages.
 *
 * This file is the single deployment config point for values that
 * static pages (public/games/*) cannot read from Vite env vars.
 * React pages use VITE_SUPABASE_URL instead.
 *
 * Update BASIL_FEEDBACK_INGEST_URL when changing Supabase projects.
 */
(function () {
  "use strict";
  window.BASIL_FEEDBACK_INGEST_URL =
    "https://lwqfelwdnnluuiqipryn.supabase.co/functions/v1/feedback-ingest";
})();
