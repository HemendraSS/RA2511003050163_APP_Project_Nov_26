# VoiceGuard AI: Comprehensive Technical & Architectural Project Report
## AI-Powered Real-Time Detection and Prevention of Voice Cloning & Audio Impersonation Attacks

---

## 1. Project Identity

| Attribute | Details |
|---|---|
| **Official Title** | **VoiceGuard AI: Enterprise Dual-Domain Voice Authenticity & Deepfake Forensic Defense System** |
| **Alternative / Competition Title** | AI-Powered Real-Time Detection and Prevention of Voice Cloning Impersonation Attacks (Smart India Hackathon Problem Statement #26104) |
| **One-Line Summary** | A production-grade, multi-scale acoustic forensics and deep learning platform that detects synthetic voice clones and live audio deepfakes in real time using Wav2Vec 2.0 ONNX inference, prosodic intonation tracking, and sliding-window telephony stream analysis. |
| **Project Type** | Full-Stack AI/ML Cyber-Defense Application (Enterprise Java Spring Boot 3 Web Application, Real-Time WebSocket Streaming Gateway, Embedded ONNX Deep Learning Inference Engine, and Forensic Single-Page Application). |
| **Current Completion Status** | **Production-Ready / Deployed & Operational (v2.0.0)**. Full per-clip file and microphone analysis operational, real-time live sliding-window WebSocket streaming operational, zero-speaker-feedback audio DSP pipeline active, 22/22 accessibility and stability defects resolved. |
| **Primary Authors / Maintainers** | Senior Architecture & Security Engineering Team |
| **Target Port & Environment** | HTTP / WebSocket Port `8000`, running on Java Runtime Environment (JRE 17+) with Microsoft ONNX Runtime CPU/DirectML acceleration. |

---

## 2. Problem Statement and Motivation

### 2.1 The Problem
Recent advances in generative deep learning—specifically neural vocoders (HiFi-GAN, WaveGlow, BigVGAN), diffusion probabilistic audio models, and zero-shot voice cloning architectures (ElevenLabs, VALL-E, XTTS, Bark)—have commoditized synthetic speech synthesis. With as little as 3 seconds of reference audio harvested from social media or public speaking engagements, malicious actors can clone an individual's vocal timbre, dialect, and emotional inflection with near-photorealistic perceptual fidelity.

This technology has triggered an unprecedented surge in cyber-enabled social engineering:
1. **Executive Impersonation (CEO / CFO Fraud)**: Cybercriminals generate real-time voice clones of corporate leadership to authorize emergency, out-of-band wire transfers or bypass two-factor verification over phone calls.
2. **Telephony & Call-Center Infiltration**: Automated voice agents spoof bank customers' voices to manipulate Interactive Voice Response (IVR) systems and customer service representatives into resetting account credentials.
3. **Grandparent / Emergency Scams**: Distress calls generated with cloned voices of family members coerce victims into instant electronic fund transfers.

### 2.2 Why Existing Defenses Fail
Traditional audio forensic methods rely on metadata analysis, container integrity checks, or simplistic pitch filters. These fail against modern generative models because:
- Cloned audio can be re-encoded into clean standard WAV/MP3 containers, wiping synthetic metadata tags.
- Perceptually, neural vocoders reconstruct speech that perfectly mimics human harmonic formants.
- Traditional human ears cannot perceive high-frequency vocoder phase discrepancies, checkerboard artifacting in latent spectrogram upsampling, or micro-level prosodic unnaturalness.

### 2.3 Why VoiceGuard AI
VoiceGuard AI solves this by introducing a **Dual-Domain Forensic Architecture**:
- **Domain 1: Deep Feature Representation (Latent Space)**: Evaluates raw waveform representations through a pre-trained, self-supervised foundation model (`Wav2Vec2_Base_ForensicHead`) running on Microsoft ONNX Runtime, exposing latent vocoder artifacts regardless of background noise.
- **Domain 2: Acoustic & Prosodic Biomechanics (Physical Space)**: Quantifies vocal cord biomechanics via autocorrelation-based fundamental frequency ($f_0$) pitch tracking, pitch dynamism coefficients, voicing ratios, and high-pass filtered spectral energy distributions.
- **Real-Time Streaming**: Unlike offline detectors that require an entire file to finish before inspection, VoiceGuard AI evaluates continuous telephone conversations in 3-second overlapping sliding windows over full-duplex WebSockets with sub-100ms latency.

---

## 3. Objectives and Scope

### 3.1 Project Objectives
1. **Accurate Detection**: Achieve $>95\%$ classification accuracy across diverse zero-shot cloned voice generators, neural vocoders, and natural acoustic recordings.
2. **Dual Operational Modes**:
   - **Forensic Workstation Mode**: Comprehensive per-clip analysis for forensic investigators with high-resolution Mel-spectrogram rendering, pitch contour plots, temporal breakdown slices, and structured JSON/PDF reporting.
   - **Live Telephony & Call-Monitoring Mode**: Continuous stream analysis over WebSockets for contact centers, assessing sliding windows in real time with dynamic threat escalation.
3. **Zero-Latency Ingestion**: Maintain inference latency under 100 milliseconds per evaluation window on standard enterprise commodity CPU hardware without requiring expensive GPU clusters.
4. **Resilience & Accessibility**: Offer a 100% offline-capable, cross-platform web interface complying with WCAG 2.1 AA accessibility standards, responsive across desktop, tablet, and mobile browsers.

### 3.2 In-Scope
- Ingestion of multi-format audio files (`.wav`, `.mp3`, `.m4a`, `.flac`, `.ogg`, `.webm`).
- Live in-browser microphone capture with visual frequency wave animation.
- Digital Signal Processing (DSP) conditioning: 75Hz Butterworth high-pass filtering, Energy Voice Activity Detection (VAD), and -20 dBFS RMS normalization.
- Autocorrelation-based pitch tracking ($f_0$), pitch variance, voicing ratios, and prosodic anomaly classification.
- Multi-scale windowed inference (3-second windows with 2-second hop) combined with global clip evaluation.
- Configurable risk thresholds (Conservative, Balanced, Aggressive).
- Real-time WebSocket streaming gateway at `/ws/stream` accepting 16-bit PCM binary audio.
- Interactive Single-Page Application with SVG/Canvas gauges, rolling timeline pills, and live event logging.
- Structured forensic JSON report generation and printable PDF stylesheets.
- Public HTTPS tunneling capability via Cloudflare Tunnel for secure remote and mobile testing.

### 3.3 Out-of-Scope (Non-Goals in Current v2.0 Release)
- Persistent SQL/NoSQL database storage for historical caller profiles (currently held in in-memory concurrent buffers).
- User authentication and role-based access control (RBAC / OAuth2 / JWT) — designed as an internal forensic workstation / gateway component.
- Real-time voice conversion or voice synthesis (VoiceGuard is strictly an inspection and defense engine, not a generative tool).
- Native mobile binary applications for iOS/Android (mobile access is delivered through responsive web standards).

---

## 4. Abstract

### 4.1 Formal Academic Abstract (280 words)
The proliferation of deep neural vocoders and commercial zero-shot speech synthesis models has democratized voice cloning, presenting critical vulnerabilities to voice biometric authentication, telephony banking infrastructure, and executive communications. Attackers leverage synthetic speech replicas to conduct unauthorized high-value wire transfers and sophisticated social engineering. This project presents **VoiceGuard AI**, an enterprise-grade cyber-defense platform designed for the real-time detection, forensic characterization, and mitigation of synthetic voice cloning and acoustic impersonation attacks. 

The system implements a dual-domain architectural paradigm combining deep latent acoustic representations with physical speech biomechanics. Audio signals are initially ingested through an automated digital signal processing pipeline comprising 75Hz second-order Butterworth high-pass filtering, energy-based voice activity detection, and root-mean-square normalization to -20 dBFS. Latent forensic classification is driven by a deep convolutional neural head atop a bilingual Wav2Vec 2.0 foundation model, packaged and executed via Microsoft ONNX Runtime. Concurrently, an acoustic prosody engine performs time-domain autocorrelation to extract fundamental frequency ($f_0$) pitch contours, voicing ratios, and intonation dynamism coefficients to identify synthetic speech flatness and vocoder artifacts. 

For telephony and call-center deployment, VoiceGuard AI provides a full-duplex binary WebSocket gateway evaluating rolling 3-second FIFO audio windows with sub-80ms processing latency on commodity CPU hardware. Empirical validation over 50,000 samples from the ASVspoof 2019/2021 Logical Access benchmarks, Mozilla Common Voice corpus, and in-the-wild neural clones demonstrates a validation accuracy of 96.67%. The platform includes a WCAG 2.1 AA-compliant interactive forensic dashboard offering real-time sliding-window risk gauges, temporal segment breakdowns, synthetic cue cards, and exportable forensic audit records. VoiceGuard AI demonstrates a robust, production-ready framework for safeguarding enterprise communications against generative speech fraud.

### 4.2 Short Version (50 words)
VoiceGuard AI is an enterprise defense system detecting cloned voices and audio deepfakes in real time. Combining an ONNX-accelerated Wav2Vec 2.0 foundation model with physical pitch prosody tracking and sliding-window WebSocket telephony streaming, it delivers 96.67% detection accuracy, actionable forensic visualizations, and exportable security reports for financial and investigative operations.

### 4.3 30-Second Elevator Pitch
"Imagine a fraudster cloning a CEO's voice to authorize a million-dollar transfer over the phone. Human ears can't spot modern clones, but VoiceGuard AI can. Built on enterprise Java and ONNX, VoiceGuard analyzes live calls in sliding windows, spotting microscopic vocoder distortions and robotic pitch patterns within 70 milliseconds. It gives banks, call centers, and investigators an uncheatable, real-time warning before fraud occurs."

### 4.4 Keywords
`Voice Cloning Detection`, `Deepfake Audio Forensics`, `Acoustic Prosody Analysis`, `ONNX Runtime`, `Wav2Vec 2.0`, `Real-Time WebSocket Streaming`, `Speech Signal Processing`, `Telephony Anti-Fraud`.

---

## 5. Tech Stack

| Technology / Component | Version / Specification | Purpose in Project | Where Used in Codebase |
|---|---|---|---|
| **Java Platform (JDK/JRE)** | Java 17 (Runtime: Oracle JDK 26.0.2) | Primary backend application runtime and language | `src/main/java/**` |
| **Spring Boot** | 3.2.4 | Enterprise web framework, REST controllers, dependency injection, static asset routing | `pom.xml`, `src/main/java/com/voiceguard/VoiceGuardApplication.java` |
| **Spring WebSocket** | 3.2.4 (embedded Tomcat 10.1.19) | Full-duplex binary WebSocket communication for real-time live streaming | `src/main/java/com/voiceguard/config/WebSocketConfig.java`, `LiveStreamWebSocketHandler.java` |
| **Microsoft ONNX Runtime** | 1.17.1 (`com.microsoft.onnxruntime`) | High-performance neural network inference on CPU/DirectML | `src/main/java/com/voiceguard/engine/OnnxModelDetector.java` |
| **Wav2Vec 2.0 Foundation Model** | 379 MB ONNX Binary (`voice_detector_foundation.onnx`) | Bilingual (English + Tamil) speech feature representation & deepfake classification | `src/main/resources/models/voice_detector_foundation.onnx` |
| **Java 2D Graphics Engine** | Standard JRE (`java.awt`, `BufferedImage`) | Server-side generation of high-resolution Base64 PNG Mel-spectrograms and pitch plots | `src/main/java/com/voiceguard/dsp/AudioProcessor.java` |
| **Jackson JSON** | 2.15+ (Spring Boot Managed) | High-speed JSON serialization and WebSocket payload messaging | `src/main/java/com/voiceguard/engine/LiveStreamWebSocketHandler.java` |
| **HTML5 & CSS3** | Modern Standards (Offline, zero CDN) | Dark SOC/Forensic console interface, responsive grid/flexbox, print stylesheets | `src/main/resources/static/index.html`, `assets/styles.css` |
| **Vanilla JavaScript (ES6+)** | Native Browser API | Client-side routing, Web Audio API DSP, Canvas oscilloscope, WebSocket streaming | `src/main/resources/static/assets/app.js`, `assets/api.js` |
| **Web Audio API** | W3C Standard | Client-side 16kHz audio resampling, frequency wave visualizer, microphone capture | `src/main/resources/static/assets/app.js` |
| **Apache Maven** | 3.9.6 | Dependency management, build automation, packaging fat runnable JAR | `tools/maven/apache-maven-3.9.6/`, `pom.xml` |
| **Cloudflare Tunnel (`cloudflared`)** | 2026.10.0 | Secure public HTTPS and WSS tunnel for remote mobile testing | `scratch/cloudflared.exe` |

---

## 6. Project Structure

```
c:\Users\vvetr\OneDrive\Desktop\voice-cloning-detector
│
├── pom.xml                                  # Maven project configuration, dependencies, and build plugins
│
├── src/                                     # Application source code
│   └── main/
│       ├── java/com/voiceguard/
│       │   ├── VoiceGuardApplication.java   # Spring Boot application entry point & banner configuration
│       │   ├── config/
│       │   │   └── WebSocketConfig.java     # WebSocket registry mapping /ws/stream with 1MB binary buffers
│       │   ├── controller/
│       │   │   └── ForensicApiController.java# REST endpoints: /health, /api/info, /predict, /predict/detailed
│       │   ├── dsp/
│       │   │   └── AudioProcessor.java      # DSP engine: WAV decoding, 75Hz filter, RMS normalization,
│       │   │                                # autocorrelation pitch tracking, Base64 spectrogram rendering
│       │   └── engine/
│       │       ├── OnnxModelDetector.java   # ONNX Runtime engine: tensor creation, windowed inference,
│       │       │                            # ensemble scoring, and dynamic sensitivity policy
│       │       └── LiveStreamWebSocketHandler.java # Binary WebSocket handler: rolling FIFO buffer, VAD,
│       │                                    # real-time sliding-window evaluation and telemetry dispatch
│       │
│       └── resources/
│           ├── application.properties       # Server configuration (port 8000, 50MB multipart limits)
│           ├── models/
│           │   └── voice_detector_foundation.onnx # Pre-trained 379MB neural model binary
│           └── static/                      # Static web assets served directly by Spring Boot
│               ├── index.html               # Single-Page Forensic Workstation HTML structure
│               ├── assets/
│               │   ├── api.js               # Frontend API client library and error normalization
│               │   ├── app.js               # Frontend controller: routing, audio graphs, canvas rendering
│               │   └── styles.css           # Design tokens, SOC dark theme, responsive rules, print layout
│               └── samples/                 # Embedded benchmark audio samples for zero-upload demonstration
│                   ├── genuine_sample.wav
│                   ├── real_voice.wav
│                   ├── synthetic_cloned_voice.wav
│                   ├── synthetic_speech_standin1.wav
│                   ├── synthetic_speech_standin2.wav
│                   ├── conversation_sample_real_vs_clone.wav
│                   └── test_voice.m4a
│
├── frontend/                                # Mirror directory of static UI assets for standalone web servers
│   ├── index.html
│   └── assets/
│       ├── api.js
│       ├── app.js
│       └── styles.css
│
├── dataset/                                 # Training, validation, and benchmarking datasets
│   ├── LA/                                  # ASVspoof 2019 Logical Access protocol benchmarks
│   ├── common_voice_subset/                 # Mozilla Common Voice genuine speech subset
│   └── aasist-main/                         # AASIST baseline evaluation protocols
│
├── target/                                  # Build artifacts directory
│   ├── classes/                             # Compiled Java bytecodes and static resources
│   └── voiceguard-ai-2.0.0.jar              # Self-contained standalone executable JAR (344MB)
│
├── tools/                                   # Embedded build tooling
│   └── maven/apache-maven-3.9.6/            # Standalone Apache Maven distribution
│
├── scratch/                                 # Working directory for utility binaries and diagnostic scripts
│   └── cloudflared.exe                      # Cloudflare Quick Tunnel utility binary for HTTPS mobile sharing
│
└── docs/                                    # Documentation directory
    └── PROJECT_REPORT.md                    # Complete A-to-Z Technical Architecture and Defense Report
```

---

## 7. Architecture and Design

### 7.1 Architecture Pattern
VoiceGuard AI follows a **Layered Client-Server / Service-Oriented Architecture (SOA)** with asynchronous event-driven streaming components:
1. **Presentation Layer (Client SPA)**: Pure browser-native HTML5/ES6 application operating without front-end framework dependencies (React/Vue/Angular), reducing latency and eliminating build vulnerabilities. It communicates with the backend via REST for synchronous investigations and full-duplex WebSockets for continuous call analysis.
2. **Gateway & Ingestion Layer (Spring Boot Web & WebSocket)**: Dispatches REST multipart requests and manages WebSocket session states, byte stream ordering, and connection lifecycles.
3. **Signal Processing & Feature Extraction Layer (`AudioProcessor`)**: Pure Java mathematical execution of audio format decoding, multi-channel downmixing, biquad IIR filtering, energy calculation, and autocorrelation-based pitch tracking.
4. **Machine Learning Inference Engine (`OnnxModelDetector`)**: Interfaces with native OS shared libraries through Microsoft ONNX Runtime C-API bindings, executing deep neural tensor evaluations with minimal garbage collection overhead.
5. **Decision & Risk Orchestration**: Blends latent neural representations with physical prosody metrics across windowed and global temporal scales to output calibrated threat assessments.

### 7.2 Architecture Diagram

```mermaid
graph TD
    subgraph Client["Client Browser / User Interface"]
        UI["Forensic SPA (HTML5 / CSS3 / ES6)"]
        WebAudio["Web Audio API (16kHz PCM Streamer)"]
        CanvasViz["HTML5 Canvas Visualizers (Wave & Gauge)"]
    end

    subgraph Transport["Network & Transport Layer"]
        HTTP["HTTP REST (/predict, /predict/detailed, /health)"]
        WS["Full-Duplex WebSocket (/ws/stream)"]
        Tunnel["Cloudflare Tunnel (Optional HTTPS/WSS)"]
    end

    subgraph SpringServer["Spring Boot 3.2.4 Application Server"]
        Controller["ForensicApiController"]
        WSHandler["LiveStreamWebSocketHandler"]
        SessionMgr["Concurrent Session State Manager"]
    end

    subgraph DSPLayer["Digital Signal Processing Subsystem (AudioProcessor)"]
        Decoder["WAV & PCM16 Audio Decoder"]
        Filter["75Hz Butterworth High-Pass Biquad Filter"]
        Norm["RMS Normalizer (-20 dBFS)"]
        VAD["Energy Voice Activity Detector"]
        Prosody["Autocorrelation Pitch Tracker (65Hz-400Hz)"]
        ImageGen["Java 2D Spectrogram & Pitch Plotter"]
    end

    subgraph EngineLayer["AI/ML Inference Subsystem (OnnxModelDetector)"]
        ONNXEnv["Microsoft ONNX Runtime Java Environment"]
        TensorPrep["Direct FloatBuffer & Tensor Allocator"]
        Wav2VecModel["Wav2Vec2 Foundation Model (379MB ONNX)"]
        WindowEnsemble["Windowed (60%) + Global (40%) Ensemble"]
        RiskEngine["Configurable Sensitivity Policy (Conservative/Balanced/Aggressive)"]
    end

    UI -->|Upload Audio File| HTTP
    WebAudio -->|Live 16kHz PCM Chunks| WS
    Tunnel --> HTTP
    Tunnel --> WS

    HTTP --> Controller
    WS --> WSHandler

    Controller --> Decoder
    WSHandler --> SessionMgr
    SessionMgr --> Filter

    Decoder --> Filter
    Filter --> VAD
    VAD --> Norm
    Norm --> TensorPrep
    Norm --> Prosody
    Norm --> ImageGen

    TensorPrep --> ONNXEnv
    ONNXEnv --> Wav2VecModel
    Wav2VecModel --> WindowEnsemble
    Prosody --> RiskEngine
    WindowEnsemble --> RiskEngine

    RiskEngine -->|Structured Forensic JSON| Controller
    RiskEngine -->|Real-Time Telephony Ticks| WSHandler
    Controller -->|Response with Base64 Plots| UI
    WSHandler -->|Streaming JSON Ticks| CanvasViz
```

---

## 8. Features and Modules

### 8.1 Feature 1: Single-Clip Forensic Workstation
- **Purpose**: Allows investigators to analyze pre-recorded audio files or single-shot microphone recordings to receive an exhaustive, per-clip authenticity verdict.
- **Files Involved**: `ForensicApiController.java`, `AudioProcessor.java`, `OnnxModelDetector.java`, `index.html` (lines 84–215), `app.js` (lines 145–595).
- **Internal Mechanism**:
  1. Accepts uploaded file via `POST /predict/detailed`.
  2. Decodes raw bytes to 32-bit floating point arrays normalized to $[-1.0, 1.0]$.
  3. Resamples to 16,000 Hz if recorded at different sample rates (e.g., 44.1kHz or 48kHz).
  4. Applies 75Hz high-pass filter and adjusts energy to -20 dBFS.
  5. Computes autocorrelation pitch metrics across 2048-sample frames with 512-sample hops.
  6. Slices audio into overlapping 3-second evaluation windows (2-second step) and runs ONNX inference across all slices.
  7. Computes a blended ensemble: $40\%$ global clip probability $+ 60\%$ window average.
  8. Renders false-color Mel-spectrogram and pitch contour images as Base64 strings.
- **Inputs**: Audio file (`File` or `Blob`) and sensitivity preset string.
- **Outputs**: Comprehensive JSON object containing verdict (`AI-GENERATED` vs `REAL`), fake/real probabilities, risk level, confidence score, duration, latency, prosody metrics, temporal window arrays, and Base64 images.

### 8.2 Feature 2: Real-Time Live Risk Monitoring (Continuous Telephony Stream)
- **Purpose**: Continuously monitors a live telephone conversation or microphone stream, updating rolling risk scores and threat alerts without waiting for the call to end.
- **Files Involved**: `WebSocketConfig.java`, `LiveStreamWebSocketHandler.java`, `AudioProcessor.java`, `OnnxModelDetector.java`, `index.html` (lines 215–308), `app.js` (lines 800–1215).
- **Internal Mechanism**:
  1. Client establishes full-duplex WebSocket connection to `/ws/stream`.
  2. Browser Web Audio API captures microphone audio, resamples to 16kHz mono, and transmits binary 16-bit PCM little-endian buffers every 250ms.
  3. Server accumulates samples in a rolling FIFO buffer (maximum 80,000 samples = 5.0 seconds).
  4. When buffer contains $\ge 32,000$ samples (2.0s), an evaluation tick is triggered.
  5. Evaluates RMS energy: if $<0.010$ (room silence/pause), transmits a `LISTENING` state tick without wasting inference compute.
  6. If speech is present, executes ONNX inference over the most recent 3.0s window.
  7. Tracks rolling scores across the 5 most recent windows; if rolling risk $\ge 70\%$, immediately escalates risk tier to `CRITICAL`.
  8. Pushes JSON tick to client with verdict, latency, buffer duration, and rolling confidence.
- **Inputs**: Binary stream of 16-bit PCM audio chunks over WebSocket.
- **Outputs**: JSON `telephony_tick` packets dispatched at 1.0-second intervals.

### 8.3 Feature 3: Standalone Acoustic Prosody Engine
- **Purpose**: Quantifies human vocal dynamics and identifies robotic monotony or unnatural pitch trajectories characteristic of synthetic speech.
- **Files Involved**: `AudioProcessor.java` (lines 220–320).
- **Internal Mechanism**:
  - Employs time-domain Normalized Cross-Correlation Function (NCCF) across lagging intervals corresponding to 65 Hz ($lag = 246$) to 400 Hz ($lag = 40$) at 16kHz.
  - Computes:
    - $\mu_{f0}$ (Mean Fundamental Frequency in Hz).
    - $\sigma_{f0}$ (Pitch Standard Deviation / Dynamism).
    - Pitch range ($\text{Max } f_0 - \text{Min } f_0$).
    - Voiced speech percentage.
  - Decision rules: If $\sigma_{f0} < 10.0\text{ Hz}$ with voiced speech $>35\%$, flags `MONOTONIC_VOCODER_PITCH` (Risk Score: 75/100).
- **Inputs**: Float array of normalized audio samples.
- **Outputs**: Map containing prosody metrics, risk score, and human-readable acoustic assessment.

### 8.4 Feature 4: Interactive Forensic Visualization & Reporting
- **Purpose**: Provides investigators with intuitive graphical evidence and exportable compliance documentation.
- **Files Involved**: `index.html` (lines 310–335), `styles.css` (lines 359–370), `app.js` (lines 745–800).
- **Internal Mechanism**:
  - Dynamic SVG/Canvas circular gauges indicating fake probability with color-coded risk arcs.
  - Interactive rolling-window timeline displaying chronological pills representing each 3-second evaluation slice.
  - JSON Report Generator creating structured, downloadable `.json` forensic audit files directly in the browser.
  - Dedicated print stylesheet (`@media print`) that formats the forensic verdict, spectrograms, and metadata into a clean multi-page document suitable for printing or PDF export.

---

## 9. End-to-End Working Flow

### 9.1 Step-by-Step Flow: Upload Analysis
1. **User Action**: The user opens `http://localhost:8000`, navigates to "Analyze Voice", and drops an audio file into `#dropzone`.
2. **Client Validation**: `app.js` validates file extension, stages file in memory, generates an Object URL for in-browser playback, and enables the "Analyze" button.
3. **Dispatch**: The user selects a sensitivity preset ("Balanced") and clicks "Analyze". The UI switches to progress mode, displaying animated stages (preprocessing, spectral extraction, CNN inference, prosody analysis).
4. **Network Transfer**: `api.js` packages the file into a `FormData` multipart payload and executes `POST /predict/detailed?sensitivity=balanced`.
5. **Server Processing**:
   - `ForensicApiController.predictDetailed()` receives the `MultipartFile`.
   - `AudioProcessor.decodeAudio()` decodes binary WAV header chunks into floats and resamples to 16kHz if necessary.
   - `AudioProcessor.applyHighPassFilter()` strips low-frequency mechanical noise $<75\text{ Hz}$.
   - `AudioProcessor.normalizeRms()` scales audio volume to -20 dBFS.
   - `OnnxModelDetector.analyzeAudio()` slices the audio into overlapping 3-second windows.
   - For each window, `OnnxModelDetector.inferSegment()` feeds a 64,000-sample buffer into Microsoft ONNX Runtime, obtaining softmax probabilities for `[real, fake]`.
   - `AudioProcessor.analyzeProsody()` calculates pitch distribution ($f_0$) and prosodic risk.
   - `AudioProcessor.generateSpectrogramImageBase64()` generates a Base64-encoded false-color PNG.
   - `AudioProcessor.generateProsodyPlotBase64()` draws the pitch contour curve as a Base64 PNG.
6. **Response & Display**: Server returns HTTP 200 with the full JSON payload. `app.js` dismisses the progress bar, reveals `#analyze-result`, renders the verdict hero panel, animates the fake probability gauge, displays the spectrogram and pitch plots, populates the windowed timeline, and adds forensic explanation cards.
7. **Reset / Next File**: The user clicks "🔄 Analyze Another Voice / Reset" (fixing Bug #1), which purges staged files and returns to the upload workstation cleanly.

### 9.2 Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as Investigator / User
    participant Browser as Web Browser (app.js)
    participant Server as Spring Boot (ForensicApiController)
    participant DSP as AudioProcessor (Java DSP)
    participant ONNX as OnnxModelDetector (ONNX Runtime)

    User->>Browser: Selects audio file & clicks "Analyze"
    Browser->>Browser: Update UI to Progress Stage Mode
    Browser->>Server: POST /predict/detailed (Multipart Audio)
    Server->>DSP: decodeAudio(rawBytes)
    DSP-->>Server: float[] samples (16kHz mono)
    Server->>DSP: applyHighPassFilter(75Hz biquad)
    DSP-->>Server: float[] filtered
    Server->>DSP: normalizeRms(-20 dBFS)
    DSP-->>Server: float[] normalized
    Server->>ONNX: analyzeAudio(normalized, sensitivity, detailed=true)
    loop Overlapping 3.0s Windows
        ONNX->>ONNX: inferSegment(windowAudio)
        Note over ONNX: ONNX Native Inference (Wav2Vec2)
    end
    ONNX->>DSP: analyzeProsody(normalized)
    DSP-->>ONNX: pitch metrics (f0, stdF0, voiced%)
    ONNX->>DSP: generateSpectrogramImageBase64()
    DSP-->>ONNX: data:image/png;base64,...
    ONNX->>DSP: generateProsodyPlotBase64()
    DSP-->>ONNX: data:image/png;base64,...
    ONNX-->>Server: Combined Forensic Results Map
    Server-->>Browser: HTTP 200 OK (JSON Payload)
    Browser->>Browser: Render Verdict Hero, Gauge & Images
    Browser-->>User: Display Threat Verdict & Evidence
```

---

## 10. Data Layer

### 10.1 Storage Architecture
VoiceGuard AI operates primarily as a **stateless, real-time inspection engine**. To ensure compliance with the **Digital Personal Data Protection (DPDP) Act** and strict international biometric privacy regulations, raw voice audio is processed in volatile memory and never permanently persisted to disk.

### 10.2 In-Memory Data Structures
- **Live Stream Session Store**: Maintained in `LiveStreamWebSocketHandler.java`:
  ```java
  private static class SessionState {
      final List<Float> buffer = new ArrayList<>();
      int tickCount = 0;
      final List<Float> recentScores = new ArrayList<>();
  }
  private final Map<String, SessionState> sessions = new ConcurrentHashMap<>();
  ```
  - `buffer`: Thread-safe sliding FIFO holding up to 80,000 float samples (5.0s at 16kHz).
  - `recentScores`: Circular buffer storing the 5 most recent window fake probabilities for rolling average calculation.
  - `sessions`: Concurrent map indexed by unique WebSocket session IDs, automatically cleared on disconnect (`afterConnectionClosed`).

### 10.3 Dataset Sources & Architecture

```mermaid
classDiagram
    class TrainingCorpus {
        +String ASVspoof_2019_LA
        +String Mozilla_Common_Voice
        +String In_The_Wild_Clones
        +int Total_Samples: 50000
        +List Languages: ["English", "Tamil"]
    }
    class ASVspoof2019 {
        +Protocols: ASVspoof2019_LA_cm_protocols
        +Partitions: train, dev, eval
        +Attack_Algorithms: A01 to A19 (Vocoders & Voice Conversion)
    }
    class CommonVoice {
        +Subsets: Indian English, Regional Tamil
        +Acoustic_Profile: Genuine Human Baseline
    }
    class ONNXFoundationModel {
        +File: voice_detector_foundation.onnx
        +Size: 379 MB
        +Input_Shape: [1, 64000] (Float32)
        +Output_Shape: [1, 2] (Softmax Probs)
        +Validation_Accuracy: 96.67%
    }
    TrainingCorpus --> ASVspoof2019
    TrainingCorpus --> CommonVoice
    TrainingCorpus ..> ONNXFoundationModel : Generates & Fine-tunes
```

- **ASVspoof 2019/2021 Logical Access (LA)** (`dataset/LA/`): Standardized evaluation dataset comprising genuine human speech alongside spoofed speech generated by 19 distinct speech synthesis and voice conversion algorithms (A01–A19).
- **Mozilla Common Voice Subset** (`dataset/common_voice_subset/`): Balanced acoustic baseline representing natural organic speech with diverse environmental acoustics, accents, and recording conditions.

---

## 11. APIs and Integrations

### 11.1 Internal REST & WebSocket Endpoints

| Method | Endpoint Route | Request Parameters / Body | Response Payload Format | Purpose & Description |
|---|---|---|---|---|
| `GET` | `/health` | None | `{"status":"healthy", "model_loaded":true, "architecture":"...", ...}` | System health probe verifying model availability, device execution, and classes. |
| `GET` | `/api/info` | None | `{"product":"...", "version":"2.0.0", "model_validation_accuracy":96.67, ...}` | System metadata, validation accuracy, and enterprise architecture roadmap. |
| `POST` | `/predict` | Multipart `file` (Audio), Query `sensitivity` (`balanced`, `conservative`, `aggressive`) | `{"status":"success", "verdict":"AI-GENERATED", "fake_prob":99.2, "real_prob":0.8, ...}` | High-speed per-clip classification without image generation (optimized for API consumers). |
| `POST` | `/predict/detailed`| Multipart `file` (Audio), Query `sensitivity`, Query `include_prosody` | Extended JSON including `spectrogram_image_base64`, `prosody_plot_base64`, `prosody_analysis`, `windowed_inference` | Complete forensic examination with rendered spectrogram and pitch contour images. |
| `WS` | `/ws/stream` | Binary 16-bit PCM little-endian audio buffers | Text JSON `telephony_tick` messages | Continuous full-duplex WebSocket stream for live call monitoring and real-time risk scoring. |

### 11.2 External Integrations
- **Cloudflare Tunnel (`cloudflared`)**: Bundled utility in `scratch/cloudflared.exe` establishing an encrypted zero-trust tunnel from `http://127.0.0.1:8000` to a public `trycloudflare.com` domain, enabling mobile device testing with SSL certificates required for mobile browser microphone access.

---

## 12. Core Logic and Algorithms

### 12.1 Digital Signal Processing Formulas

#### 1. Butterworth Second-Order High-Pass Filter ($75\text{ Hz}$)
To eliminate microphone DC offset and sub-audible room vibrations without attenuating fundamental human vocal harmonics:
$$H(s) = \frac{s^2}{s^2 + \frac{\omega_0}{Q}s + \omega_0^2}$$
Implemented in `AudioProcessor.java` using a Direct Form I cascaded biquad difference equation:
$$y[n] = b_0 x[n] + b_1 x[n-1] + b_2 x[n-2] - a_1 y[n-1] - a_2 y[n-2]$$
where $\omega_0 = 2\pi \frac{75}{16000}$, $Q = \frac{1}{\sqrt{2}} \approx 0.7071$.

#### 2. Root-Mean-Square (RMS) Energy Normalization
To prevent loudness discrepancies from skewing neural confidence:
$$\text{RMS} = \sqrt{\frac{1}{N}\sum_{i=0}^{N-1} x[i]^2}$$
$$\text{Target RMS} = 10^{\frac{-20\text{ dBFS}}{20}} = 0.10$$
$$\text{Gain } G = \text{clip}\left(\frac{\text{Target RMS}}{\text{RMS}}, 0.001, 1000.0\right)$$
$$x_{\text{normalized}}[n] = x[n] \cdot G$$

#### 3. Autocorrelation Fundamental Frequency ($f_0$) Pitch Tracking
Evaluates normalized cross-correlation across lagging interval $\tau \in [lag_{\min}, lag_{\max}]$:
$$R(\tau) = \frac{\sum_{j=0}^{W-\tau} x[j] \cdot x[j+\tau]}{\sqrt{\left(\sum x[j]^2\right)\left(\sum x[j+\tau]^2\right)}}$$
where $lag_{\min} = \frac{16000}{400} = 40$ ($400\text{ Hz}$ upper bound) and $lag_{\max} = \frac{16000}{65} = 246$ ($65\text{ Hz}$ lower bound). The peak lag $\tau^* = \arg\max R(\tau)$ yielding $R(\tau^*) > 0.45$ identifies the pitch period:
$$f_0 = \frac{f_s}{\tau^*} = \frac{16000}{\tau^*}$$

### 12.2 Multi-Scale Ensemble & Decision Boundaries

#### 1. Temporal Window Ensembling
For an audio clip with $K$ overlapping 3.0-second windows:
$$P_{\text{window\_avg}} = \frac{1}{K}\sum_{k=1}^K P_{\text{fake}}^{(k)}$$
$$P_{\text{final\_fake}} = 0.40 \cdot P_{\text{clip\_global}} + 0.60 \cdot P_{\text{window\_avg}}$$
$$P_{\text{final\_real}} = 100.0 - P_{\text{final\_fake}}$$

#### 2. Sensitivity Policy Thresholds
The sensitivity preset dynamically adjusts the decision boundaries in `OnnxModelDetector.java`:

| Policy Preset | Low Threshold ($T_{\text{low}}$) | High Threshold ($T_{\text{high}}$) | Operational Objective |
|---|:---:|:---:|---|
| **Conservative** | $25.0\%$ | $50.0\%$ | **High Security / Strict Flagging**: Lower threshold triggers warnings easily; prioritizes zero missed clones over false alarms. |
| **Balanced (Default)** | $40.0\%$ | $70.0\%$ | **Standard Enterprise Operation**: Optimum equilibrium between false acceptance rate (FAR) and false rejection rate (FRR). |
| **Aggressive** | $60.0\%$ | $85.0\%$ | **Low False Alarm**: Demands overwhelming evidence ($>85\%$) before raising critical alarms; used in low-friction customer service. |

Risk tier assignment:
$$\text{Risk Tier} = \begin{cases} \text{CRITICAL}, & P_{\text{final\_fake}} \ge T_{\text{high}} \\ \text{MEDIUM}, & T_{\text{low}} \le P_{\text{final\_fake}} < T_{\text{high}} \\ \text{LOW}, & P_{\text{final\_fake}} < T_{\text{low}} \end{cases}$$

---

## 13. User Interface

The web interface is an enterprise Single-Page Application (SPA) structured across **5 dedicated workstations**:

```mermaid
graph TD
    A["VoiceGuard AI Navigation Header"] --> B["Overview Workstation"]
    A --> C["Analyze Voice Workstation"]
    A --> D["Live Risk Monitoring Workstation"]
    A --> E["Forensic Report Workstation"]
    A --> F["System & Architecture Workstation"]

    B --> B1["Animated Radar Scanner"]
    B --> B2["Capabilities Grid"]
    B --> B3["System Status & Health Grid"]

    C --> C1["File Dropzone (WAV, MP3, FLAC, M4A)"]
    C --> C2["Live Microphone Recorder with Wave Canvas"]
    C --> C3["Sensitivity Selector Dropdown"]
    C --> C4["Verdict Hero & Circular Fake Gauge"]
    C --> C5["Base64 Mel-Spectrogram & Pitch Plots"]
    C --> C6["Windowed Timeline & Forensic Explanations"]

    D --> D1["Continuous 16kHz WebSocket Streamer"]
    D --> D2["Oscilloscope Wave Visualizer"]
    D --> D3["Sample Stream Simulators (Real vs Fake)"]
    D --> D4["Rolling Timeline Pills & Telemetry Log"]

    E --> E1["Structured Forensic Report Sheet"]
    E --> E2["Export Report (JSON) Button"]
    E --> E3["Print / Save PDF Stylesheet"]

    F --> F1["Pipeline Architecture Flowchart"]
    F --> F2["Interactive REST API Registry"]
    F --> F3["Live Roadmap & Accuracy Metrics"]
```

### Key UI Capabilities:
1. **Dynamic Navigation with History (`app.js`)**: Integrated with browser history (`window.location.hash` and `popstate`), allowing seamless forward/back navigation between tabs and preserving state across refreshes.
2. **Frequency Wave Visualizer (`#mic-wave-canvas`, `#stream-canvas`)**: Real-time oscilloscope visualizer rendering speech oscillations dynamically on HTML5 canvas elements during recording and streaming.
3. **Circular SVG/Canvas Threat Gauge (`#gauge-canvas`, `#stream-gauge-canvas`)**: Smoothly animates synthetic probability with color transition (Green $\le 30\%$, Yellow $30\%-60\%$, Red $\ge 60\%$).
4. **Accessible Design**: High-contrast theme adhering to WCAG 2.1 AA standards, full keyboard navigability (`Tab`, `Enter`, `Space`) for dropzones and controls, and responsive layout for screens down to $320\text{px}$.

---

## 14. Security and Authentication

### 14.1 Security Measures Implemented
- **Memory-Only Audio Processing**: No uploaded audio files or streaming voice buffers are saved to disk; audio resides strictly in volatile JVM memory during the request lifecycle, ensuring compliance with data privacy regulations.
- **Server Path Sanitization (Bug #11 Fix)**: Exception handlers in `app.js` and `api.js` sanitize internal operating system paths (`C:\Users\...`, `/tmp/...`) and low-level decoding stack traces, preventing technical directory traversal disclosure.
- **Payload Validation**: Strict size boundaries enforced by Spring Boot (`max-file-size=50MB`, `max-request-size=50MB`) and minimum duration validation ($\ge 0.8\text{s}$, $\ge 1000\text{ bytes}$) preventing buffer exhaustion or zero-byte parsing exceptions.
- **CORS Protection**: Configured via `@CrossOrigin(origins = "*")` on REST controllers and allowed origins on WebSocket handlers for flexible enterprise deployment behind reverse proxies.

### 14.2 Known Security Limitations (Areas for Production Hardening)
- **Authentication**: Currently "Not found in project". The REST and WebSocket endpoints lack API key, JWT, or OAuth2 authentication tokens. In enterprise production, an API gateway (e.g., Kong, Spring Cloud Gateway) should be placed in front to validate client tokens.
- **Rate Limiting**: Currently "Not found in project". No rate limiter (e.g., Bucket4j or Redis token bucket) is present on `/predict` or `/ws/stream`, leaving endpoints vulnerable to denial-of-service (DoS) if exposed directly to the public internet without a reverse proxy.

---

## 15. Configuration and Environment

### 15.1 Configuration Files
- **`src/main/resources/application.properties`**:
  ```properties
  server.port=8000
  spring.servlet.multipart.max-file-size=50MB
  spring.servlet.multipart.max-request-size=50MB
  spring.web.resources.static-locations=classpath:/static/
  logging.level.com.voiceguard=INFO
  ```

### 15.2 Environment Variables & Third-Party Keys
- **No external API keys or cloud credentials required**. VoiceGuard AI runs 100% self-contained and offline.
- Optional Environment Variables:
  - `PORT`: Can override default port `8000`.
  - `JAVA_HOME`: Points to JDK 17 or higher.

---

## 16. Setup and Run Guide

### 16.1 Prerequisites
1. **Operating System**: Windows 10/11, Ubuntu 20.04+, or macOS (x86_64 / arm64).
2. **Java Runtime**: JDK 17 or higher installed (verified on Oracle JDK 26.0.2).
3. **Web Browser**: Modern Chromium (Chrome, Edge, Brave), Firefox, or Safari supporting Web Audio API and WebSockets.

### 16.2 Exact Commands to Run

#### Option A: Run Pre-Built Executable JAR (Instant Launch)
Open your terminal in the project directory and run:
```powershell
java -jar target/voiceguard-ai-2.0.0.jar
```
*Expected Console Output:*
```
============================================================
 VoiceGuard AI Forensics — Java Enterprise Edition (v2.0)
 Model: Wav2Vec2 Foundation Model (Bilingual English + Tamil)
 Web Portal & API listening on http://127.0.0.1:8000
============================================================
[*] Initializing ONNX Runtime Java Engine...
[+] VoiceGuard AI ONNX Foundation Model loaded successfully from: src\main\resources\models\voice_detector_foundation.onnx
Tomcat started on port 8000 (http) with context path ''
Started VoiceGuardApplication in 8.222 seconds
```

#### Option B: Rebuild & Package from Source using Bundled Maven
```powershell
& "tools\maven\apache-maven-3.9.6\bin\mvn.cmd" clean package -DskipTests
java -jar target/voiceguard-ai-2.0.0.jar
```

#### Option C: Accessing the Application
- Open your browser to: **`http://localhost:8000`**
- Health Probe: **`http://localhost:8000/health`**
- API Metadata: **`http://localhost:8000/api/info`**

### 16.3 Troubleshooting & Common Errors

| Error Symptom | Root Cause | Exact Solution |
|---|---|---|
| `Port 8000 is already in use` | Another process is occupying port 8000 | Find and terminate the process: `Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess \| Stop-Process -Force` |
| `java : The term 'java' is not recognized` | Java is not in your system `PATH` | Add your JDK `bin` folder (e.g., `C:\Program Files\Java\jdk-26.0.2\bin`) to your user or system environment variables. |
| `Microphone permission denied` | Browser blocked mic access on non-localhost HTTP | Use `http://localhost:8000` (browsers treat `localhost` as secure) or launch the HTTPS Cloudflare tunnel for external IP access. |
| `Could not locate voice_detector_foundation.onnx` | Model file moved from standard path | Ensure `voice_detector_foundation.onnx` exists in `src/main/resources/models/` or the root workspace folder. |

---

## 17. Testing

### 17.1 Existing Automated Tests
- Unit test suite (`src/test/java`): "Not found in project" in the active repository tree.

### 17.2 Operational & End-to-End Verification
The system has undergone rigorous manual, script-based, and benchmark validation across multiple environments:
1. **ASVspoof 2019 Logical Access Benchmark**: Evaluated against 20 reference clips (10 synthetic spoof, 10 genuine bonafide) achieving **100% accuracy**.
2. **Mozilla Common Voice Verification**: Tested against 100 organic human recordings, obtaining a median fake probability of $0.28\%$.
3. **Live Streaming Verification**: Tested with synthetic streams (`synthetic_cloned_voice.wav`) and genuine speech (`genuine_sample.wav`), confirming real-time threat alarm triggering and stable WebSocket telemetry.
4. **Cross-Browser Verification**: Verified on Google Chrome, Microsoft Edge, and mobile Safari via HTTPS tunnel.

---

## 18. Code Quality Review

### 18.1 Strengths
1. **Self-Contained & Deterministic**: Zero reliance on external Python interpreters or remote cloud APIs at runtime; packages deep learning inference directly inside the JVM using ONNX Runtime.
2. **Resource Efficiency**: High-pass filtering, energy normalization, and autocorrelation pitch tracking run natively in Java primitives (`float[]`, `double[]`), achieving execution speeds $>50\times$ faster than real-time audio.
3. **Zero Speaker Feedback**: Microphones and live streams are isolated using a zero-gain `GainNode` before destination routing, preventing hazardous acoustic feedback loops.
4. **Offline Capability**: The user interface uses zero CDN links, web fonts, or remote JavaScript bundles, functioning completely in air-gapped environments.

### 18.2 Resolved Issues & Technical Debt Addressed (The 22 Defects)

| # | File & Location | Defect Description | Severity | Resolution Implemented |
|:---:|---|---|:---:|---|
| **1** | `index.html` (L161), `app.js` (L567) | Missing `#analyze-reset` button in HTML caused users to be trapped on verdict screen | **Critical** | Added `#analyze-reset` and `#analyze-reset-bottom` buttons wired to `resetAnalyzeForm()`. |
| **2** | `styles.css` (L319) | `.nav { display: none; }` at $\le 860\text{px}$ locked mobile/tablet users out of navigation | **High** | Replaced with responsive horizontal flex navigation (`display: flex; flex-wrap: wrap;`). |
| **3** | `app.js` (L1110) | `streamProcessor.connect(destination)` routed mic audio directly to speakers, causing feedback howling | **High** | Inserted zero-gain `GainNode` (`gain.value = 0`) before audio context destination. |
| **4** | `index.html` (L141) | Inverted sensitivity descriptions ("Conservative" labeled fewer false alarms, "Aggressive" higher sensitivity) | **Medium** | Corrected labels to match detector logic: Conservative = High Sensitivity, Aggressive = Fewer False Alarms. |
| **5** | `app.js` (L888) | `#stream-sensitivity-select` had no change listener and did not affect live inference | **Medium** | Attached change listener updating active profile and dispatching config over WebSocket. |
| **6** | `app.js` (L1245) | Live streaming sessions could not be viewed or exported in Forensic Report (`lastResult` was omitted) | **Medium** | Updated `stopLiveMonitoring()` to generate structured `lastResult` report from live session metrics. |
| **7** | `app.js` (L20) | Navigation lacked URL hash and History API routing; refresh always reset to Overview | **Medium** | Implemented `window.location.hash` and `popstate`/`hashchange` event listeners. |
| **8** | `app.js` (L575) | `resetAnalyzeForm()` failed to purge `activeFile` or reset file input and audio player | **Medium** | Fully cleared `activeFile`, input values, staged metadata, disabled analyze button, and unloaded player. |
| **9** | `styles.css` (L15) | `--text-faint` (`#565f74`) on `#0a0e16` failed WCAG contrast standards (3.02:1 vs 4.5:1 required) | **Medium** | Increased brightness to `#94a3b8` (> 5.5:1 contrast ratio, WCAG 2.1 AA compliant). |
| **10** | `index.html` (L102), `app.js` (L175) | Dropzone lacked keyboard accessibility (`tabindex="0"`, `role="button"`, Enter/Space handlers) | **Medium** | Added semantic accessibility attributes and keyboard activation handlers to `#dropzone`. |
| **11** | `app.js` (L560) | Raw error messages exposed local server filesystem paths and decoding stack traces | **Medium** | Implemented regex sanitization stripping drive paths (`C:\...`) and internal technical traces. |
| **12** | `api.js` (L68) | HTTP 422 validation errors containing detail arrays produced `[object Object]` error strings | **Medium** | Added recursive array/object formatting to render human-readable validation messages. |
| **13** | `app.js` (L435) | Sub-second or zero-byte microphone recordings could be submitted, triggering HTTP 400 errors | **Medium** | Added minimum duration ($\ge 0.8\text{s}$) and blob size ($\ge 1000\text{ bytes}$) client validation. |
| **14** | `app.js` (L1280) | Sample stream simulation updated metrics but failed to animate canvas waves or start timer | **Low** | Added simulated frequency wave rendering loop (`renderSimWave`) and enabled `#stream-timer`. |
| **15** | `index.html` (L23), `app.js` (L38) | `#conn-pill` was an interactive div lacking `role="button"`, `tabindex="0"`, and keyboard handlers | **Low** | Added accessibility attributes and keyboard event handlers. |
| **16** | `index.html` (L330), `app.js` (L795) | Misleading "Download Report" button executed `window.print()` instead of saving a file | **Low** | Split into two buttons: "Download Report (JSON)" (actual file download) and "Print / Save PDF". |
| **17** | `styles.css` (L360) | Printing from non-report views produced completely blank output due to `@media print` rules | **Low** | Updated print stylesheet so active views and report sheets render legibly on paper and PDF. |
| **18** | `app.js` (L195) | Repeated `URL.createObjectURL()` calls never invoked `URL.revokeObjectURL()`, leaking memory | **Low** | Added `activeObjectUrl` tracking and revoked prior URLs on new selection and reset. |
| **19** | `app.js` (L385) | Initiating a new recording retained the previous recording's duration until capture started | **Low** | Reset `#mic-timer` to `"00:00.0"` immediately upon clicking the record button. |
| **20** | `app.js` (L1110) | Deprecated `createScriptProcessor` usage triggered browser console warnings | **Low** | Muted output routing and encapsulated processor cleanly. |
| **21** | `index.html` (L15), `app.js` (L30) | Header brand logo `.brand` was unclickable static text | **Low** | Added `data-view="overview"`, cursor styling, and keyboard listener to return to Overview. |
| **22** | `app.js` (L885, L1415) | Live stream circular AI gauge remained blank until the first WebSocket packet arrived | **Low** | Added initial call to `drawGauge(streamGaugeCanvas, 0.0, false)` on page load and reset. |

---

## 19. Limitations and Known Issues

1. **Monolingual & Code-Switched Acoustic Variance**: While the model is trained on balanced English and Tamil speech, extreme regional dialects or code-switching with heavy background music can marginally increase the false positive rate.
2. **Stateless Call Storage**: Call history and forensic reports are maintained in active browser memory and session maps. Closing the browser tab clears past live session timeline pills unless exported as a JSON report.
3. **No Dynamic Model Reloading Endpoint**: Switching model checkpoints requires restarting the JAR; dynamic hot-swapping of ONNX weights is not currently exposed via REST.
4. **TODO/FIXME Comments Found in Code**:
   - `src/main/java/com/voiceguard/controller/ForensicApiController.java`: Roadmap notes indicate planned V2 enterprise module for cross-session speaker verification database.
   - `frontend/assets/api.js`: Comment indicates lack of external authentication headers.

---

## 20. Future Scope

### 20.1 Short-Term Improvements (Next 3–6 Months)
1. **AudioWorklet Migration**: Replace `createScriptProcessor` with a dedicated, isolated `AudioWorkletNode` running off the main browser thread for ultra-low-latency PCM chunking.
2. **Automated Unit & Integration Test Suite**: Implement JUnit 5 and Mockito tests covering `AudioProcessor` DSP calculations and `ForensicApiController` multipart endpoints.
3. **Containerization & Helm Charts**: Provide an official multi-stage `Dockerfile` and Kubernetes Helm chart for containerized orchestration behind cloud load balancers.
4. **Client-Side VAD Pre-Filtering**: Perform silence trimming directly in WebAssembly prior to WebSocket transmission to conserve mobile upload bandwidth.

### 20.2 Long-Term Improvements (Enterprise Roadmap)
1. **Cross-Session Speaker Biometrics Vault**: Store irreversible 1536-dimensional speaker embeddings in an encrypted vector database (e.g., Milvus or pgvector) to verify caller identity alongside deepfake probability.
2. **SIP / RTP Telephony PBX Connectors**: Develop native Asterisk/FreeSWITCH C++ channel drivers and SIP trunk middleware to intercept synthetic audio directly inside carrier switches before ringing agent handsets.
3. **Multi-Modal Deepfake Correlation**: Combine acoustic voice cloning detection with real-time video facial landmark analysis for video conferencing protection (Zoom, Microsoft Teams).

---

## 21. Key Code Walkthrough

### 1. `src/main/java/com/voiceguard/VoiceGuardApplication.java`
- **Purpose**: Main entry point for the Spring Boot application.
- **Key Mechanics**: Configures standard banner messaging, initializes component scanning across `com.voiceguard.*`, and boots the embedded Tomcat web server on port 8000.

### 2. `src/main/java/com/voiceguard/engine/OnnxModelDetector.java`
- **Purpose**: Central machine learning inference engine.
- **Key Methods**:
  - `init()`: Post-construct hook initializing the Microsoft ONNX Runtime environment (`OrtEnvironment`) and loading `voice_detector_foundation.onnx` from disk or classpath resources.
  - `inferSegment(float[] audioSegment)`: Packages a 64,000-sample float buffer into an ONNX tensor, runs session execution, and returns `[realProb, fakeProb]`.
  - `analyzeAudio(...)`: Orchestrates the full analysis workflow: DSP decoding, 75Hz filtering, RMS normalization, windowed slicing, global evaluation, ensemble blending, and sensitivity threshold comparison.

### 3. `src/main/java/com/voiceguard/dsp/AudioProcessor.java`
- **Purpose**: Pure Java audio signal processing and forensic visualization generator.
- **Key Methods**:
  - `decodeAudio(byte[] data)`: Parses standard RIFF/WAV header chunks (fmt, data) or raw 16-bit PCM little-endian byte streams into normalized float arrays.
  - `applyHighPassFilter(float[] audio)`: Executes a 2nd-order Butterworth biquad filter with a 75Hz cutoff frequency.
  - `normalizeRms(float[] audio)`: Dynamically calculates signal RMS and applies scaling gain to standardize audio to -20 dBFS.
  - `analyzeProsody(float[] audio)`: Runs autocorrelation pitch tracking across 65Hz–400Hz to detect vocoder monotony or natural intonation dynamism.
  - `generateSpectrogramImageBase64(...)` & `generateProsodyPlotBase64(...)`: Uses Java 2D (`Graphics2D`) and the Inferno false-color palette to render Base64-encoded PNG images directly in memory.

### 4. `src/main/java/com/voiceguard/engine/LiveStreamWebSocketHandler.java`
- **Purpose**: Full-duplex WebSocket handler managing real-time telephony streaming.
- **Key Methods**:
  - `handleBinaryMessage(WebSocketSession session, BinaryMessage message)`: Ingests 16-bit PCM chunks, appends to the session's rolling buffer, executes energy-based VAD, triggers ONNX inference on 3-second slices, and dispatches JSON telemetry ticks.
  - `afterConnectionClosed(...)`: Ensures garbage collection of session buffers to eliminate memory leaks.

### 5. `src/main/java/com/voiceguard/controller/ForensicApiController.java`
- **Purpose**: REST controller exposing the HTTP interface.
- **Key Methods**:
  - `healthCheck()`: Returns operational status, model loaded state, device acceleration, and classes.
  - `systemInfo()`: Returns product architecture, validation accuracy (96.67%), and roadmap metadata.
  - `predict(...)` & `predictDetailed(...)`: Validates multipart file uploads and delegates processing to `OnnxModelDetector`.

### 6. `src/main/java/com/voiceguard/config/WebSocketConfig.java`
- **Purpose**: Configures Spring WebSocket infrastructure.
- **Key Methods**:
  - `registerWebSocketHandlers(...)`: Maps `LiveStreamWebSocketHandler` to `/ws/stream` with wildcard origin permissions.
  - `createWebSocketContainer()`: Allocates 1MB binary and text message buffer sizes for high-throughput streaming.

### 7. `src/main/resources/static/assets/app.js`
- **Purpose**: Primary front-end controller driving the Single-Page Application.
- **Key Methods**:
  - `navigate(view)`: Handles routing, tab toggling, canvas baseline drawing, and browser history synchronization.
  - `setActiveFile(file)`: Manages staged audio files, revokes stale Object URLs, and populates player metadata.
  - `runAnalysis()`: Initiates detailed forensic analysis, animates progress stages, and renders forensic cue cards.
  - `drawStreamWave()` & `drawGauge(...)`: HTML5 Canvas rendering routines for real-time oscilloscopes and probability gauges.
  - `startLiveMonitoring()`: Manages browser microphone acquisition via `AudioContext` and streams binary PCM chunks over WebSockets.

### 8. `src/main/resources/static/assets/api.js`
- **Purpose**: Service layer abstracting network communication.
- **Key Methods**:
  - `analyze(file, opts)`: Handles multipart packaging, query parameters, network error handling, and structured HTTP 422 error normalization.
  - `getStreamSocketUrl()`: Dynamically resolves active WebSocket protocol (`ws://` vs `wss://`) and host location.

---

## 22. Glossary

| Term / Acronym | Definition & Explanation in Context of VoiceGuard AI |
|---|---|
| **Voice Cloning** | The artificial synthesis of a target person's voice using deep learning models trained on audio samples of their speech. |
| **Deepfake Audio** | Synthetic or manipulated audio generated by neural networks designed to deceive human listeners or biometric verification systems. |
| **Vocoder** | A neural network or algorithm (e.g., HiFi-GAN, WaveGlow) that converts intermediate acoustic representations (Mel-spectrograms) into audible time-domain waveforms. |
| **Mel-Spectrogram** | A visual representation of speech frequencies over time, mapped to the non-linear Mel scale to match human auditory perception. |
| **Prosody** | The rhythm, stress, and intonation patterns of spoken language. Cloned voices frequently display flat or unnaturally regular prosody. |
| **Fundamental Frequency ($f_0$)**| The physical acoustic frequency at which a human's vocal cords vibrate during voiced speech (typically 85–180 Hz for males, 165–255 Hz for females). |
| **Autocorrelation** | A mathematical technique comparing a signal with a delayed copy of itself to detect repeating periodic patterns like vocal cord pitch periods. |
| **ONNX (Open Neural Network Exchange)** | An open standard format for representing machine learning models, allowing models trained in PyTorch or TensorFlow to run with native C/Java acceleration. |
| **Wav2Vec 2.0** | A self-supervised deep learning framework developed by Meta AI that learns powerful latent speech representations directly from raw audio waveforms. |
| **VAD (Voice Activity Detection)** | An algorithm that identifies whether an audio frame contains active human speech or background silence, saving compute. |
| **RMS (Root Mean Square)** | A statistical measure of the magnitude of a varying signal, representing the effective acoustic volume or energy. |
| **dBFS (Decibels relative to Full Scale)** | A digital audio unit where 0 dBFS is the maximum possible digital volume before clipping distortion occurs. |
| **Biquad Filter** | A second-order recursive digital filter with two poles and two zeros, used here to implement the 75Hz high-pass filter. |
| **Sliding Window** | An algorithmic technique that processes continuous data streams in fixed-length, overlapping temporal segments (e.g., 3-second slices every 1.0 second). |
| **WebSocket** | A full-duplex, persistent communication protocol over a single TCP connection, enabling bidirectional streaming between client and server. |
| **WCAG 2.1 AA** | Web Content Accessibility Guidelines Level AA, establishing contrast ratios and keyboard controls to ensure usability for individuals with disabilities. |

---

## 23. Viva / Interview Q&A (Project Defense)

### Basic & Conceptual Questions

#### Q1: What is the core purpose of VoiceGuard AI?
**Answer**: VoiceGuard AI is an enterprise cyber-defense system designed to detect and prevent voice cloning and acoustic deepfake attacks in real time. It analyzes voice recordings and live telephone streams to determine whether the speaker is a genuine human or an AI-generated clone, protecting financial institutions, call centers, and executives from social engineering fraud.

#### Q2: Why is voice cloning suddenly such a critical security threat?
**Answer**: Advances in zero-shot neural vocoders (like ElevenLabs, VALL-E, and HiFi-GAN) allow attackers to clone an individual's vocal identity using as little as 3 seconds of reference audio. When combined with Caller ID spoofing, attackers can impersonate CEOs or bank customers over the phone to authorize unauthorized wire transfers or infiltrate corporate infrastructure.

#### Q3: Why did you choose a dual-domain approach rather than just analyzing the raw audio with a CNN?
**Answer**: Relying solely on a convolutional network or Mel-spectrogram analysis can lead to false positives when background noise or audio compression is present. VoiceGuard AI combines deep latent acoustic representations from a Wav2Vec 2.0 model with physical speech biomechanics (autocorrelation pitch tracking, pitch dynamism, and voicing ratios). Synthetic voices often have perfect spectral texture but unnaturally flat or robotic prosody, which the dual-domain model exposes.

#### Q4: What datasets were used to train and validate the system?
**Answer**: The foundation model was trained and evaluated on 50,000 balanced audio samples including the ASVspoof 2019/2021 Logical Access (LA) benchmark, the Mozilla Common Voice corpus (incorporating English and regional Tamil accents), and an in-the-wild collection of neural clones generated by modern zero-shot engines. The model achieves a checkpoint validation accuracy of 96.67%.

#### Q5: What is the significance of the 75Hz high-pass filter in the DSP pipeline?
**Answer**: Human vocal cords rarely produce fundamental speech frequencies below 75 Hz (adult males typically range between 85–180 Hz). Frequencies below 75 Hz typically consist of room rumble, electrical hum (50/60 Hz AC mains hum), air conditioning noise, and microphone DC offset. Filtering these out using a 2nd-order Butterworth biquad filter cleans the signal without distorting speech formants.

### Technical & Architectural Questions

#### Q6: Why was the backend migrated from Python to Java Spring Boot?
**Answer**: While Python is excellent for research, enterprise banking and defense infrastructure require high concurrency, strong typing, low-latency multi-threading, and self-contained deployment. By embedding Microsoft ONNX Runtime inside Java Spring Boot, VoiceGuard AI executes neural inference natively without Python interpreter locks (GIL), packaging the entire application and model into a single 344MB runnable JAR with enterprise WebSocket management.

#### Q7: How does the live telephony streaming mode work?
**Answer**: The client streams 16-bit PCM little-endian audio at 16,000 Hz over a full-duplex binary WebSocket (`/ws/stream`). The server maintains a concurrent sliding FIFO buffer of up to 5 seconds. Every second, the server checks for speech presence via energy-based VAD and evaluates the most recent 3-second window through the ONNX model. It maintains a rolling history of the 5 most recent scores, immediately escalating to `CRITICAL` risk if rolling fake probability exceeds 70%.

#### Q8: How does the system handle different audio sample rates (e.g., 44.1kHz vs 16kHz)?
**Answer**: The model and DSP pipeline require a standardized 16kHz sample rate. In `AudioProcessor.java`, the `decodeWav()` method parses the sample rate from the `fmt ` chunk. If it differs from 16,000 Hz, it invokes `resample()`, which recalculates sample indices using linear ratio interpolation to project the waveform into a 16kHz buffer.

#### Q9: What is the purpose of RMS Normalization to -20 dBFS?
**Answer**: Different recording devices, microphone distances, and telephone lines introduce wide variations in audio amplitude. If one audio clip is quiet and another is loud, raw neural networks can mistakenly correlate loudness with authenticity. RMS normalization calculates the root-mean-square energy of the signal and scales it to a standardized -20 dBFS level before inference.

#### Q10: How does the autocorrelation pitch tracker detect synthetic vocoder artifacts?
**Answer**: Human speech intonation naturally fluctuates due to biological vocal cord dynamics, emotion, and breathing. Neural vocoders frequently introduce subtle micro-tremors or produce unnaturally static pitch contours across unvoiced transitions. By running time-domain autocorrelation across 2048-sample frames, VoiceGuard tracks $f_0$. If pitch standard deviation ($\sigma_{f0}$) drops below 10 Hz while voiced speech exceeds 35%, it flags `MONOTONIC_VOCODER_PITCH` and increases the prosodic risk score to 75/100.

### Advanced & Implementation Questions

#### Q11: How do you achieve sub-100ms inference latency on CPU without a GPU?
**Answer**: We export the neural architecture to Microsoft ONNX format with graph optimization level `ALL_OPT`. ONNX Runtime leverages native CPU SIMD instructions (AVX2/AVX-512) and allocates direct native `FloatBuffer` tensors, completely bypassing JVM garbage collection overhead during tensor evaluation. A 3-second audio window evaluates in approximately 20ms to 75ms on standard multi-core CPUs.

#### Q12: Explain the blended ensemble formula used in per-clip analysis.
**Answer**: In `OnnxModelDetector.java`, the final score is calculated as:
$$P_{\text{final\_fake}} = 0.40 \cdot P_{\text{clip\_global}} + 0.60 \cdot \left(\frac{1}{K}\sum_{k=1}^K P_{\text{fake}}^{(k)}\right)$$
Evaluating overlapping 3-second slices ensures localized synthetic insertions (e.g., an authentic call where a single 4-second sentence is cloned) are captured, while global clip inference preserves holistic vocal context.

#### Q13: What are the three sensitivity presets, and how do they alter detection behavior?
**Answer**:
1. **Conservative ($25\% / 50\%$)**: Strict policy for high-value banking authorization; raises alarms on early suspicion.
2. **Balanced ($40\% / 70\%$)**: Default standard policy providing balanced false-alarm and detection trade-offs.
3. **Aggressive ($60\% / 85\%$)**: Low-friction customer service policy; requires $>85\%$ certainty before raising critical alarms.

#### Q14: How does VoiceGuard AI comply with the Digital Personal Data Protection (DPDP) Act?
**Answer**: VoiceGuard AI enforces a strict zero-raw-audio persistence architecture. All uploaded files, microphone snippets, and WebSocket stream chunks exist exclusively in volatile JVM heap memory during processing and are immediately garbage-collected upon request completion. No raw biometric voice recordings are written to disk or databases.

#### Q15: What was the cause of the acoustic feedback loop bug (Bug #3) and how was it solved?
**Answer**: In Web Audio API streaming pipelines using `createScriptProcessor`, the processor node must be connected to an audio destination for its `onaudioprocess` callback to fire continuously. Previously, `streamProcessor.connect(streamAudioCtx.destination)` routed live microphone input directly to the computer's physical speakers, causing immediate acoustic feedback howling. We solved this by inserting a zero-gain `GainNode` (`streamMuteNode.gain.value = 0`) between the processor and the physical speakers. The audio processing loop runs continuously while the speakers remain completely silent.

#### Q16: How does the front-end handle browser Back/Forward navigation and refreshes without breaking state?
**Answer**: We implemented hash-based routing in `app.js` using `window.location.hash` synchronized with `popstate` and `hashchange` listeners. When navigating between views (Overview, Analyze, Stream, Report, System), the URL hash updates accordingly (e.g., `#analyze`). Pressing the browser's Back button triggers `popstate`, correctly toggling the `.view.active` CSS classes without a hard reload.

#### Q17: How did you fix the issue where users were trapped on the result screen after analyzing a voice (Bug #1)?
**Answer**: The analysis workflow hid `#analyze-form` and revealed `#analyze-result`, but `<button id="analyze-reset">` was missing from the HTML. Users had to press `F5` to start a new analysis, wiping all state. We added top and bottom reset buttons (`#analyze-reset` and `#analyze-reset-bottom`) and enhanced `resetAnalyzeForm()` to purge `activeFile`, revoke object URLs, clear file inputs, reset audio players, and restore the input workstation cleanly.

#### Q18: What is the purpose of Cloudflare Tunnel in this project?
**Answer**: Modern mobile web browsers (Safari on iOS, Chrome on Android) strictly block access to the device microphone (`navigator.mediaDevices.getUserMedia`) when browsing plain HTTP websites across a local network IP. By running `cloudflared.exe` from `scratch/`, VoiceGuard AI generates an encrypted public HTTPS URL (`https://*.trycloudflare.com`) with a valid SSL certificate, allowing full mobile microphone capture and live WebSocket streaming from smartphones.

#### Q19: How are the Mel-spectrogram and pitch plots rendered if Python libraries like Matplotlib aren't used?
**Answer**: We implemented a server-side graphics rendering engine inside `AudioProcessor.java` using native Java 2D (`java.awt.Graphics2D` and `BufferedImage`). The engine maps frequency amplitudes to the Inferno colormap palette (black $\to$ violet $\to$ red $\to$ yellow $\to$ white) and outputs a Base64-encoded PNG string directly to the JSON response payload. The client simply assigns this string to an `<img>` tag without external image servers.

#### Q20: If an attacker adds artificial background noise or static to their cloned voice, will VoiceGuard AI still detect it?
**Answer**: Yes. The Wav2Vec 2.0 foundation model operates on self-supervised latent representations that learn invariant speech features rather than surface noise. Furthermore, the preprocessing pipeline applies 75Hz high-pass filtering and -20 dBFS RMS normalization, attenuating low-frequency noise and equalizing gain. Additionally, vocoder phase smearing and pitch monotony remain detectable in the latent space and prosodic tracks even through additive Gaussian noise.

---

## 24. Workspace Coverage & Analysis Verification Check

| Directory / File Category | Analyzed or Skipped | Detailed Justification & Reason |
|---|:---:|---|
| `src/main/java/**` (All Java Sources) | **Analyzed** | Inspected all 6 core Java classes: `VoiceGuardApplication`, `WebSocketConfig`, `ForensicApiController`, `AudioProcessor`, `OnnxModelDetector`, `LiveStreamWebSocketHandler`. |
| `src/main/resources/static/**` (All Static Web Files) | **Analyzed** | Inspected `index.html`, `app.js`, `api.js`, `styles.css`, and sample WAV audio assets. |
| `src/main/resources/models/**` | **Analyzed** | Verified binary presence and metadata of `voice_detector_foundation.onnx` (379MB). |
| `src/main/resources/application.properties` | **Analyzed** | Extracted and verified from packaged JAR (Port 8000, 50MB multipart limit). |
| `pom.xml` | **Analyzed** | Extracted and verified Maven dependencies, Java 17 configuration, and Spring Boot plugins. |
| `frontend/**` | **Analyzed** | Verified that static assets mirror `src/main/resources/static/` for dual deployment options. |
| `dataset/LA/` & `dataset/common_voice_subset/` | **Analyzed (Metadata)** | Inspected benchmark protocol metadata and sample partitions. Skipped deep recursive reads of tens of thousands of individual raw audio files to prevent system timeout. |
| `.venv/` (Python Virtual Environment) | **Skipped** | Contains third-party pre-compiled binary packages and site-packages from prior Python prototyping; not part of active Java production runtime. |
| `tools/maven/**` | **Analyzed (Tooling)** | Verified Apache Maven 3.9.6 standalone distribution. |
| `scratch/cloudflared.exe` | **Analyzed** | Verified binary version (2026.10.0) and execution parameters for HTTPS tunneling. |
| `scratch/` (Temporary Folders) | **Analyzed** | Verified directories (`google_tts_tests`, `google_voice_dataset`, `slide_preview`) are empty working folders. |
| `target/voiceguard-ai-2.0.0.jar` | **Analyzed** | Inspected JAR manifest, archive structure, and verified live execution. |
