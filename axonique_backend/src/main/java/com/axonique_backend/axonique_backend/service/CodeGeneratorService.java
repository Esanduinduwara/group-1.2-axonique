package com.axonique_backend.axonique_backend.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

@Service
public class CodeGeneratorService {
    private static final SecureRandom random = new SecureRandom();
    private static final Map<String, CodeData> activeCodes = new HashMap<>();

    public String generateCode(String userId, int expirationMinutes){
        String code = String.format("%06d", random.nextInt(1000000));
        LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(expirationMinutes);

        activeCodes.put(userId, new CodeData(code, expiryTime));
        return code;
    }

    public boolean validateCode(String userId, String code) {
        CodeData data = activeCodes.get(userId);
        
        if (data == null) {
            return false;
        }
        
        if (LocalDateTime.now().isAfter(data.expiryTime)) {
            activeCodes.remove(userId);
            return false;
        }
        
        boolean isValid = data.code.equals(code);
        if (isValid) {
            activeCodes.remove(userId); // Remove after successful validation
        }
        
        return isValid;
    }

    private static class CodeData {
        String code;
        LocalDateTime expiryTime;
        
        CodeData(String code, LocalDateTime expiryTime) {
            this.code = code;
            this.expiryTime = expiryTime;
        }
    }
}
