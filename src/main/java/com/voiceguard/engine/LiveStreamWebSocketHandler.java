package com.voiceguard.engine;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voiceguard.dsp.AudioProcessor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.BinaryWebSocketHandler;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class LiveStreamWebSocketHandler extends BinaryWebSocketHandler {

    private final OnnxModelDetector detector;
    private final AudioProcessor audioProcessor;
    private final ObjectMapper mapper = new ObjectMapper();

    private static class SessionState {
        final List<Float> buffer = new ArrayList<>();
        int tickCount = 0;
        final List<Float> recentScores = new ArrayList<>();
    }

    private final Map<String, SessionState> sessions = new ConcurrentHashMap<>();

    @Autowired
    public LiveStreamWebSocketHandler(OnnxModelDetector detector, AudioProcessor audioProcessor) {
        this.detector = detector;
        this.audioProcessor = audioProcessor;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.put(session.getId(), new SessionState());
        Map<String, Object> handshake = new LinkedHashMap<>();
        handshake.put("type", "connection_established");
        handshake.put("message", "Connected to VoiceGuard AI Real-Time Voice Gateway (Java Spring Boot)");
        handshake.put("sample_rate", 16000);
        handshake.put("window_size_seconds", 3.0);
        session.sendMessage(new TextMessage(mapper.writeValueAsString(handshake)));
    }

    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) throws Exception {
        SessionState state = sessions.get(session.getId());
        if (state == null) return;

        ByteBuffer bb = message.getPayload().order(ByteOrder.LITTLE_ENDIAN);
        int numShorts = bb.remaining() / 2;
        if (numShorts == 0) return;

        synchronized (state.buffer) {
            for (int i = 0; i < numShorts; i++) {
                state.buffer.add(bb.getShort() / 32768.0f);
            }

            // Keep max 5 seconds (80,000 samples)
            if (state.buffer.size() > 80000) {
                state.buffer.subList(0, state.buffer.size() - 80000).clear();
            }

            // Analyze when buffer has at least 32,000 samples (2.0s)
            if (state.buffer.size() >= 32000) {
                state.tickCount++;
                long t0 = System.currentTimeMillis();

                // Extract last 48,000 to 56,000 samples (3.0s - 3.5s)
                int evalLen = Math.min(56000, state.buffer.size());
                float[] evalSegment = new float[evalLen];
                int startIdx = state.buffer.size() - evalLen;
                for (int i = 0; i < evalLen; i++) {
                    evalSegment[i] = state.buffer.get(startIdx + i);
                }

                // 75Hz High-Pass Filter
                evalSegment = audioProcessor.applyHighPassFilter(evalSegment);

                // Calculate RMS energy
                double sumSq = 0.0;
                for (float s : evalSegment) sumSq += s * s;
                double rms = Math.sqrt(sumSq / evalSegment.length);
                float bufferSec = Math.round(state.buffer.size() / 16000.0f * 10.0f) / 10.0f;

                // VAD: If silence / quiet room noise, emit LISTENING state
                if (rms < 0.010) {
                    float prevScore = state.recentScores.isEmpty() ? 0.0f : state.recentScores.get(state.recentScores.size() - 1);
                    Map<String, Object> tick = new LinkedHashMap<>();
                    tick.put("type", "telephony_tick");
                    tick.put("tick", state.tickCount);
                    tick.put("verdict", "LISTENING");
                    tick.put("confidence", 0.0);
                    tick.put("rolling_risk_score", prevScore);
                    tick.put("running_fake_prob", prevScore);
                    tick.put("window_fake_prob", 0.0);
                    tick.put("window_real_prob", 100.0);
                    tick.put("running_real_prob", Math.round((100.0f - prevScore) * 10.0f) / 10.0f);
                    tick.put("risk_tier", "SAFE");
                    tick.put("risk_level", "LOW");
                    tick.put("risk_color", "#38bdf8");
                    tick.put("inference_time_ms", 1.0);
                    tick.put("buffer_seconds", bufferSec);
                    tick.put("buffered_seconds", bufferSec);
                    tick.put("alert", "Listening for voice...");
                    session.sendMessage(new TextMessage(mapper.writeValueAsString(tick)));
                    return;
                }

                // Normalize RMS & Run ONNX Inference
                float[] normalized = audioProcessor.normalizeRms(evalSegment);
                float[] probs = detector.inferSegment(normalized);
                float fakeProb = Math.round(probs[1] * 10.0f) / 10.0f;
                float realProb = Math.round(probs[0] * 10.0f) / 10.0f;

                state.recentScores.add(fakeProb);
                if (state.recentScores.size() > 5) state.recentScores.remove(0);

                double avg = 0;
                for (float f : state.recentScores) avg += f;
                float rollingFake = (float) (Math.round((avg / state.recentScores.size()) * 10.0) / 10.0);
                float rollingReal = Math.round((100.0f - rollingFake) * 10.0f) / 10.0f;

                boolean isFake = rollingFake >= 50.0f;
                String verdict = isFake ? "AI-GENERATED" : "REAL";
                String riskTier = rollingFake >= 70.0f ? "CRITICAL" : (rollingFake >= 40.0f ? "CAUTION" : "SAFE");
                String riskColor = isFake ? "#f0525c" : "#3ecf8e";
                long latency = System.currentTimeMillis() - t0;

                Map<String, Object> tick = new LinkedHashMap<>();
                tick.put("type", "telephony_tick");
                tick.put("tick", state.tickCount);
                tick.put("verdict", verdict);
                tick.put("confidence", Math.max(rollingReal, rollingFake));
                tick.put("rolling_risk_score", rollingFake);
                tick.put("running_fake_prob", rollingFake);
                tick.put("window_fake_prob", fakeProb);
                tick.put("window_real_prob", realProb);
                tick.put("running_real_prob", rollingReal);
                tick.put("risk_tier", riskTier);
                tick.put("risk_level", isFake ? "HIGH" : "LOW");
                tick.put("risk_color", riskColor);
                tick.put("inference_time_ms", latency);
                tick.put("buffer_seconds", bufferSec);
                tick.put("buffered_seconds", bufferSec);
                tick.put("alert", isFake ? "Synthetic voice characteristics detected" : "Authentic speech detected");

                session.sendMessage(new TextMessage(mapper.writeValueAsString(tick)));
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.remove(session.getId());
    }
}
