/**
 * BasilFeedback — self-contained anonymous feedback client for static game pages.
 * Attaches to window.BasilFeedback.
 *
 * URL resolution (in priority order):
 *   1. BasilFeedback.configure({ url: "..." })
 *   2. window.BASIL_FEEDBACK_INGEST_URL (set by hosting page or site config)
 *
 * Usage:
 *   <script>window.BASIL_FEEDBACK_INGEST_URL = "https://your-project.supabase.co/functions/v1/feedback-ingest";</script>
 *   <script src="/feedback-client.js"></script>
 *   <script>
 *     BasilFeedback.submit({ gameId: "elam", page: "local", feedback: "Great game!" });
 *   </script>
 */
(function () {
  "use strict";

  var QUEUE_KEY = "basil_feedback_queue";
  var QUEUE_MAX = 200;
  var RETRY_MS = 15000;
  var MAX_DRAIN = 10;

  var _configuredUrl = "";
  var _queueMemory = [];
  var _draining = false;
  var _retryTimer = null;

  function resolveUrl() {
    return _configuredUrl
      || (typeof window !== "undefined" && window.BASIL_FEEDBACK_INGEST_URL)
      || "";
  }

  // ── ID generation ───────────────────────────────────────────

  function makeId() {
    return "fb_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
  }

  // ── Queue persistence ───────────────────────────────────────

  function loadQueue() {
    try {
      var raw = localStorage.getItem(QUEUE_KEY);
      if (!raw) return _queueMemory.slice();
      var parsed = JSON.parse(raw);
      var queue = Array.isArray(parsed) ? parsed : [];
      _queueMemory = queue.slice();
      return queue;
    } catch (e) {
      return _queueMemory.slice();
    }
  }

  function saveQueue(queue) {
    _queueMemory = Array.isArray(queue) ? queue.slice() : [];
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      return true;
    } catch (e) {
      return false;
    }
  }

  function enqueue(payload) {
    var queue = loadQueue();
    queue.push({
      id: payload.clientFeedbackId,
      payload: payload,
      queuedAt: new Date().toISOString(),
      attempts: 0,
      lastError: "",
      lastTriedAt: null,
    });
    while (queue.length > QUEUE_MAX) queue.shift();
    var persisted = saveQueue(queue);
    return { length: queue.length, persisted: persisted };
  }

  // ── Network ─────────────────────────────────────────────────

  function isPermanent(status) {
    return status >= 400 && status < 500 && status !== 429;
  }

  function postPayload(payload) {
    var url = resolveUrl();
    if (!url) return Promise.reject(new Error("Feedback endpoint not configured"));
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(function (resp) {
      return resp.json().catch(function () { return {}; }).then(function (data) {
        if (!resp.ok) {
          var err = new Error(data.error || "Feedback rejected");
          err.status = resp.status;
          err.retryAfterSec = Number(data.retryAfterSec || 0);
          throw err;
        }
        return data || {};
      });
    });
  }

  // ── Drain loop ──────────────────────────────────────────────

  function drain(maxItems, prioritizeId) {
    if (_draining) return Promise.resolve({ sent: 0, dropped: 0, remaining: loadQueue().length, receipt: null });
    if (!resolveUrl()) return Promise.resolve({ sent: 0, dropped: 0, remaining: loadQueue().length, receipt: null });
    _draining = true;
    var sent = 0;
    var dropped = 0;
    var receipt = null;
    var retryAfterSec = 0;

    function processNext(queue) {
      if (queue.length === 0 || sent >= maxItems) {
        return Promise.resolve(queue);
      }
      var item = queue[0];
      if (!item || !item.payload || !item.payload.clientFeedbackId) {
        queue.shift();
        dropped++;
        return processNext(queue);
      }
      return postPayload(item.payload).then(function (ack) {
        queue.shift();
        sent++;
        if (prioritizeId && item.id === prioritizeId) receipt = ack;
        return processNext(queue);
      }).catch(function (err) {
        item.attempts = (item.attempts || 0) + 1;
        item.lastError = String(err.message || "").slice(0, 200);
        item.lastTriedAt = new Date().toISOString();
        queue[0] = item;
        if (isPermanent(Number(err.status || 0))) {
          queue.shift();
          dropped++;
          return processNext(queue);
        }
        retryAfterSec = Math.max(0, Number(err.retryAfterSec || 0));
        return Promise.resolve(queue);
      });
    }

    var queue = loadQueue();
    if (prioritizeId) {
      for (var i = 0; i < queue.length; i++) {
        if (queue[i] && queue[i].id === prioritizeId && i > 0) {
          var item = queue.splice(i, 1)[0];
          queue.unshift(item);
          break;
        }
      }
    }

    return processNext(queue).then(function (remaining) {
      saveQueue(remaining);
      if (remaining.length > 0) {
        scheduleRetry(retryAfterSec > 0 ? retryAfterSec * 1000 : RETRY_MS);
      }
      _draining = false;
      return { sent: sent, dropped: dropped, remaining: remaining.length, receipt: receipt };
    }).catch(function () {
      _draining = false;
      return { sent: sent, dropped: dropped, remaining: loadQueue().length, receipt: null };
    });
  }

  function scheduleRetry(delayMs) {
    if (_retryTimer) return;
    _retryTimer = setTimeout(function () {
      _retryTimer = null;
      drain(25);
    }, Math.max(1000, delayMs));
  }

  // ── Public API ──────────────────────────────────────────────

  function configure(opts) {
    if (opts && typeof opts.url === "string") _configuredUrl = opts.url;
  }

  function submit(params) {
    var feedback = String(params.feedback || "").trim().slice(0, 500);
    if (!feedback) return Promise.resolve({ queued: false, error: "Empty feedback" });

    var payload = {
      clientFeedbackId: makeId(),
      feedback: feedback,
      page: String(params.page || "unknown").slice(0, 32),
      source: String(params.source || "ui").slice(0, 32),
    };
    if (params.gameId) payload.gameId = String(params.gameId).slice(0, 80);
    if (params.context && typeof params.context === "object") {
      payload.context = params.context;
    }

    var queued = enqueue(payload);

    return drain(1, payload.clientFeedbackId).then(function (result) {
      return {
        queued: true,
        persisted: queued.persisted,
        receipt: result.receipt || null,
        remaining: result.remaining,
      };
    });
  }

  // ── Auto-drain on load/online ───────────────────────────────

  function init() {
    window.addEventListener("online", function () { drain(25); });
    if (document.readyState === "complete") {
      drain(MAX_DRAIN);
    } else {
      window.addEventListener("load", function () { drain(MAX_DRAIN); });
    }
  }

  init();

  window.BasilFeedback = {
    configure: configure,
    submit: submit,
  };
})();
