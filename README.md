# VoiceGuard AI: Dual-Domain Real-Time Voice Cloning & Deepfake Forensic Defense System

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Version](https://img.shields.io/badge/version-2.0.0--production-blue.svg)]()
[![Java](https://img.shields.io/badge/java-17%2B%20%2F%2026-orange.svg)]()
[![Framework](https://img.shields.io/badge/spring--boot-3.2.4-green.svg)]()
[![Inference Engine](https://img.shields.io/badge/onnx--runtime-1.17.1-blueviolet.svg)]()
[![Hackathon](https://img.shields.io/badge/problem--statement-%2326104-red.svg)]()

> **Smart India Hackathon Problem Statement #26104**: AI-Powered Real-Time Detection and Prevention of Voice Cloning Impersonation Attacks.

---

## 1. Executive Summary

**VoiceGuard AI** is a production-grade cyber-defense platform engineered to detect synthetic voice clones and real-time audio deepfakes. Combining foundation deep learning with classical digital signal processing (DSP), the system defends against executive impersonation (CEO fraud), automated call-center spoofing, and distress scams across telephony and VoIP networks.

Unlike traditional audio forensic tools that inspect static file metadata or simplistic pitch filters—both of which fail against neural vocoders (HiFi-GAN, WaveGlow, BigVGAN) and zero-shot cloning architectures (ElevenLabs, VALL-E, XTTS)—VoiceGuard AI operates on a **Dual-Domain Forensic Architecture**:

1. **Domain 1: Deep Latent Space Feature Representation**  
   Evaluates raw waveform representations via a self-supervised foundation model (`Wav2Vec2_Base_ForensicHead`) running on Microsoft ONNX Runtime with native CPU/DirectML hardware acceleration.
2. **Domain 2: Physical Acoustic & Prosodic Biomechanics**  
   Tracks physical vocal tract dynamics via autocorrelation-based fundamental frequency ($f_0$) pitch tracking, pitch dynamism coefficients, voicing ratios, Butterworth 75Hz high-pass filtering, and -20 dBFS RMS normalization.
3. **Sliding-Window Telephony Streaming Gateway**  
   Processes continuous full-duplex audio over WebSockets in 3-second overlapping sliding windows with sub-100ms inference latency and zero acoustic feedback.

---

## 2. System Architecture

```
[ Audio Source ]
 (WAV / MP3 / Mic / Telephony PCM)
       │
       ▼
[ Signal Preprocessing & DSP ]
 ├── Butterworth 75Hz High-Pass Filter (DC rumble removal)
 ├── Voice Activity Detection (VAD Energy Gating)
 └── RMS Energy Normalization (-20 dBFS)
       │
       ├─────────────────────────────────┐
       ▼                                 ▼
[ Domain 1: Neural Latent ]       [ Domain 2: Biomechanical Prosody ]
 Wav2Vec 2.0 ONNX Engine           Autocorrelation Pitch Tracking (f0)
 (Microsoft ONNX Runtime Java)     Pitch Dynamism & Monotony Scorer
       │                                 │
       └────────────────┬────────────────┘
                        ▼
               [ Risk Fusion Engine ]
                ├── Rolling Risk Probability (0 - 100%)
                ├── Risk Tiers: SAFE | CAUTION | CRITICAL
                └── Real-Time Verdict: REAL vs. AI-GENERATED
                        │
       ┌────────────────┴────────────────┐
       ▼                                 ▼
[ REST API /predict ]             [ Full-Duplex WebSocket ]
 Per-clip Forensic Report          Live Telephony Sliding Window
```

---

## 3. Key Capabilities

- **Real-Time Sliding-Window Live Stream (`/ws/stream`)**: Evaluates incoming PCM 16-bit 16kHz audio in 3.0s windows with rolling risk scoring and Voice Activity Detection (VAD) silence suppression.
- **Zero-Feedback Audio Pipeline**: Web Audio API integration with an isolated zero-gain mute node preventing acoustic howlback through computer speakers during live microphone capture.
- **Dual-Domain Feature Verification**: Flags latent neural phase discrepancies and vocoder monotony even when cloned audio is masked by background noise.
- **Forensic Visualization**: Server-side Java 2D generation of false-color Mel-spectrograms (Inferno colormap) and pitch contour plots delivered via Base64 payloads.
- **Zero-Raw-Audio Persistence Policy**: Biometric voice audio resides strictly in volatile JVM memory during evaluation and is discarded immediately after analysis.
- **Hash-Synchronized Web SPA**: Clean, responsive, dark cybersecurity dashboard with hash routing supporting native browser Back/Forward navigation.

---

## 4. Repository Structure

```
voice-cloning-detector/
├── pom.xml                                    # Maven build descriptor (Java 17, Spring Boot 3, ONNX Runtime)
├── README.md                                  # Complete project documentation and run guide
├── docs/
│   ├── PROJECT_REPORT.pdf                     # Comprehensive 20-page executive project report
│   ├── PROJECT_REPORT.md                      # Complete 24-section technical report source
│   ├── PROJECT_REPORT.html                    # Interactive styled HTML companion report
│   └── SOURCE_CODE_APPENDIX.md                # 3,560-line unabridged source code appendix
├── src/
│   └── main/
│       ├── java/com/voiceguard/
│       │   ├── VoiceGuardApplication.java     # Spring Boot application bootstrap entry point
│       │   ├── config/
│       │   │   └── WebSocketConfig.java       # WebSocket routing & 1MB buffer configuration
│       │   ├── controller/
│       │   │   └── ForensicApiController.java # REST API (/health, /api/info, /predict, /predict/detailed)
│       │   ├── dsp/
│       │   │   └── AudioProcessor.java        # DSP audio decoding, 75Hz filter, RMS norm, f0 prosody
│       │   └── engine/
│       │       ├── LiveStreamWebSocketHandler.java # WebSocket real-time sliding-window engine
│       │       └── OnnxModelDetector.java     # Wav2Vec 2.0 ONNX deep learning inference engine
│       └── resources/
│           ├── application.properties         # Server port 8000, 50MB multipart limits
│           ├── models/
│           │   └── voice_detector_foundation.onnx # Pre-trained bilingual foundation model (379MB)
│           └── static/                        # Production web dashboard
│               ├── index.html                 # Single-page UI (Overview, Analyze, Stream, Report)
│               ├── assets/
│               │   ├── api.js                 # Frontend REST & WebSocket communication layer
│               │   ├── app.js                 # State management, Web Audio API DSP capture, charts
│               │   └── styles.css             # Dark cybersecurity theme styling
│               └── samples/                   # Reference evaluation WAV samples
├── frontend/                                  # Mirror distribution of static web application
└── target/
    └── voiceguard-ai-2.0.0.jar                # Production self-contained executable JAR
```

---

## 5. Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|:---:|---|
| **Core Runtime** | Java SE Development Kit (JDK) | 17+ (Java 26 verified) | High-throughput, memory-safe backend execution. |
| **Backend Framework** | Spring Boot | 3.2.4 | Embedded Tomcat, REST controllers, multipart handling. |
| **Real-Time Gateway** | Spring WebSocket (JSR-356) | 3.2.4 | Full-duplex binary PCM streaming for live voice stream. |
| **Neural Inference Engine**| Microsoft ONNX Runtime | 1.17.1 | Native C++ execution of Wav2Vec 2.0 deep learning model. |
| **Digital Signal Processing**| Custom Native Java DSP | 2.0.0 | High-pass Butterworth biquad, RMS normalization, autocorrelation pitch tracking. |
| **Graphics Engine** | Java 2D (`java.awt.Graphics2D`) | Standard JDK | Server-side Mel-spectrogram & pitch plot rendering to Base64 PNG. |
| **Frontend UI** | HTML5 / Vanilla ES6 JavaScript / CSS3 | Modern | Lightweight forensic dashboard with Web Audio API capture. |
| **Build Tool** | Apache Maven | 3.9.6 | Dependency management and executable fat JAR packaging. |

---

## 6. Quick Start & Setup Guide

### Prerequisites
- **Java Development Kit (JDK)**: Java 17 or higher (`java -version`).
- **Apache Maven**: Version 3.9+ (`mvn -version`).
- **Web Browser**: Chrome, Edge, Safari, or Firefox with microphone access.

### 1. Build from Source
```powershell
# Navigate to the project root directory
cd voice-cloning-detector

# Clean and package the self-contained executable JAR
mvn clean package -DskipTests
```

### 2. Run the Application
```powershell
# Launch the production server
java -jar target/voiceguard-ai-2.0.0.jar
```

Upon launch, the server initializes Tomcat and loads the ONNX neural model:
```
============================================================
 VoiceGuard AI Forensics — Java Enterprise Edition (v2.0)
 Model: Wav2Vec2 Foundation Model (Bilingual English + Tamil)
 Web Portal & API listening on http://127.0.0.1:8000
============================================================
[*] Initializing ONNX Runtime Java Engine...
[+] VoiceGuard AI ONNX Foundation Model loaded successfully from: src/main/resources/models/voice_detector_foundation.onnx
Tomcat started on port 8000 (http) with context path ''
```

### 3. Open in Browser
Visit **[http://localhost:8000](http://localhost:8000)** in your browser to access the forensic workstation.

---

## 7. API Reference

### 1. System Health Check
- **Endpoint**: `GET /health`
- **Response**:
```json
{
  "status": "healthy",
  "system_type": "Per-Clip Voice Authenticity Analysis (Java Spring Boot)",
  "architecture": "Wav2Vec2_Base_ForensicHead (Java ONNX Runtime)",
  "model_loaded": true,
  "device": "CPU / Native DirectML",
  "image_size": 128,
  "classes": ["real", "fake"]
}
```

### 2. System Metadata & Roadmap
- **Endpoint**: `GET /api/info`
- **Response**: Returns engine details, checkpoint validation accuracy (96.67%), and enterprise module status.

### 3. File Audio Analysis
- **Endpoint**: `POST /predict`
- **Content-Type**: `multipart/form-data`
- **Parameters**: `file` (Audio file: WAV, MP3, M4A, etc.), `sensitivity` (`balanced`, `conservative`, `aggressive`).
- **Response**:
```json
{
  "status": "success",
  "filename": "sample_recording.wav",
  "verdict": "AI-GENERATED",
  "is_fake": true,
  "confidence": 98.4,
  "real_prob": 1.6,
  "fake_prob": 98.4,
  "risk_level": "CRITICAL",
  "risk_badge": "🔴 CRITICAL RISK (SYNTHETIC CLONE)",
  "alert_message": "High synthetic probability detected. Vocal characteristics indicate neural vocoder synthesis.",
  "audio_duration_seconds": 4.2,
  "inference_time_ms": 38.0
}
```

### 4. Detailed Forensic Analysis (with Plots)
- **Endpoint**: `POST /predict/detailed`
- **Response**: Includes all fields from `/predict`, plus:
  - `spectrogram_image_base64`: Rendered Base64 PNG false-color Mel-spectrogram.
  - `prosody_plot_base64`: Rendered Base64 PNG fundamental pitch contour.
  - `prosody_analysis`: Detailed numerical acoustic metrics ($f_0$ mean, std, range, voicing ratio).
  - `windowed_inference`: Window-by-window breakdown across time slices.

### 5. Full-Duplex Real-Time Stream
- **Endpoint**: `ws://localhost:8000/ws/stream`
- **Payload**: Binary 16-bit signed PCM audio @ 16kHz (Little-Endian).
- **Stream Feedback**: Emits JSON `telephony_tick` objects every sliding window with rolling risk scores, VAD status, and instant alerts.

---

## 8. Forensic Evaluation & Accuracy

VoiceGuard AI was validated against standard synthetic speech benchmarks (ASVspoof 2019/2021, In-the-Wild deepfakes, ElevenLabs, XTTS, and VALL-E zero-shot clones):

| Metric | Score / Benchmark | Description |
|---|:---:|---|
| **Checkpoint Accuracy** | **96.67%** | Balanced bilingual validation corpus (English + Tamil). |
| **Inference Latency** | **< 45 ms** | Per-window inference execution time on standard CPU. |
| **Streaming Window** | **3.0 s** | Overlapping sliding window with 1.0s step for continuous monitoring. |
| **Minimum Pitch Range** | **65 Hz – 400 Hz** | Human vocal fold physiological tracking limits. |
| **VAD Energy Floor** | **-40 dBFS** | Threshold suppressing background silence and noise. |

---

## 9. Submission Documents & Reports

Comprehensive documentation prepared for academic, viva, and technical review:

- **Executive Project Report (PDF)**: [`docs/PROJECT_REPORT.pdf`](docs/PROJECT_REPORT.pdf) *(20 Pages, Publication-Grade Layout)*
- **Complete Technical Report (Markdown)**: [`docs/PROJECT_REPORT.md`](docs/PROJECT_REPORT.md) *(24 Sections covering Architecture, DSP, Testing, and 20 Viva Q&As)*
- **Source Code Appendix**: [`docs/SOURCE_CODE_APPENDIX.md`](docs/SOURCE_CODE_APPENDIX.md) *(3,560-line comprehensive codebase listing)*

---

## 10. License & Intellectual Property

VoiceGuard AI is engineered for cybersecurity evaluation and defense against malicious voice impersonation.  
Copyright © 2026 VoiceGuard AI Architecture & Cyber-Defense Engineering Team. All rights reserved.
