/**
 * VoiceGuard AI — API service layer.
 *
 * Every field name and response shape referenced here was verified directly
 * against the real backend source (api.py, detector.py) — not assumed.
 * Endpoints that actually exist: GET /, GET /health, POST /predict,
 * POST /predict/detailed. There is no websocket / streaming endpoint.
 */

const VG = window.VG || {};
window.VG = VG;

VG.API_BASE = ""; // same-origin by default (frontend served by FastAPI itself).
                   // If you serve the frontend separately, set this to
                   // e.g. "http://127.0.0.1:8000" before app.js runs.

VG.api = {
  async health() {
    const res = await fetch(`${VG.API_BASE}/health`);
    if (!res.ok) throw new Error(`Health check failed (${res.status})`);
    return res.json();
  },

  async systemInfo() {
    try {
      const res = await fetch(`${VG.API_BASE}/api/info`);
      if (res.ok) return await res.json();
    } catch {}
    const fallback = await fetch(`${VG.API_BASE}/`, { headers: { "Accept": "application/json" } });
    if (!fallback.ok) throw new Error(`System info request failed (${fallback.status})`);
    return fallback.json();
  },

  /**
   * Runs /predict/detailed (includes spectrogram + prosody plot images).
   * @param {File|Blob} file
   * @param {{sensitivity?: string, low_threshold?: number, high_threshold?: number, include_prosody?: boolean}} opts
   */
  async analyze(file, opts = {}) {
    const params = new URLSearchParams();
    params.set("sensitivity", opts.sensitivity || "balanced");
    if (opts.low_threshold != null) params.set("low_threshold", String(opts.low_threshold));
    if (opts.high_threshold != null) params.set("high_threshold", String(opts.high_threshold));
    params.set("include_prosody", String(opts.include_prosody !== false));

    const form = new FormData();
    form.append("file", file, file.name || "recording.wav");

    let res;
    try {
      res = await fetch(`${VG.API_BASE}/predict/detailed?${params.toString()}`, {
        method: "POST",
        body: form,
      });
    } catch (networkErr) {
      const e = new Error("BACKEND_UNREACHABLE");
      e.cause = networkErr;
      throw e;
    }

    let body;
    try {
      body = await res.json();
    } catch {
      throw new Error("MALFORMED_RESPONSE");
    }

    if (!res.ok) {
      // FastAPI HTTPException bodies look like { detail: "..." } or array of validation errors
      let detail = `Request failed (${res.status})`;
      if (body && body.detail) {
        if (Array.isArray(body.detail)) {
          detail = body.detail.map(d => (typeof d === "object" ? (d.msg || d.message || JSON.stringify(d)) : String(d))).join("; ");
        } else if (typeof body.detail === "object") {
          detail = body.detail.msg || body.detail.message || JSON.stringify(body.detail);
        } else {
          detail = String(body.detail);
        }
      } else if (body && body.message) {
        detail = String(body.message);
      }
      const e = new Error(detail);
      e.status = res.status;
      throw e;
    }

    return body;
  },

  // ============================================================
  // Voice Biometrics (Speaker Recognition)
  // ============================================================
  async listSpeakers() {
    const res = await fetch(`${VG.API_BASE}/speaker/list`);
    if (!res.ok) throw new Error(`Failed to list speakers (${res.status})`);
    return res.json();
  },

  async enrollSpeaker(file, speakerId, name, metadata = {}) {
    const params = new URLSearchParams();
    params.set("speaker_id", speakerId);
    params.set("name", name);
    params.set("metadata", JSON.stringify(metadata));

    const form = new FormData();
    form.append("file", file, file.name || "reference.wav");

    const res = await fetch(`${VG.API_BASE}/speaker/enroll?${params.toString()}`, {
      method: "POST",
      body: form,
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.detail || `Enrollment failed (${res.status})`);
    return body;
  },

  async deleteSpeaker(speakerId) {
    const res = await fetch(`${VG.API_BASE}/speaker/${encodeURIComponent(speakerId)}`, {
      method: "DELETE",
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.detail || `Delete failed (${res.status})`);
    return body;
  },

  // ============================================================
  // Contextual Risk Evaluation
  // ============================================================
  async evaluateContextual(formData) {
    const res = await fetch(`${VG.API_BASE}/predict/contextual`, {
      method: "POST",
      body: formData,
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.detail || `Contextual risk evaluation failed (${res.status})`);
    return body;
  },

  // ============================================================
  // Security Alerts & Webhooks
  // ============================================================
  async getRecentAlerts(limit = 20) {
    const res = await fetch(`${VG.API_BASE}/alerts/recent?limit=${limit}`);
    if (!res.ok) throw new Error(`Failed to fetch alerts (${res.status})`);
    return res.json();
  },

  async getWebhooks() {
    const res = await fetch(`${VG.API_BASE}/alerts/webhooks`);
    if (!res.ok) throw new Error(`Failed to fetch webhooks (${res.status})`);
    return res.json();
  },

  async configureWebhook(config) {
    const res = await fetch(`${VG.API_BASE}/alerts/configure-webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.detail || `Failed to configure webhook (${res.status})`);
    return body;
  },

  // ============================================================
  // WebSocket Telephony Stream Gateway
  // ============================================================
  getStreamSocketUrl() {
    const loc = window.location;
    const protocol = loc.protocol === "https:" ? "wss:" : "ws:";
    const host = loc.host || "127.0.0.1:8000";
    return `${protocol}//${host}/ws/stream`;
  },
};

