/**
 * Runtime configuration for Elam static page.
 *
 * This file is the deployment config point for static Elam ingest URLs.
 */
(function () {
  "use strict";
  window.BASIL_FEEDBACK_INGEST_URL =
    "https://lwqfelwdnnluuiqipryn.supabase.co/functions/v1/feedback-ingest";
  window.BASIL_EVENTS_INGEST_URL =
    "https://lwqfelwdnnluuiqipryn.supabase.co/functions/v1/events-ingest";
})();