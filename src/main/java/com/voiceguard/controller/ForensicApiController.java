package com.voiceguard.controller;

import com.voiceguard.engine.OnnxModelDetector;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@RestController
@CrossOrigin(origins = "*")
public class ForensicApiController {

    private final OnnxModelDetector detector;

    @Autowired
    public ForensicApiController(OnnxModelDetector detector) {
        this.detector = detector;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("status", "healthy");
        resp.put("system_type", "Per-Clip Voice Authenticity Analysis (Java Spring Boot)");
        resp.put("architecture", "Wav2Vec2_Base_ForensicHead (Java ONNX Runtime)");
        resp.put("model_loaded", detector.isModelLoaded());
        resp.put("device", "CPU / Native DirectML");
        resp.put("image_size", 128);
        resp.put("classes", List.of("real", "fake"));
        return ResponseEntity.ok(resp);
    }

    @GetMapping({"/api/info", "/info"})
    public ResponseEntity<Map<String, Object>> systemInfo() {
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("product", "VoiceGuard AI Forensics Platform (Java Enterprise Edition)");
        resp.put("system_type", "Dual-Domain Voice Forensic Analysis Engine (Java + ONNX)");
        resp.put("version", "2.0.0");
        resp.put("active_device", "Java JVM Native / ONNX Runtime");
        resp.put("model_architecture", "Wav2Vec2_Base_ForensicHead");
        resp.put("model_validation_accuracy", 96.67);

        Map<String, Object> roadmap = new LinkedHashMap<>();
        roadmap.put("telecom_voip_stream_analysis", "Active Live Risk Monitoring WebSocket Engine (/ws/stream) in Java Netty.");
        roadmap.put("multilingual_regional_accents", "Trained on 50,000-sample balanced English and Tamil dataset.");
        roadmap.put("java_enterprise_runtime", "Pure Java Spring Boot 3 server with Microsoft ONNX Runtime execution.");
        roadmap.put("cross_session_speaker_verification", "Planned V2 Module. Voice biometrics against enrolled genuine profiles.");
        resp.put("enterprise_v2_roadmap_modules", roadmap);

        return ResponseEntity.ok(resp);
    }

    @PostMapping(value = "/predict", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> predict(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "sensitivity", defaultValue = "balanced") String sensitivity
    ) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("detail", "Uploaded file is empty."));
        }
        try {
            byte[] bytes = file.getBytes();
            Map<String, Object> result = detector.analyzeAudio(bytes, file.getOriginalFilename(), sensitivity, false);
            return ResponseEntity.ok(result);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", "Error reading file: " + e.getMessage()));
        }
    }

    @PostMapping(value = "/predict/detailed", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> predictDetailed(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "sensitivity", defaultValue = "balanced") String sensitivity
    ) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("detail", "Uploaded file is empty."));
        }
        try {
            byte[] bytes = file.getBytes();
            Map<String, Object> result = detector.analyzeAudio(bytes, file.getOriginalFilename(), sensitivity, true);
            return ResponseEntity.ok(result);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", "Error reading file: " + e.getMessage()));
        }
    }
}
