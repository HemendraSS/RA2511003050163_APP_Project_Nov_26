(function () {
  "use strict";
  const VG = window.VG;
  let lastResult = null; // last successful /predict/detailed response, used by Report page

  // ============================================================
  // Routing — 4 Top-Level Views (Analyze and Stream are separate)
  // ============================================================
  const views = ["overview", "analyze", "stream", "report"];

  function navigate(view, updateHash = true) {
    if (!views.includes(view)) view = "overview";
    views.forEach((v) => {
      const el = document.getElementById(`view-${v}`);
      if (el) el.classList.toggle("active", v === view);
    });
    document.querySelectorAll(".nav-item").forEach((el) => {
      el.classList.toggle("active", el.dataset.view === view);
    });
    window.scrollTo({ top: 0 });

    if (updateHash && window.location.hash !== `#${view}`) {
      window.location.hash = view;
    }

    if (view === "report") renderReport();
    if (view === "analyze") {
      drawMicIdleBaseline();
    }
    if (view === "stream") {
      drawStreamIdleBaseline();
    }
  }

  window.addEventListener("hashchange", () => {
    const hash = (window.location.hash || "").replace("#", "");
    if (views.includes(hash)) {
      navigate(hash, false);
    }
  });

  window.addEventListener("popstate", () => {
    const hash = (window.location.hash || "").replace("#", "");
    if (views.includes(hash)) {
      navigate(hash, false);
    }
  });

  document.querySelectorAll("[data-view]").forEach((el) => {
    el.addEventListener("click", () => navigate(el.dataset.view));
  });

  const brandEl = document.querySelector(".brand");
  if (brandEl) {
    brandEl.addEventListener("click", () => navigate("overview"));
    brandEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.keyCode === 32 || e.keyCode === 13) {
        e.preventDefault();
        navigate("overview");
      }
    });
  }

  // ============================================================
  // Connection status (top bar) + Overview system status panel
  // ============================================================
  const connPill = document.getElementById("conn-pill");
  const connPillLabel = document.getElementById("conn-label");
  if (connPill) {
    const triggerConnRefresh = () => {
      if (connPillLabel) connPillLabel.textContent = "CHECKING...";
      refreshConnection();
    };
    connPill.addEventListener("click", triggerConnRefresh);
    connPill.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.keyCode === 32 || e.keyCode === 13) {
        e.preventDefault();
        triggerConnRefresh();
      }
    });
  }

  async function refreshConnection() {
    try {
      const health = await VG.api.health();
      if (connPill) connPill.className = "conn-pill ok";
      if (connPillLabel) connPillLabel.textContent = "API CONNECTED";
      renderSystemStatus(health, null);
    } catch (err) {
      try {
        await new Promise((r) => setTimeout(r, 1000));
        const retryHealth = await VG.api.health();
        if (connPill) connPill.className = "conn-pill ok";
        if (connPillLabel) connPillLabel.textContent = "API CONNECTED";
        renderSystemStatus(retryHealth, null);
      } catch (retryErr) {
        if (connPill) connPill.className = "conn-pill down";
        if (connPillLabel) connPillLabel.textContent = "BACKEND UNREACHABLE";
        renderSystemStatus(null, retryErr);
      }
    }
  }

  function renderSystemStatus(health, err) {
    const grid = document.getElementById("status-grid");
    if (!grid) return;
    if (!health) {
      grid.innerHTML = `
        <div class="panel status-card"><div class="k">MODEL STATUS</div><div class="v bad">UNKNOWN</div></div>
        <div class="panel status-card"><div class="k">DEVICE</div><div class="v bad">—</div></div>
        <div class="panel status-card"><div class="k">API STATUS</div><div class="v bad">UNREACHABLE</div></div>
        <div class="panel status-card"><div class="k">MODEL</div><div class="v bad">NOT LOADED</div></div>`;
      return;
    }
    grid.innerHTML = `
      <div class="panel status-card"><div class="k">MODEL STATUS</div><div class="v ok">ONLINE</div></div>
      <div class="panel status-card"><div class="k">DEVICE</div><div class="v">${esc(health.device || "—").toUpperCase()}</div></div>
      <div class="panel status-card"><div class="k">API STATUS</div><div class="v ok">CONNECTED</div></div>
      <div class="panel status-card"><div class="k">MODEL</div><div class="v ${health.model_loaded ? "ok" : "bad"}">${health.model_loaded ? "LOADED" : "NOT LOADED"}</div></div>`;
  }

  // ============================================================
  // Analyze Voice — Input Handling (Upload vs Record Mic)
  // ============================================================
  let activeFile = null; // File or Blob to send
  let activeFileName = "audio.wav";

  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const inputTabUpload = document.getElementById("tab-upload");
  const inputTabMic = document.getElementById("tab-mic");
  const uploadPanel = document.getElementById("panel-upload");
  const micPanel = document.getElementById("panel-mic");

  let currentInputTab = "upload";

  if (inputTabUpload) inputTabUpload.addEventListener("click", () => switchInputTab("upload"));
  if (inputTabMic) inputTabMic.addEventListener("click", () => switchInputTab("mic"));

  function switchInputTab(which) {
    currentInputTab = which;
    if (inputTabUpload) inputTabUpload.classList.toggle("active", which === "upload");
    if (inputTabMic) inputTabMic.classList.toggle("active", which === "mic");
    if (uploadPanel) uploadPanel.classList.toggle("hidden", which !== "upload");
    if (micPanel) micPanel.classList.toggle("hidden", which !== "mic");
    if (which === "mic") {
      drawMicIdleBaseline();
    }
  }

  let activeObjectUrl = null;

  if (dropzone && fileInput) {
    dropzone.addEventListener("click", () => fileInput.click());
    dropzone.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.keyCode === 32 || e.keyCode === 13) {
        e.preventDefault();
        fileInput.click();
      }
    });
    dropzone.addEventListener("dragover", (e) => { e.preventDefault(); dropzone.classList.add("drag"); });
    dropzone.addEventListener("dragleave", () => dropzone.classList.remove("drag"));
    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("drag");
      if (e.dataTransfer.files && e.dataTransfer.files[0]) setActiveFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener("change", () => {
      if (fileInput.files && fileInput.files[0]) setActiveFile(fileInput.files[0]);
    });
  }

  function setActiveFile(file) {
    activeFile = file;
    activeFileName = file.name;
    const meta = document.getElementById("file-meta");
    if (meta) {
      meta.classList.remove("hidden");
      meta.innerHTML = fileMetaHTML(file.name, file.size, file.type || guessType(file.name));
    }
    const player = document.getElementById("audio-player");
    if (player) {
      if (activeObjectUrl) {
        try { URL.revokeObjectURL(activeObjectUrl); } catch (e) {}
      }
      activeObjectUrl = URL.createObjectURL(file);
      player.src = activeObjectUrl;
      player.classList.remove("hidden");
    }
    const analyzeBtn = document.getElementById("analyze-btn");
    if (analyzeBtn) analyzeBtn.disabled = false;
  }

  function fileMetaHTML(name, size, type) {
    return `
      <div><span>FILENAME</span>${esc(name)}</div>
      <div><span>SIZE</span>${(size / 1024).toFixed(1)} KB</div>
      <div><span>TYPE</span>${esc(type || "unknown")}</div>`;
  }
  function guessType(name) {
    const ext = name.split(".").pop().toLowerCase();
    return { wav: "audio/wav", mp3: "audio/mpeg", m4a: "audio/mp4", flac: "audio/flac", ogg: "audio/ogg", webm: "audio/webm" }[ext] || "";
  }

  // ============================================================
  // Record Microphone — with Live Frequency Waves (like default recorder apps)
  // ============================================================
  let mediaRecorder = null;
  let recordedChunks = [];
  let micTimer = null;
  let micStartTimestamp = 0;
  let micStream = null;
  let micAudioCtx = null;
  let micAnalyser = null;
  let micAnimId = null;
  let isMicRecording = false;

  const micBtn = document.getElementById("mic-record-btn");
  const micStatus = document.getElementById("mic-status");
  const micTimerEl = document.getElementById("mic-timer");
  const micStatusBadge = document.getElementById("mic-status-badge");
  const micWaveCanvas = document.getElementById("mic-wave-canvas");

  function drawMicIdleBaseline() {
    if (!micWaveCanvas) return;
    const ctx = micWaveCanvas.getContext("2d");
    const w = micWaveCanvas.width;
    const h = micWaveCanvas.height;
    ctx.fillStyle = "#070b12";
    ctx.fillRect(0, 0, w, h);

    // Baseline axis
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Dotted resting baseline bars
    const numBars = 64;
    const barWidth = 4;
    const gap = (w - numBars * barWidth) / (numBars + 1);
    ctx.fillStyle = "rgba(45, 212, 232, 0.25)";
    for (let i = 0; i < numBars; i++) {
      const x = gap + i * (barWidth + gap);
      const dotH = 4;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, (h - dotH) / 2, barWidth, dotH, 2);
      } else {
        ctx.rect(x, (h - dotH) / 2, barWidth, dotH);
      }
      ctx.fill();
    }
  }

  function startMicVisualizer(stream) {
    try {
      micAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (micAudioCtx.state === "suspended") {
        micAudioCtx.resume();
      }
      const source = micAudioCtx.createMediaStreamSource(stream);
      micAnalyser = micAudioCtx.createAnalyser();
      micAnalyser.fftSize = 128; // 64 frequency bins
      micAnalyser.smoothingTimeConstant = 0.75;
      source.connect(micAnalyser);

      const bufferLength = micAnalyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const ctx = micWaveCanvas.getContext("2d");

      function renderFrame() {
        if (!isMicRecording) return;
        micAnimId = requestAnimationFrame(renderFrame);

        micAnalyser.getByteFrequencyData(dataArray);

        const w = micWaveCanvas.width;
        const h = micWaveCanvas.height;
        const centerY = h / 2;

        ctx.fillStyle = "#070b12";
        ctx.fillRect(0, 0, w, h);

        // Center line
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(w, centerY);
        ctx.stroke();

        const numBars = bufferLength;
        const totalGapWidth = w * 0.15;
        const gap = totalGapWidth / (numBars + 1);
        const barWidth = Math.max(3, (w - totalGapWidth) / numBars);

        for (let i = 0; i < numBars; i++) {
          const val = dataArray[i] / 255;
          const barHeight = Math.max(3, val * (h * 0.44));
          const x = gap + i * (barWidth + gap);

          let gradient = ctx.createLinearGradient(0, centerY - barHeight, 0, centerY + barHeight);
          if (val > 0.8) {
            gradient.addColorStop(0, "#f59e0b");
            gradient.addColorStop(0.5, "#ef4444");
            gradient.addColorStop(1, "#f59e0b");
          } else if (val > 0.35) {
            gradient.addColorStop(0, "#3ecf8e");
            gradient.addColorStop(0.5, "#2dd4e0");
            gradient.addColorStop(1, "#3ecf8e");
          } else {
            gradient.addColorStop(0, "#2dd4e0");
            gradient.addColorStop(0.5, "#0284c7");
            gradient.addColorStop(1, "#2dd4e0");
          }

          ctx.fillStyle = gradient;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x, centerY - barHeight, barWidth, barHeight * 2, 2.5);
          } else {
            ctx.rect(x, centerY - barHeight, barWidth, barHeight * 2);
          }
          ctx.fill();
        }
      }

      renderFrame();
    } catch (e) {
      console.warn("Visualizer init error:", e);
    }
  }

  function stopMicVisualizer() {
    isMicRecording = false;
    if (micAnimId) {
      cancelAnimationFrame(micAnimId);
      micAnimId = null;
    }
    if (micAudioCtx) {
      try { micAudioCtx.close(); } catch (e) {}
      micAudioCtx = null;
    }
    drawMicIdleBaseline();
  }

  if (micBtn) {
    micBtn.addEventListener("click", async () => {
      if (isMicRecording) {
        // STOP recording
        if (mediaRecorder && mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
        return;
      }

      // START recording
      if (micTimerEl) micTimerEl.textContent = "00:00.0";
      micBtn.textContent = "⏳ Requesting Mic...";
      micBtn.disabled = true;
      if (micStatusBadge) {
        micStatusBadge.textContent = "REQUESTING...";
        micStatusBadge.style.color = "var(--accent)";
      }

      try {
        try {
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              channelCount: 1,
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false
            }
          });
        } catch (e1) {
          micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }

        micBtn.disabled = false;
        micBtn.textContent = "■ Stop Recording";
        micBtn.className = "btn btn-secondary";
        if (micStatusBadge) {
          micStatusBadge.textContent = "🔴 RECORDING";
          micStatusBadge.style.color = "var(--risk-high)";
        }

        recordedChunks = [];
        mediaRecorder = new MediaRecorder(micStream);
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) recordedChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          if (micTimer) {
            clearInterval(micTimer);
            micTimer = null;
          }
          stopMicVisualizer();
          if (micStream) {
            micStream.getTracks().forEach((t) => t.stop());
            micStream = null;
          }

          const durSec = (Date.now() - micStartTimestamp) / 1000;
          const dur = durSec.toFixed(1);
          micBtn.textContent = "● Record New Voice";
          micBtn.className = "btn btn-primary";

          const blob = new Blob(recordedChunks, { type: "audio/webm" });
          if (durSec < 0.8 || blob.size < 1000) {
            if (micStatusBadge) {
              micStatusBadge.textContent = "⚠️ TOO SHORT";
              micStatusBadge.style.color = "var(--risk-medium)";
            }
            if (micStatus) {
              micStatus.textContent = "⚠️ Recording too short (under 1 second). Please speak for at least 1-2 seconds to analyze.";
              micStatus.classList.add("error-state");
            }
            return;
          }

          if (micStatusBadge) {
            micStatusBadge.textContent = `✅ CAPTURED (${dur}s)`;
            micStatusBadge.style.color = "var(--risk-low)";
          }

          const file = new File([blob], "microphone_recording.webm", { type: "audio/webm" });
          setActiveFile(file);

          if (micStatus) {
            micStatus.textContent = `✅ Voice recording captured (${dur}s). Click "Analyze" below to run forensic inspection.`;
            micStatus.classList.remove("error-state");
          }
        };

        isMicRecording = true;
        mediaRecorder.start(200);
        micStartTimestamp = Date.now();
        startMicVisualizer(micStream);

        micTimer = setInterval(() => {
          const elapsed = (Date.now() - micStartTimestamp) / 1000;
          const mins = Math.floor(elapsed / 60).toString().padStart(2, "0");
          const secs = (elapsed % 60).toFixed(1).padStart(4, "0");
          if (micTimerEl) micTimerEl.textContent = `${mins}:${secs}`;
        }, 100);

        if (micStatus) {
          micStatus.classList.remove("error-state");
          micStatus.textContent = "🎙️ Speaking... Frequency waves are visualizing your voice in real time. Click Stop when done.";
        }

      } catch (err) {
        console.error("Mic record error:", err);
        micBtn.disabled = false;
        micBtn.textContent = "● Start Recording";
        micBtn.className = "btn btn-primary";
        if (micStatusBadge) {
          micStatusBadge.textContent = "IDLE";
          micStatusBadge.style.color = "var(--text-muted)";
        }
        if (micStatus) {
          micStatus.textContent = "Microphone permission denied or microphone unavailable. Please check browser permissions.";
          micStatus.classList.add("error-state");
        }
        alert("Microphone Access Required: Please allow microphone access in your browser to record audio.");
      }
    });
  }

  // ============================================================
  // Analyze — Execution & Progress Animation
  // ============================================================
  const STAGES = [
    "Loading audio",
    "Normalizing signal (RMS \u2192 \u221220 dBFS)",
    "Extracting spectral features (Mel-spectrogram)",
    "Running CNN inference",
    "Analyzing prosody (pitch / f0)",
    "Calculating risk",
    "Preparing forensic report",
  ];

  const analyzeBtn = document.getElementById("analyze-btn");
  if (analyzeBtn) analyzeBtn.addEventListener("click", runAnalysis);

  async function runAnalysis() {
    if (!activeFile) return;
    document.getElementById("analyze-form").classList.add("hidden");
    document.getElementById("analyze-progress").classList.remove("hidden");
    document.getElementById("analyze-result").classList.add("hidden");
    document.getElementById("analyze-error").classList.add("hidden");

    const stageList = document.getElementById("stage-list");
    stageList.innerHTML = STAGES.map((s, i) => `
      <div class="progress-stage" data-i="${i}">
        <div class="stage-dot"></div><div>${esc(s)}</div>
      </div>`).join("");

    let stageTimer = null;
    let stageIdx = 0;
    const advanceStage = () => {
      const rows = stageList.querySelectorAll(".progress-stage");
      rows.forEach((r, i) => {
        r.classList.toggle("active", i === stageIdx);
        r.classList.toggle("done", i < stageIdx);
      });
      if (stageIdx < STAGES.length - 1) stageIdx++;
    };
    advanceStage();
    stageTimer = setInterval(advanceStage, 450);

    const sensitivity = document.getElementById("sensitivity-select").value;

    try {
      const result = await VG.api.analyze(activeFile, { sensitivity });
      clearInterval(stageTimer);
      stageList.querySelectorAll(".progress-stage").forEach((r) => r.classList.add("done"));
      lastResult = result;
      setTimeout(() => {
        document.getElementById("analyze-progress").classList.add("hidden");
        document.getElementById("analyze-result").classList.remove("hidden");
        renderResult(result);
      }, 300);
    } catch (err) {
      clearInterval(stageTimer);
      document.getElementById("analyze-progress").classList.add("hidden");
      document.getElementById("analyze-error").classList.remove("hidden");
      document.getElementById("analyze-error-msg").textContent = errorMessage(err);
    }
  }

  function errorMessage(err) {
    if (!err) return "Analysis failed for an unknown reason.";
    if (err.message === "BACKEND_UNREACHABLE") return "Backend connection unavailable. Confirm the API is running and reachable, then try again.";
    if (err.message === "MALFORMED_RESPONSE") return "The API returned a response the frontend couldn't parse.";
    let msg = err.message || String(err);
    // Sanitize local server filesystem paths and low-level decoding stack traces
    msg = msg.replace(/[a-zA-Z]:\\[^:\n\r\t]+(\.[a-zA-Z0-9]+)?/g, "[internal path]");
    msg = msg.replace(/\/(?:[a-zA-Z0-9_-]+\/)+[a-zA-Z0-9_.-]+/g, "[internal path]");
    if (msg.toLowerCase().includes("ffmpeg") || msg.toLowerCase().includes("decoding error")) {
      return "Unable to decode audio format. Please ensure the file is a valid, uncorrupted audio recording.";
    }
    return msg;
  }

  const analyzeReset = document.getElementById("analyze-reset");
  if (analyzeReset) analyzeReset.addEventListener("click", resetAnalyzeForm);
  const analyzeResetBottom = document.getElementById("analyze-reset-bottom");
  if (analyzeResetBottom) analyzeResetBottom.addEventListener("click", resetAnalyzeForm);
  const analyzeRetry = document.getElementById("analyze-retry");
  if (analyzeRetry) analyzeRetry.addEventListener("click", resetAnalyzeForm);

  function resetAnalyzeForm() {
    activeFile = null;
    activeFileName = "";
    if (activeObjectUrl) {
      try { URL.revokeObjectURL(activeObjectUrl); } catch (e) {}
      activeObjectUrl = null;
    }
    const fi = document.getElementById("file-input");
    if (fi) fi.value = "";
    const meta = document.getElementById("file-meta");
    if (meta) {
      meta.classList.add("hidden");
      meta.innerHTML = "";
    }
    const player = document.getElementById("audio-player");
    if (player) {
      player.pause();
      player.removeAttribute("src");
      player.load();
      player.classList.add("hidden");
    }
    const abtn = document.getElementById("analyze-btn");
    if (abtn) abtn.disabled = true;

    document.getElementById("analyze-form").classList.remove("hidden");
    document.getElementById("analyze-progress").classList.add("hidden");
    document.getElementById("analyze-result").classList.add("hidden");
    document.getElementById("analyze-error").classList.add("hidden");
  }

  // ============================================================
  // Result rendering — Per-clip inspection & charts
  // ============================================================
  function renderResult(r) {
    const isFake = r.is_fake;
    const heroEl = document.getElementById("verdict-hero");
    heroEl.className = `verdict-hero panel ${isFake ? "fake" : "real"}`;
    document.getElementById("verdict-label").textContent = `FILE: ${r.filename}`;
    const vt = document.getElementById("verdict-text");
    vt.textContent = isFake ? "FAKE / AI-GENERATED" : "REAL / LIKELY AUTHENTIC";
    vt.className = `verdict-text ${isFake ? "fake" : "real"}`;
    document.getElementById("verdict-sub").textContent =
      `Verdict basis: ${r.verdict_basis === "windowed_average" ? "windowed average (opt-in)" : "single-clip inference (default)"} · ${r.risk_badge || r.risk_level}`;

    drawGauge(document.getElementById("gauge-canvas"), r.fake_prob, isFake);
    document.getElementById("gauge-pct").textContent = `${r.fake_prob.toFixed(1)}%`;

    document.getElementById("metric-grid").innerHTML = [
      ["FAKE PROBABILITY", `${r.fake_prob.toFixed(2)}%`],
      ["REAL PROBABILITY", `${r.real_prob.toFixed(2)}%`],
      ["RISK LEVEL", r.risk_level],
      ["CONFIDENCE", `${r.confidence.toFixed(2)}%`],
      ["AUDIO DURATION", `${r.audio_duration_seconds}s`],
      ["INFERENCE TIME", `${r.inference_time_ms} ms`],
      ["DEVICE", (r.device || "").toUpperCase()],
      ["CHECKPOINT ACC.", r.model_metadata ? `${r.model_metadata.checkpoint_accuracy}%` : "—"],
    ].map(([k, v]) => `<div class="panel metric-card"><div class="k">${esc(k)}</div><div class="v">${esc(String(v))}</div></div>`).join("");

    // Spectrogram
    const specImg = document.getElementById("spectrogram-img");
    if (r.spectrogram_image_base64) {
      specImg.src = r.spectrogram_image_base64;
      specImg.closest(".evidence-block").classList.remove("hidden");
    } else {
      specImg.closest(".evidence-block").classList.add("hidden");
    }

    // Prosody
    const prosodyBlock = document.getElementById("prosody-block");
    if (r.prosody_plot_base64 && r.prosody_analysis) {
      prosodyBlock.classList.remove("hidden");
      document.getElementById("prosody-img").src = r.prosody_plot_base64;
      const p = r.prosody_analysis;
      document.getElementById("prosody-metrics").innerHTML = [
        ["MEAN F0", `${p.mean_f0_hz} Hz`],
        ["PITCH RANGE", `${p.pitch_range_hz} Hz`],
        ["VOICED %", `${p.voiced_percentage}%`],
        ["PROSODIC RISK", `${p.prosodic_risk_score}/100`],
      ].map(([k, v]) => `<div class="panel metric-card"><div class="k">${esc(k)}</div><div class="v">${esc(String(v))}</div></div>`).join("");
      document.getElementById("prosody-status-line").textContent = `${p.prosody_status}: ${p.prosody_assessment}`;
    } else {
      prosodyBlock.classList.add("hidden");
    }

    // Windowed temporal timeline
    const wi = r.windowed_inference;
    const tlBlock = document.getElementById("timeline-block");
    if (wi && !wi.fallback_single_clip && wi.window_results && wi.window_results.length > 1) {
      tlBlock.classList.remove("hidden");
      document.getElementById("timeline").innerHTML = wi.window_results.map((w) => `
        <div class="tl-seg ${w.fake_prob >= 50 ? "fake" : "real"}">
          <div class="tip">${w.start_sec}s\u2013${w.end_sec}s: ${w.fake_prob}% fake</div>
        </div>`).join("");
      const first = wi.window_results[0], last = wi.window_results[wi.window_results.length - 1];
      document.getElementById("timeline-axis").innerHTML =
        `<span>${first.start_sec}s</span><span>${last.end_sec}s</span>`;
      document.getElementById("timeline-stats").innerHTML = [
        ["AVG FAKE PROB", `${wi.aggregate_fake_prob_avg}%`],
        ["MAX FAKE PROB", `${wi.aggregate_fake_prob_max}%`],
        ["WINDOWS", wi.window_count],
      ].map(([k, v]) => `<div class="panel metric-card"><div class="k">${esc(k)}</div><div class="v">${esc(String(v))}</div></div>`).join("");
    } else {
      tlBlock.classList.add("hidden");
    }

    // Evidence
    const cards = [];
    if (wi) {
      cards.push({
        tag: "SPECTRAL EVIDENCE",
        text: isFake
          ? `The CNN's spectral analysis returned a ${r.fake_prob.toFixed(1)}% synthetic-voice probability from Mel-spectrogram texture patterns.`
          : `The CNN's spectral analysis found the Mel-spectrogram texture consistent with organic human speech (${r.real_prob.toFixed(1)}% real probability).`,
      });
    }
    if (r.prosody_analysis) {
      cards.push({
        tag: "PROSODIC EVIDENCE",
        text: `${r.prosody_analysis.prosody_status.replace(/_/g, " ")}: ${r.prosody_analysis.prosody_assessment} (prosodic risk score ${r.prosody_analysis.prosodic_risk_score}/100).`,
      });
    }
    if (wi && !wi.fallback_single_clip) {
      cards.push({
        tag: "TEMPORAL EVIDENCE",
        text: `Across ${wi.window_count} overlapping 3-second windows, average fake probability was ${wi.aggregate_fake_prob_avg}% and the single worst window reached ${wi.aggregate_fake_prob_max}%.`,
      });
    }
    if (r.threshold_configuration) {
      cards.push({
        tag: "RISK POLICY",
        text: `Evaluated under the "${r.threshold_configuration.preset_name}" policy: low/high boundaries at ${r.threshold_configuration.low_threshold}% / ${r.threshold_configuration.high_threshold}%.`,
      });
    }
    document.getElementById("evidence-cards").innerHTML = cards.map((c) => `
      <div class="panel evidence-card"><span class="tag">${esc(c.tag)}</span><p>${esc(c.text)}</p></div>`).join("");

    // Alert panel
    const alertPanel = document.getElementById("alert-panel");
    const riskClass = (r.risk_level || "LOW").toLowerCase();
    alertPanel.className = `alert-panel panel ${riskClass}`;
    document.getElementById("alert-title").textContent = `THREAT ASSESSMENT \u2014 ${r.risk_level} RISK`;
    document.getElementById("alert-text").textContent = r.alert_message || "";
  }

  function drawGauge(canvas, pct, isFake) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, r = w / 2 - 10;
    ctx.lineWidth = 12;
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

    const frac = Math.max(0, Math.min(100, pct)) / 100;
    ctx.strokeStyle = isFake ? "#f0525c" : "#3ecf8e";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.stroke();
  }

  // ============================================================
  // Forensic Report page
  // ============================================================
  function renderReport() {
    const wrap = document.getElementById("report-content");
    const empty = document.getElementById("report-empty");
    if (!lastResult) {
      wrap.classList.add("hidden");
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");
    wrap.classList.remove("hidden");
    const dlBtn = document.getElementById("download-report");
    if (dlBtn) dlBtn.classList.remove("hidden");
    const prBtn = document.getElementById("print-report");
    if (prBtn) prBtn.classList.remove("hidden");
    const r = lastResult;
    const rows = [
      ["Verdict", r.verdict],
      ["Risk Level", r.risk_level],
      ["Fake Probability", `${r.fake_prob}%`],
      ["Real Probability", `${r.real_prob}%`],
      ["Audio Duration", `${r.audio_duration_seconds}s`],
      ["Verdict Basis", r.verdict_basis],
      ["System Device", r.device],
      ["Inference Time", `${r.inference_time_ms} ms`],
    ];
    let html = rows.map(([k, v]) => `<div class="report-row"><span class="rk">${esc(k)}</span><span class="rv">${esc(String(v))}</span></div>`).join("");

    if (r.prosody_analysis) {
      html += `<div class="report-section-title">PROSODY ANALYSIS</div>`;
      html += Object.entries(r.prosody_analysis)
        .filter(([k]) => !k.startsWith("_"))
        .map(([k, v]) => `<div class="report-row"><span class="rk">${esc(titleCase(k))}</span><span class="rv">${esc(String(v))}</span></div>`).join("");
    }
    if (r.model_metadata) {
      html += `<div class="report-section-title">MODEL INFORMATION</div>`;
      html += Object.entries(r.model_metadata).map(([k, v]) => `<div class="report-row"><span class="rk">${esc(titleCase(k))}</span><span class="rv">${esc(String(v))}</span></div>`).join("");
    }
    html += `<div class="report-section-title">INTERPRETATION CAVEAT</div>
      <p style="font-size:12.5px;color:var(--text-muted);max-width:70ch;">
        This result reflects a single automated model's output and known limitations
        (training data domain, real-world noise sensitivity) documented in the project's
        technical reports. It should inform, not replace, human judgment in a security workflow.
      </p>`;
    wrap.innerHTML = `<h2 style="margin-bottom:4px;">Audio Analysis Summary</h2>
      <p style="color:var(--text-muted);font-size:13px;margin-top:0;">${esc(r.filename)}</p>` + html;
  }

  const downloadReportBtn = document.getElementById("download-report");
  if (downloadReportBtn) {
    downloadReportBtn.addEventListener("click", () => {
      if (!lastResult) return;
      const jsonStr = JSON.stringify(lastResult, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `voiceguard-forensic-report-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  const printReportBtn = document.getElementById("print-report");
  if (printReportBtn) {
    printReportBtn.addEventListener("click", () => {
      if (!lastResult) return;
      window.print();
    });
  }

  // ============================================================
  // Live Risk Monitoring (Continuous Streaming WebSocket)
  // ============================================================
  let streamWs = null;
  let streamAudioCtx = null;
  let streamMicStream = null;
  let streamProcessor = null;
  let streamSource = null;
  let streamStartTime = 0;
  let streamTimer = null;
  let isStreaming = false;
  let animFrameId = null;
  let isCurrentFake = false;
  let streamLastTick = null;

  const streamBtn = document.getElementById("stream-mic-btn");
  const streamStatusBadge = document.getElementById("stream-status-badge");
  const streamTimerEl = document.getElementById("stream-timer");
  const streamCanvas = document.getElementById("stream-canvas");
  const streamVerdictHero = document.getElementById("stream-verdict-hero");
  const streamVerdictLabel = document.getElementById("stream-verdict-label");
  const streamVerdictText = document.getElementById("stream-verdict-text");
  const streamVerdictSub = document.getElementById("stream-verdict-sub");
  const streamGaugePct = document.getElementById("stream-gauge-pct");
  const streamGaugeCanvas = document.getElementById("stream-gauge-canvas");
  const streamConsole = document.getElementById("stream-console");
  const streamTimeline = document.getElementById("stream-timeline");

  const liveMVerdict = document.getElementById("live-m-verdict");
  const liveMReal = document.getElementById("live-m-real");
  const liveMFake = document.getElementById("live-m-fake");
  const liveMRisk = document.getElementById("live-m-risk");
  const liveMWindows = document.getElementById("live-m-windows");
  const liveMBuffer = document.getElementById("live-m-buffer");
  const liveMLatency = document.getElementById("live-m-latency");

  function drawStreamIdleBaseline() {
    if (!streamCanvas) return;
    const ctx = streamCanvas.getContext("2d");
    const w = streamCanvas.width;
    const h = streamCanvas.height;
    ctx.fillStyle = "#070b12";
    ctx.fillRect(0, 0, w, h);

    // Center horizontal grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    const numBars = 64;
    const barWidth = 4;
    const gap = (w - numBars * barWidth) / (numBars + 1);
    ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
    for (let i = 0; i < numBars; i++) {
      const x = gap + i * (barWidth + gap);
      const dotH = 4;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, (h - dotH) / 2, barWidth, dotH, 2);
      } else {
        ctx.rect(x, (h - dotH) / 2, barWidth, dotH);
      }
    ctx.fill();
    }

    if (streamGaugeCanvas) {
      drawGauge(streamGaugeCanvas, 0.0, false);
    }
  }

  const streamSensitivitySelect = document.getElementById("stream-sensitivity-select");
  if (streamSensitivitySelect) {
    streamSensitivitySelect.addEventListener("change", (e) => {
      const mode = e.target.value;
      logStream(`Live sensitivity profile updated to: ${mode.toUpperCase()}`, "ok");
      if (streamWs && streamWs.readyState === WebSocket.OPEN) {
        streamWs.send(JSON.stringify({ type: "config", sensitivity: mode }));
      }
    });
  }

  function logStream(msg, type = "") {
    if (!streamConsole) return;
    const div = document.createElement("div");
    div.className = `stream-line ${type}`;
    div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    streamConsole.appendChild(div);
    streamConsole.scrollTop = streamConsole.scrollHeight;
  }

  const clearStreamLogBtn = document.getElementById("clear-stream-log");
  if (clearStreamLogBtn) {
    clearStreamLogBtn.addEventListener("click", () => {
      if (streamConsole) streamConsole.innerHTML = "";
    });
  }

  if (streamBtn) {
    streamBtn.addEventListener("click", async () => {
      if (isStreaming) {
        stopLiveMonitoring(true);
      } else {
        await startLiveMonitoring();
      }
    });
  }

  async function startLiveMonitoring() {
    logStream("Starting live voice capture session...", "");
    streamBtn.textContent = "⏳ Requesting Microphone...";
    streamBtn.disabled = true;
    if (streamStatusBadge) {
      streamStatusBadge.className = "badge-pill med";
      streamStatusBadge.textContent = "🟡 REQUESTING MIC...";
    }

    // 1. Microphone capture with robust fallbacks
    try {
      try {
        streamMicStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }
        });
      } catch (e1) {
        streamMicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (micErr) {
      console.error("Mic access error:", micErr);
      logStream("Microphone permission denied or unavailable: " + (micErr.message || ""), "crit");
      if (streamStatusBadge) {
        streamStatusBadge.className = "badge-pill high";
        streamStatusBadge.textContent = "❌ MIC DENIED";
      }
      streamBtn.textContent = "🎙️ Start Live Voice Monitoring";
      streamBtn.className = "btn btn-primary";
      streamBtn.disabled = false;
      alert("Microphone Access Required: Please allow microphone access in your browser address bar to use Live Voice Monitoring.");
      return;
    }

    streamBtn.disabled = false;

    // 2. Audio Context initialization & resume
    try {
      streamAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (streamAudioCtx.state === "suspended") {
        await streamAudioCtx.resume();
      }
    } catch (e) {
      console.warn("AudioContext init error:", e);
    }

    // 3. Audio Visualizer Analyser Node
    const analyser = streamAudioCtx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.75;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    streamSource = streamAudioCtx.createMediaStreamSource(streamMicStream);
    streamSource.connect(analyser);

    // Immediate dynamic waveform rendering
    function drawStreamWave() {
      if (!isStreaming) return;
      animFrameId = requestAnimationFrame(drawStreamWave);
      analyser.getByteFrequencyData(dataArray);
      if (!streamCanvas) return;
      const ctx = streamCanvas.getContext("2d");
      const w = streamCanvas.width, h = streamCanvas.height;
      const centerY = h / 2;

      ctx.fillStyle = "#070b12";
      ctx.fillRect(0, 0, w, h);

      // Baseline
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(w, centerY);
      ctx.stroke();

      const numBars = dataArray.length;
      const totalGapWidth = w * 0.15;
      const gap = totalGapWidth / (numBars + 1);
      const barWidth = Math.max(3, (w - totalGapWidth) / numBars);

      for (let i = 0; i < numBars; i++) {
        const val = dataArray[i] / 255;
        const barHeight = Math.max(3, val * (h * 0.44));
        const x = gap + i * (barWidth + gap);

        let grad = ctx.createLinearGradient(0, centerY - barHeight, 0, centerY + barHeight);
        if (isCurrentFake) {
          grad.addColorStop(0, "#f87171");
          grad.addColorStop(0.5, "#dc2626");
          grad.addColorStop(1, "#f87171");
        } else {
          grad.addColorStop(0, "#38bdf8");
          grad.addColorStop(0.5, "#0284c7");
          grad.addColorStop(1, "#38bdf8");
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, centerY - barHeight, barWidth, barHeight * 2, 2.5);
        } else {
          ctx.rect(x, centerY - barHeight, barWidth, barHeight * 2);
        }
        ctx.fill();
      }
    }

    // 4. Connect WebSocket
    try {
      const wsUrl = VG.api.getStreamSocketUrl();
      logStream(`Connecting to real-time voice gateway: ${wsUrl}...`);
      streamWs = new WebSocket(wsUrl);
      streamWs.binaryType = "arraybuffer";

      streamWs.onopen = () => {
        logStream("WebSocket connected to real-time voice gateway.", "ok");
        if (streamStatusBadge) {
          streamStatusBadge.className = "badge-pill high";
          streamStatusBadge.textContent = "🔴 LIVE MONITORING ACTIVE";
        }
        streamBtn.textContent = "■ Stop Live Monitoring";
        streamBtn.className = "btn btn-secondary";
      };

      streamWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleStreamPacket(data);
        } catch (e) {
          console.error("Stream parse error:", e);
        }
      };

      streamWs.onerror = (err) => {
        logStream("WebSocket gateway error.", "crit");
      };

      streamWs.onclose = () => {
        if (isStreaming) {
          stopLiveMonitoring(true);
        }
      };
    } catch (wsErr) {
      logStream("Failed to initialize WebSocket: " + wsErr.message, "crit");
      if (streamStatusBadge) {
        streamStatusBadge.className = "badge-pill high";
        streamStatusBadge.textContent = "❌ WS FAILED";
      }
      stopLiveMonitoring(false);
      return;
    }

    // 5. Resample & Stream Audio Chunks
    const bufferSize = 4096;
    streamProcessor = streamAudioCtx.createScriptProcessor(bufferSize, 1, 1);
    streamProcessor.onaudioprocess = (e) => {
      if (!isStreaming || !streamWs || streamWs.readyState !== WebSocket.OPEN) return;
      const inputData = e.inputBuffer.getChannelData(0);
      const srcRate = streamAudioCtx.sampleRate;

      let resampled = inputData;
      if (srcRate !== 16000) {
        const ratio = srcRate / 16000;
        const targetLen = Math.round(inputData.length / ratio);
        resampled = new Float32Array(targetLen);
        for (let i = 0; i < targetLen; i++) {
          const originIdx = Math.round(i * ratio);
          resampled[i] = inputData[originIdx] || 0;
        }
      }

      const int16 = new Int16Array(resampled.length);
      for (let i = 0; i < resampled.length; i++) {
        int16[i] = Math.max(-32768, Math.min(32767, resampled[i] * 32767));
      }
      streamWs.send(int16.buffer);
    };

    streamSource.connect(streamProcessor);
    // Route through a zero-gain mute GainNode so audio capture events fire continuously
    // without echoing physical microphone audio back into computer speakers (prevents feedback loops)
    const streamMuteNode = streamAudioCtx.createGain();
    streamMuteNode.gain.value = 0;
    streamProcessor.connect(streamMuteNode);
    streamMuteNode.connect(streamAudioCtx.destination);

    isStreaming = true;
    streamStartTime = Date.now();
    streamBtn.textContent = "■ Stop Live Monitoring";
    streamBtn.className = "btn btn-secondary";
    if (streamVerdictLabel) {
      streamVerdictLabel.textContent = "LIVE STATUS: STREAMING MIC AUDIO";
    }
    logStream("Live audio stream active. Speak into microphone...", "ok");

    streamTimer = setInterval(() => {
      const elapsed = ((Date.now() - streamStartTime) / 1000);
      const mins = Math.floor(elapsed / 60).toString().padStart(2, "0");
      const secs = (elapsed % 60).toFixed(1).padStart(4, "0");
      if (streamTimerEl) streamTimerEl.textContent = `${mins}:${secs}`;
    }, 100);

    drawStreamWave();
  }

  function handleStreamPacket(tick) {
    if (tick.type === "connection_established") {
      logStream(`Gateway ready (Window size: ${tick.window_size_seconds}s).`, "ok");
      return;
    }
    if (tick.type !== "telephony_tick") return;
    streamLastTick = tick;

    const fakeScore = tick.rolling_risk_score != null ? tick.rolling_risk_score : tick.running_fake_prob;
    const realScore = tick.running_real_prob != null ? tick.running_real_prob : (100.0 - fakeScore);
    const isFake = tick.verdict === "AI-GENERATED" || fakeScore >= 50.0;
    isCurrentFake = isFake;

    // Update Verdict Hero
    if (streamVerdictHero) {
      streamVerdictHero.className = `verdict-hero panel ${isFake ? "fake" : "real"}`;
    }
    if (streamVerdictLabel) {
      streamVerdictLabel.textContent = `LIVE FORENSIC VERDICT (TICK #${tick.tick} · ${(tick.buffer_seconds || 3.0).toFixed(1)}s BUFFER)`;
    }
    if (streamVerdictText) {
      streamVerdictText.textContent = isFake ? "🔴 AI-GENERATED (CLONED VOICE)" : "🟢 REAL (HUMAN VOICE)";
      streamVerdictText.className = `verdict-text ${isFake ? "fake" : "real"}`;
    }
    if (streamVerdictSub) {
      streamVerdictSub.textContent = isFake
        ? `🚨 High-confidence synthetic acoustic patterns detected in speech (${fakeScore.toFixed(1)}% AI Risk).`
        : `✅ Organic human vocal tract characteristics and natural prosody detected (${realScore.toFixed(1)}% Real Confidence).`;
    }

    // Update Gauge
    if (streamGaugeCanvas) {
      drawGauge(streamGaugeCanvas, fakeScore, isFake);
    }
    if (streamGaugePct) {
      streamGaugePct.textContent = `${fakeScore.toFixed(1)}%`;
    }

    // Update Metrics
    if (liveMVerdict) {
      liveMVerdict.textContent = tick.verdict;
      liveMVerdict.className = `v ${isFake ? "bad" : "ok"}`;
    }
    if (liveMReal) liveMReal.textContent = `${realScore.toFixed(1)}%`;
    if (liveMFake) {
      liveMFake.textContent = `${fakeScore.toFixed(1)}%`;
      liveMFake.className = `v ${isFake ? "bad" : "ok"}`;
    }
    if (liveMRisk) {
      liveMRisk.textContent = tick.risk_tier || (isFake ? "CRITICAL" : "SAFE");
      liveMRisk.className = `v ${isFake ? "bad" : "ok"}`;
    }
    if (liveMWindows) liveMWindows.textContent = tick.tick;
    if (liveMBuffer) liveMBuffer.textContent = `${(tick.buffer_seconds || 0).toFixed(1)}s`;
    if (liveMLatency) liveMLatency.textContent = `${tick.inference_time_ms || 25} ms`;

    // Update Timeline Pills
    if (streamTimeline) {
      if (tick.tick === 1) streamTimeline.innerHTML = "";
      const seg = document.createElement("div");
      seg.className = `tl-seg ${isFake ? "fake" : "real"}`;
      seg.innerHTML = `<div class="tip">Window #${tick.tick}: ${tick.window_fake_prob}% AI (${tick.verdict})</div>`;
      streamTimeline.appendChild(seg);
    }

    logStream(
      `[Window #${tick.tick}] Verdict: ${tick.verdict} | Real: ${realScore.toFixed(1)}% | AI: ${fakeScore.toFixed(1)}% | Latency: ${tick.inference_time_ms}ms`,
      isFake ? "crit" : "ok"
    );
  }

  function stopLiveMonitoring(frozen = true) {
    isStreaming = false;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    if (streamTimer) clearInterval(streamTimer);
    if (streamProcessor) {
      try { streamProcessor.disconnect(); } catch (e) {}
    }
    if (streamSource) {
      try { streamSource.disconnect(); } catch (e) {}
    }
    if (streamAudioCtx) {
      try { streamAudioCtx.close(); } catch (e) {}
      streamAudioCtx = null;
    }
    if (streamMicStream) {
      try { streamMicStream.getTracks().forEach((t) => t.stop()); } catch (e) {}
      streamMicStream = null;
    }
    if (streamWs) {
      try { streamWs.close(1000, "User stopped stream"); } catch (e) {}
      streamWs = null;
    }

    if (streamBtn) {
      streamBtn.textContent = "🎙️ Start Live Voice Monitoring";
      streamBtn.className = "btn btn-primary";
      streamBtn.disabled = false;
    }

    drawStreamIdleBaseline();

    if (frozen) {
      if (streamStatusBadge) {
        streamStatusBadge.className = "badge-pill low";
        streamStatusBadge.textContent = "🧊 SESSION FROZEN";
      }
      if (streamVerdictLabel) {
        streamVerdictLabel.textContent = "LIVE MONITORING SESSION STOPPED (VERDICT PERMANENTLY FROZEN)";
      }
      logStream("Live session ended. Final verdict permanently frozen on screen without post-analysis reset.", "ok");

      if (streamLastTick) {
        const durSec = ((Date.now() - streamStartTime) / 1000).toFixed(1);
        const fakePct = Math.round(streamLastTick.rolling_risk_score != null ? streamLastTick.rolling_risk_score : streamLastTick.running_fake_prob);
        const realPct = 100 - fakePct;
        lastResult = {
          verdict: streamLastTick.verdict === "AI-GENERATED" ? "AI-GENERATED (CLONED VOICE)" : "REAL (ORGANIC HUMAN VOICE)",
          is_fake: streamLastTick.verdict === "AI-GENERATED",
          fake_prob: fakePct,
          real_prob: realPct,
          risk_level: fakePct > 65 ? "HIGH" : fakePct > 35 ? "MEDIUM" : "LOW",
          audio_duration_seconds: parseFloat(durSec) || 3.0,
          verdict_basis: `Live sliding window monitoring session (${streamLastTick.tick} windows evaluated).`,
          device: "Client Web Audio PCM + Server ONNX/Java Netty",
          inference_time_ms: streamLastTick.inference_time_ms || 25,
          filename: "Live Microphone Streaming Session",
          model_metadata: {
            session_type: "Continuous Live Stream",
            evaluated_windows: streamLastTick.tick,
            duration_seconds: `${durSec}s`,
            stream_mode: "Sliding Window Real-time"
          }
        };
      }
    } else {
      if (streamStatusBadge) {
        streamStatusBadge.className = "badge-pill low";
        streamStatusBadge.textContent = "⚪ IDLE / READY";
      }
    }
  }

  // Simulated Sample Streamer (Real or Fake)
  async function simulateSampleStream(sampleUrl, sampleName) {
    if (isStreaming) stopLiveMonitoring(false);
    logStream(`Loading simulated stream: ${sampleName}...`, "");
    if (streamStatusBadge) {
      streamStatusBadge.className = "badge-pill med";
      streamStatusBadge.textContent = "🟡 STREAMING SAMPLE...";
    }

    try {
      const response = await fetch(sampleUrl);
      const arrayBuffer = await response.arrayBuffer();
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0);

      const wsUrl = VG.api.getStreamSocketUrl();
      const ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer";

      ws.onopen = async () => {
        logStream(`Streaming ${sampleName} in 1-second chunks over WebSocket...`, "ok");
        if (streamStatusBadge) {
          streamStatusBadge.className = "badge-pill high";
          streamStatusBadge.textContent = "🔴 STREAMING SAMPLE";
        }

        streamStartTime = Date.now();
        if (streamTimer) clearInterval(streamTimer);
        streamTimer = setInterval(() => {
          const elapsed = ((Date.now() - streamStartTime) / 1000);
          const mins = Math.floor(elapsed / 60).toString().padStart(2, "0");
          const secs = (elapsed % 60).toFixed(1).padStart(4, "0");
          if (streamTimerEl) streamTimerEl.textContent = `${mins}:${secs}`;
        }, 100);

        isStreaming = true;
        let simPhase = 0;
        function renderSimWave() {
          if (!isStreaming) return;
          if (streamCanvas) {
            const ctx2 = streamCanvas.getContext("2d");
            const w = streamCanvas.width, h = streamCanvas.height;
            ctx2.fillStyle = "#070b12";
            ctx2.fillRect(0, 0, w, h);
            ctx2.lineWidth = 2;
            ctx2.strokeStyle = isCurrentFake ? "#f0525c" : "#2dd4e8";
            ctx2.beginPath();
            const slice = w / 64;
            let x = 0;
            simPhase += 0.2;
            for (let i = 0; i < 64; i++) {
              const v = Math.sin(i * 0.25 + simPhase) * Math.cos(i * 0.1 + simPhase * 0.5);
              const y = (h / 2) + v * (h * 0.35);
              if (i === 0) ctx2.moveTo(x, y);
              else ctx2.lineTo(x, y);
              x += slice;
            }
            ctx2.stroke();
          }
          animFrameId = requestAnimationFrame(renderSimWave);
        }
        renderSimWave();

        const chunkSize = 16000;
        let offset = 0;
        const total = channelData.length;

        while (offset < total) {
          const chunk = channelData.slice(offset, offset + chunkSize);
          const int16 = new Int16Array(chunk.length);
          for (let i = 0; i < chunk.length; i++) {
            int16[i] = Math.max(-32768, Math.min(32767, chunk[i] * 32767));
          }
          ws.send(int16.buffer);
          offset += chunkSize;
          await new Promise((r) => setTimeout(r, 600));
        }

        isStreaming = false;
        if (animFrameId) cancelAnimationFrame(animFrameId);
        if (streamTimer) {
          clearInterval(streamTimer);
          streamTimer = null;
        }
        drawStreamIdleBaseline();

        logStream(`Finished streaming ${sampleName}. Session permanently frozen on screen.`, "ok");
        if (streamStatusBadge) {
          streamStatusBadge.className = "badge-pill low";
          streamStatusBadge.textContent = "🧊 SESSION FROZEN";
        }
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          handleStreamPacket(data);
        } catch (err) {}
      };
    } catch (err) {
      logStream(`Failed to stream sample: ${err.message}`, "crit");
    }
  }

  const simStreamReal = document.getElementById("sim-stream-real");
  if (simStreamReal) {
    simStreamReal.addEventListener("click", () => {
      simulateSampleStream("/samples/real_voice.wav", "Human Genuine Voice");
    });
  }

  const simStreamFake = document.getElementById("sim-stream-fake");
  if (simStreamFake) {
    simStreamFake.addEventListener("click", () => {
      simulateSampleStream("/samples/synthetic_cloned_voice.wav", "AI Cloned Voice");
    });
  }

  // ============================================================
  // Utilities
  // ============================================================
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function titleCase(s) {
    return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // ============================================================
  // Init
  // ============================================================
  const initialHash = (window.location.hash || "").replace("#", "");
  if (views.includes(initialHash)) {
    navigate(initialHash, false);
  } else {
    navigate("overview", false);
  }
  drawMicIdleBaseline();
  drawStreamIdleBaseline();
  if (streamGaugeCanvas) {
    drawGauge(streamGaugeCanvas, 0.0, false);
  }
  refreshConnection();
  setInterval(refreshConnection, 20000);
})();
