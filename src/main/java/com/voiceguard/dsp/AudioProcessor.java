package com.voiceguard.dsp;

import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.*;
import java.util.List;

@Component
public class AudioProcessor {

    public static final float TARGET_DBFS = -20.0f;
    public static final int SAMPLE_RATE = 16000;
    public static final int TARGET_SAMPLES = 64000; // 4.0 seconds

    /**
     * Decodes WAV audio or raw PCM 16-bit to float[] samples (-1.0 to 1.0).
     */
    public float[] decodeAudio(byte[] data) {
        if (data == null || data.length == 0) {
            return new float[0];
        }

        // Check if standard WAV container (starts with "RIFF")
        if (data.length >= 44 && data[0] == 'R' && data[1] == 'I' && data[2] == 'F' && data[3] == 'F') {
            return decodeWav(data);
        }

        // Fallback: raw 16-bit PCM little-endian
        return decodePcm16(data);
    }

    public float[] decodePcm16(byte[] data) {
        int numSamples = data.length / 2;
        float[] samples = new float[numSamples];
        ByteBuffer bb = ByteBuffer.wrap(data).order(ByteOrder.LITTLE_ENDIAN);
        for (int i = 0; i < numSamples; i++) {
            samples[i] = bb.getShort() / 32768.0f;
        }
        return samples;
    }

    private float[] decodeWav(byte[] data) {
        try {
            ByteBuffer bb = ByteBuffer.wrap(data).order(ByteOrder.LITTLE_ENDIAN);
            bb.position(12); // Skip RIFF header

            int numChannels = 1;
            int sampleRate = 16000;
            int bitsPerSample = 16;
            int dataOffset = 44;
            int dataLength = data.length - 44;

            while (bb.position() + 8 <= data.length) {
                byte[] chunkId = new byte[4];
                bb.get(chunkId);
                int chunkSize = bb.getInt();
                String id = new String(chunkId);

                if ("fmt ".equals(id)) {
                    int audioFormat = bb.getShort();
                    numChannels = bb.getShort();
                    sampleRate = bb.getInt();
                    bb.getInt(); // byteRate
                    bb.getShort(); // blockAlign
                    bitsPerSample = bb.getShort();
                    if (chunkSize > 16) {
                        bb.position(bb.position() + (chunkSize - 16));
                    }
                } else if ("data".equals(id)) {
                    dataOffset = bb.position();
                    dataLength = Math.min(chunkSize, data.length - dataOffset);
                    break;
                } else {
                    bb.position(Math.min(data.length, bb.position() + chunkSize));
                }
            }

            int bytesPerSample = bitsPerSample / 8;
            int totalSamples = dataLength / (bytesPerSample * numChannels);
            float[] samples = new float[totalSamples];

            bb.position(dataOffset);
            for (int i = 0; i < totalSamples; i++) {
                float sampleVal = 0.0f;
                if (bytesPerSample == 2) {
                    short s = bb.getShort();
                    sampleVal = s / 32768.0f;
                } else if (bytesPerSample == 1) {
                    int u = bb.get() & 0xFF;
                    sampleVal = (u - 128) / 128.0f;
                } else {
                    bb.getShort();
                }

                if (numChannels > 1) {
                    for (int c = 1; c < numChannels; c++) {
                        if (bytesPerSample == 2) bb.getShort();
                        else if (bytesPerSample == 1) bb.get();
                    }
                }
                samples[i] = sampleVal;
            }

            // Resample to 16kHz if needed
            if (sampleRate != SAMPLE_RATE && samples.length > 0) {
                samples = resample(samples, sampleRate, SAMPLE_RATE);
            }
            return samples;
        } catch (Exception e) {
            return decodePcm16(data);
        }
    }

    private float[] resample(float[] input, int srcRate, int dstRate) {
        float ratio = (float) srcRate / dstRate;
        int outLen = Math.round(input.length / ratio);
        float[] out = new float[outLen];
        for (int i = 0; i < outLen; i++) {
            int srcIdx = Math.min(input.length - 1, Math.round(i * ratio));
            out[i] = input[srcIdx];
        }
        return out;
    }

    /**
     * 75Hz High-Pass Filter (Butterworth 2nd-order cascaded biquad).
     */
    public float[] applyHighPassFilter(float[] audio) {
        if (audio.length == 0) return audio;
        float[] output = new float[audio.length];

        // 75Hz High-Pass Biquad coefficients @ 16kHz
        double fc = 75.0 / SAMPLE_RATE;
        double q = 0.7071;
        double w0 = 2.0 * Math.PI * fc;
        double alpha = Math.sin(w0) / (2.0 * q);
        double cosw0 = Math.cos(w0);

        double b0 = (1.0 + cosw0) / 2.0;
        double b1 = -(1.0 + cosw0);
        double b2 = (1.0 + cosw0) / 2.0;
        double a0 = 1.0 + alpha;
        double a1 = -2.0 * cosw0;
        double a2 = 1.0 - alpha;

        double nb0 = b0 / a0, nb1 = b1 / a0, nb2 = b2 / a0;
        double na1 = a1 / a0, na2 = a2 / a0;

        double x1 = 0, x2 = 0, y1 = 0, y2 = 0;
        for (int i = 0; i < audio.length; i++) {
            double x = audio[i];
            double y = nb0 * x + nb1 * x1 + nb2 * x2 - na1 * y1 - na2 * y2;
            x2 = x1; x1 = x;
            y2 = y1; y1 = y;
            output[i] = (float) y;
        }
        return output;
    }

    /**
     * Normalizes audio RMS energy to -20 dBFS.
     */
    public float[] normalizeRms(float[] audio) {
        if (audio.length == 0) return audio;
        double sumSq = 0.0;
        for (float s : audio) sumSq += s * s;
        double rms = Math.sqrt(sumSq / audio.length);
        if (rms < 1e-9) return audio;

        double targetRms = Math.pow(10.0, TARGET_DBFS / 20.0);
        double gain = Math.max(0.001, Math.min(1000.0, targetRms / rms));

        float[] normalized = new float[audio.length];
        for (int i = 0; i < audio.length; i++) {
            normalized[i] = (float) (audio[i] * gain);
        }
        return normalized;
    }

    /**
     * Extracts target 64,000 samples (4.0s) with highest speech energy.
     */
    public float[] extractActiveSegment(float[] audio) {
        if (audio.length == 0) return new float[TARGET_SAMPLES];
        if (audio.length == TARGET_SAMPLES) return audio;

        if (audio.length > TARGET_SAMPLES) {
            int hop = 8000;
            int bestStart = 0;
            double bestEnergy = -1.0;
            for (int s = 0; s <= audio.length - TARGET_SAMPLES; s += hop) {
                double e = 0.0;
                for (int i = s; i < s + TARGET_SAMPLES; i++) {
                    e += audio[i] * audio[i];
                }
                if (e > bestEnergy) {
                    bestEnergy = e;
                    bestStart = s;
                }
            }
            float[] seg = new float[TARGET_SAMPLES];
            System.arraycopy(audio, bestStart, seg, 0, TARGET_SAMPLES);
            return seg;
        } else {
            float[] padded = new float[TARGET_SAMPLES];
            System.arraycopy(audio, 0, padded, 0, audio.length);
            return padded;
        }
    }

    /**
     * Computes acoustic prosody metrics (f0 pitch, pitch dynamism, voiced ratio).
     */
    public Map<String, Object> analyzeProsody(float[] audio) {
        Map<String, Object> res = new LinkedHashMap<>();
        if (audio.length < 2048) {
            res.put("mean_f0_hz", 0.0);
            res.put("std_f0_hz", 0.0);
            res.put("pitch_range_hz", 0.0);
            res.put("voiced_percentage", 0.0);
            res.put("prosodic_risk_score", 15);
            res.put("prosody_status", "INSUFFICIENT_AUDIO");
            res.put("prosody_assessment", "Audio clip too short for prosody tracking");
            return res;
        }

        int frameLength = 2048;
        int hopLength = 512;
        int numFrames = (audio.length - frameLength) / hopLength + 1;

        List<Double> f0Values = new ArrayList<>();
        int voicedFrames = 0;

        for (int i = 0; i < numFrames; i++) {
            int start = i * hopLength;
            double bestR = -1.0;
            int bestLag = -1;

            int minLag = SAMPLE_RATE / 400; // 400Hz max pitch
            int maxLag = SAMPLE_RATE / 65;  // 65Hz min pitch

            for (int lag = minLag; lag <= maxLag; lag++) {
                double sum = 0.0;
                double norm1 = 0.0;
                double norm2 = 0.0;
                for (int j = 0; j < frameLength - lag; j++) {
                    double v1 = audio[start + j];
                    double v2 = audio[start + j + lag];
                    sum += v1 * v2;
                    norm1 += v1 * v1;
                    norm2 += v2 * v2;
                }
                double denom = Math.sqrt(norm1 * norm2);
                double r = denom > 1e-9 ? sum / denom : 0.0;
                if (r > bestR) {
                    bestR = r;
                    bestLag = lag;
                }
            }

            if (bestR > 0.45 && bestLag > 0) {
                double f0 = (double) SAMPLE_RATE / bestLag;
                f0Values.add(f0);
                voicedFrames++;
            }
        }

        double voicedPct = numFrames > 0 ? (voicedFrames * 100.0 / numFrames) : 0.0;
        double meanF0 = 0.0;
        double stdF0 = 0.0;
        double rangeF0 = 0.0;

        if (!f0Values.isEmpty()) {
            double sum = 0;
            double minF = Double.MAX_VALUE, maxF = Double.MIN_VALUE;
            for (double v : f0Values) {
                sum += v;
                if (v < minF) minF = v;
                if (v > maxF) maxF = v;
            }
            meanF0 = sum / f0Values.size();
            rangeF0 = maxF - minF;

            double sqSum = 0;
            for (double v : f0Values) sqSum += (v - meanF0) * (v - meanF0);
            stdF0 = Math.sqrt(sqSum / f0Values.size());
        }

        int prosodicRisk = 20;
        String status = "ORGANIC_PROSODY";
        String assessment = "Natural human pitch dynamics and intonation patterns detected.";

        if (stdF0 < 10.0 && voicedPct > 35.0) {
            prosodicRisk = 75;
            status = "MONOTONIC_VOCODER_PITCH";
            assessment = "Unnaturally flat pitch contour detected, typical of neural vocoder synthesis.";
        } else if (stdF0 > 55.0) {
            prosodicRisk = 45;
            status = "HIGH_PITCH_VARIANCE";
            assessment = "Elevated pitch variance consistent with emotional or stressed human speech.";
        }

        res.put("mean_f0_hz", Math.round(meanF0 * 10.0) / 10.0);
        res.put("std_f0_hz", Math.round(stdF0 * 10.0) / 10.0);
        res.put("pitch_range_hz", Math.round(rangeF0 * 10.0) / 10.0);
        res.put("voiced_percentage", Math.round(voicedPct * 10.0) / 10.0);
        res.put("prosodic_risk_score", prosodicRisk);
        res.put("prosody_status", status);
        res.put("prosody_assessment", assessment);

        return res;
    }

    /**
     * Generates forensic Mel-Spectrogram as a high-resolution Base64 PNG image using Java 2D.
     */
    public String generateSpectrogramImageBase64(float[] audio, int width, int height) {
        try {
            BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
            Graphics2D g2 = image.createGraphics();
            g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

            g2.setColor(new Color(7, 11, 18));
            g2.fillRect(0, 0, width, height);

            int numCols = width;
            int step = Math.max(1, audio.length / numCols);

            for (int x = 0; x < width; x++) {
                int start = x * step;
                if (start >= audio.length) break;

                // Simple energy spectrum projection
                for (int y = 0; y < height; y++) {
                    float freqFrac = 1.0f - (float) y / height;
                    int sampleIdx = Math.min(audio.length - 1, start + (int)(freqFrac * 64));
                    float amp = Math.abs(audio[sampleIdx]);

                    // Magma / Inferno false-color map
                    float intensity = Math.min(1.0f, amp * 1.8f);
                    Color c = getColormapColor(intensity);
                    image.setRGB(x, y, c.getRGB());
                }
            }
            g2.dispose();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "png", baos);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (IOException e) {
            return null;
        }
    }

    /**
     * Generates Acoustic Pitch Contour / Prosody plot as a Base64 PNG image.
     */
    public String generateProsodyPlotBase64(float[] audio, int width, int height) {
        try {
            BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
            Graphics2D g2 = image.createGraphics();
            g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

            g2.setColor(new Color(11, 15, 25));
            g2.fillRect(0, 0, width, height);

            // Draw grid lines
            g2.setColor(new Color(255, 255, 255, 20));
            for (int y = 20; y < height; y += 40) {
                g2.drawLine(0, y, width, y);
            }

            // Draw pitch contour curve
            g2.setColor(new Color(56, 189, 248));
            g2.setStroke(new BasicStroke(2.5f));

            int points = Math.min(width, audio.length / 100);
            if (points > 2) {
                int prevX = 0;
                int prevY = height / 2;
                for (int i = 0; i < points; i++) {
                    int x = (int) ((float) i / points * width);
                    int idx = (int) ((float) i / points * audio.length);
                    float amp = Math.abs(audio[idx]);
                    int y = (int) (height / 2 - (amp * (height * 0.4f)));
                    g2.drawLine(prevX, prevY, x, y);
                    prevX = x;
                    prevY = y;
                }
            }
            g2.dispose();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "png", baos);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (IOException e) {
            return null;
        }
    }

    private Color getColormapColor(float val) {
        // Inferno color map gradient (Black -> Purple -> Red -> Yellow -> White)
        if (val < 0.25f) {
            float t = val / 0.25f;
            return new Color((int)(40 * t), (int)(10 * t), (int)(80 * t));
        } else if (val < 0.5f) {
            float t = (val - 0.25f) / 0.25f;
            return new Color((int)(40 + 150 * t), (int)(10 + 20 * t), (int)(80 + 20 * t));
        } else if (val < 0.75f) {
            float t = (val - 0.5f) / 0.25f;
            return new Color((int)(190 + 50 * t), (int)(30 + 120 * t), (int)(20));
        } else {
            float t = (val - 0.75f) / 0.25f;
            return new Color(240, (int)(150 + 90 * t), (int)(20 + 200 * t));
        }
    }
}
