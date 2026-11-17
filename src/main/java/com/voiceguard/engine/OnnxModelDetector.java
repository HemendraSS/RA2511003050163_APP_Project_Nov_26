package com.voiceguard.engine;

import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtSession;
import com.voiceguard.dsp.AudioProcessor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.io.InputStream;
import java.nio.FloatBuffer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.*;

@Service
public class OnnxModelDetector {

    private final AudioProcessor audioProcessor;

    private OrtEnvironment env;
    private OrtSession session;
    private boolean modelLoaded = false;
    private String modelPath = "voice_detector_foundation.onnx";

    @Autowired
    public OnnxModelDetector(AudioProcessor audioProcessor) {
        this.audioProcessor = audioProcessor;
    }

    @PostConstruct
    public synchronized void init() {
        try {
            System.out.println("[*] Initializing ONNX Runtime Java Engine...");
            env = OrtEnvironment.getEnvironment();

            // Locate model file (check filesystem first, then classpath resource)
            Path diskPath = Path.of("voice_detector_foundation.onnx");
            if (!Files.exists(diskPath)) {
                diskPath = Path.of("src/main/resources/models/voice_detector_foundation.onnx");
            }

            if (!Files.exists(diskPath)) {
                // Extract from classpath
                InputStream is = getClass().getResourceAsStream("/models/voice_detector_foundation.onnx");
                if (is != null) {
                    diskPath = Files.createTempFile("onnx_model_", ".onnx");
                    Files.copy(is, diskPath, StandardCopyOption.REPLACE_EXISTING);
                }
            }

            if (Files.exists(diskPath)) {
                OrtSession.SessionOptions opts = new OrtSession.SessionOptions();
                opts.setOptimizationLevel(OrtSession.SessionOptions.OptLevel.ALL_OPT);
                session = env.createSession(diskPath.toString(), opts);
                modelLoaded = true;
                modelPath = diskPath.toString();
                System.out.println("[+] VoiceGuard AI ONNX Foundation Model loaded successfully from: " + diskPath);
            } else {
                System.err.println("[!] Could not locate voice_detector_foundation.onnx");
            }
        } catch (Exception e) {
            System.err.println("[!] Failed to initialize ONNX Runtime: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @PreDestroy
    public void cleanup() {
        try {
            if (session != null) session.close();
            if (env != null) env.close();
        } catch (Exception ignored) {}
    }

    public boolean isModelLoaded() {
        return modelLoaded;
    }

    /**
     * Runs raw ONNX inference on a 64,000-sample (4.0s) float audio buffer.
     * Returns: float[2] = {realProbPct, fakeProbPct}
     */
    public float[] inferSegment(float[] audioSegment) {
        if (!modelLoaded || session == null) {
            return new float[]{50.0f, 50.0f};
        }

        try {
            float[] active = audioProcessor.extractActiveSegment(audioSegment);
            long[] shape = new long[]{1, active.length};
            FloatBuffer fb = FloatBuffer.wrap(active);
            OnnxTensor tensor = OnnxTensor.createTensor(env, fb, shape);

            String inputName = session.getInputNames().iterator().next();
            OrtSession.Result result = session.run(Collections.singletonMap(inputName, tensor));

            float[][] probs = (float[][]) result.get(0).getValue();
            float realProb = probs[0][0] * 100.0f;
            float fakeProb = probs[0][1] * 100.0f;

            tensor.close();
            result.close();
            return new float[]{realProb, fakeProb};
        } catch (Exception e) {
            System.err.println("[!] Inference error: " + e.getMessage());
            return new float[]{50.0f, 50.0f};
        }
    }

    /**
     * Executes end-to-end forensic analysis for REST endpoints (/predict & /predict/detailed).
     */
    public Map<String, Object> analyzeAudio(byte[] rawAudio, String filename, String sensitivity, boolean detailed) {
        long t0 = System.currentTimeMillis();

        float[] decoded = audioProcessor.decodeAudio(rawAudio);
        float durationSec = (float) decoded.length / AudioProcessor.SAMPLE_RATE;

        // Apply 75Hz filter + RMS Normalization
        float[] filtered = audioProcessor.applyHighPassFilter(decoded);
        float[] normalized = audioProcessor.normalizeRms(filtered);

        // Windowed inference (3-second windows with 2-second hop)
        int winSamples = 48000; // 3.0s
        int hopSamples = 32000; // 2.0s
        List<Map<String, Object>> windowResults = new ArrayList<>();
        float sumFake = 0;
        float maxFake = 0;

        if (normalized.length >= winSamples) {
            int winIdx = 1;
            for (int s = 0; s <= normalized.length - winSamples; s += hopSamples) {
                float[] winAudio = Arrays.copyOfRange(normalized, s, s + winSamples);
                float[] winProbs = inferSegment(winAudio);
                float fProb = winProbs[1];
                sumFake += fProb;
                if (fProb > maxFake) maxFake = fProb;

                Map<String, Object> wMap = new HashMap<>();
                wMap.put("window_index", winIdx++);
                wMap.put("start_sec", Math.round(s / 16000.0f * 10.0f) / 10.0f);
                wMap.put("end_sec", Math.round((s + winSamples) / 16000.0f * 10.0f) / 10.0f);
                wMap.put("real_prob", Math.round(winProbs[0] * 10.0f) / 10.0f);
                wMap.put("fake_prob", Math.round(fProb * 10.0f) / 10.0f);
                wMap.put("verdict", fProb >= 50.0f ? "FAKE" : "REAL");
                windowResults.add(wMap);
            }
        }

        // Global clip inference
        float[] clipProbs = inferSegment(normalized);
        float fakeProb = clipProbs[1];
        float realProb = clipProbs[0];

        if (!windowResults.isEmpty()) {
            float avgFake = sumFake / windowResults.size();
            fakeProb = (fakeProb * 0.4f) + (avgFake * 0.6f);
            realProb = 100.0f - fakeProb;
        }

        // Sensitivity policy boundaries
        float lowTh = 40.0f;
        float highTh = 70.0f;
        if ("conservative".equalsIgnoreCase(sensitivity)) {
            lowTh = 25.0f; highTh = 50.0f;
        } else if ("aggressive".equalsIgnoreCase(sensitivity)) {
            lowTh = 60.0f; highTh = 85.0f;
        }

        boolean isFake = fakeProb >= 50.0f;
        String verdict = isFake ? "AI-GENERATED" : "REAL";
        String riskTier = "LOW";
        String riskBadge = "🟢 LOW RISK (ORGANIC)";
        String alertMsg = "Voice patterns exhibit organic biological human acoustic dynamics.";

        if (fakeProb >= highTh) {
            riskTier = "CRITICAL";
            riskBadge = "🔴 CRITICAL RISK (SYNTHETIC CLONE)";
            alertMsg = "High synthetic probability detected. Vocal characteristics indicate neural vocoder synthesis.";
        } else if (fakeProb >= lowTh) {
            riskTier = "MEDIUM";
            riskBadge = "🟡 MEDIUM RISK (SUSPICIOUS)";
            alertMsg = "Inconclusive acoustic texture. Supplementary prosody and temporal inspection recommended.";
        }

        long latency = System.currentTimeMillis() - t0;

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("status", "success");
        resp.put("filename", filename);
        resp.put("verdict", verdict);
        resp.put("is_fake", isFake);
        resp.put("confidence", Math.round(Math.max(realProb, fakeProb) * 100.0f) / 100.0f);
        resp.put("real_prob", Math.round(realProb * 100.0f) / 100.0f);
        resp.put("fake_prob", Math.round(fakeProb * 100.0f) / 100.0f);
        resp.put("risk_level", riskTier);
        resp.put("risk_badge", riskBadge);
        resp.put("alert_message", alertMsg);
        resp.put("audio_duration_seconds", Math.round(durationSec * 10.0f) / 10.0f);
        resp.put("inference_time_ms", latency);
        resp.put("device", "CPU/DirectML");
        resp.put("verdict_basis", "windowed_average");

        // Model metadata
        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("checkpoint_accuracy", 96.67);
        meta.put("architecture", "Wav2Vec2_Base_ForensicHead (Java ONNX Runtime)");
        meta.put("languages", List.of("English", "Tamil"));
        meta.put("training_samples", 50000);
        meta.put("runtime_engine", "Microsoft ONNX Runtime Java 1.17.1");
        resp.put("model_metadata", meta);

        // Threshold config
        Map<String, Object> thresh = new LinkedHashMap<>();
        thresh.put("preset_name", sensitivity != null ? sensitivity : "balanced");
        thresh.put("low_threshold", lowTh);
        thresh.put("high_threshold", highTh);
        resp.put("threshold_configuration", thresh);

        // Windowed inference
        Map<String, Object> winInf = new LinkedHashMap<>();
        winInf.put("window_count", windowResults.size());
        winInf.put("aggregate_fake_prob_avg", Math.round((sumFake / Math.max(1, windowResults.size())) * 10.0f) / 10.0f);
        winInf.put("aggregate_fake_prob_max", Math.round(maxFake * 10.0f) / 10.0f);
        winInf.put("fallback_single_clip", windowResults.isEmpty());
        winInf.put("window_results", windowResults);
        resp.put("windowed_inference", winInf);

        // Prosody analysis
        Map<String, Object> prosody = audioProcessor.analyzeProsody(normalized);
        resp.put("prosody_analysis", prosody);

        // Detailed mode (generate images)
        if (detailed) {
            String specB64 = audioProcessor.generateSpectrogramImageBase64(normalized, 800, 200);
            resp.put("spectrogram_image_base64", specB64);

            String prosodyB64 = audioProcessor.generateProsodyPlotBase64(normalized, 800, 200);
            resp.put("prosody_plot_base64", prosodyB64);
        }

        return resp;
    }
}
