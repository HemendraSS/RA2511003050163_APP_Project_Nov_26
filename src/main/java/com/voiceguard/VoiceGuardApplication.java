package com.voiceguard;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class VoiceGuardApplication {
    public static void main(String[] args) {
        System.out.println("============================================================");
        System.out.println(" VoiceGuard AI Forensics — Java Enterprise Edition (v2.0)");
        System.out.println(" Model: Wav2Vec2 Foundation Model (Bilingual English + Tamil)");
        System.out.println(" Web Portal & API listening on http://127.0.0.1:8000");
        System.out.println("============================================================");
        SpringApplication.run(VoiceGuardApplication.class, args);
    }
}
