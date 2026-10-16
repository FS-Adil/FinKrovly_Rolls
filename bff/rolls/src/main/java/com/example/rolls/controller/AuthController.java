package com.example.rolls.controller;

import com.example.rolls.client.AuthServiceClient;
import com.example.rolls.dto.ApiResponse;
import com.example.rolls.dto.LoginRequest;
import com.example.rolls.util.SecurityUtils;
import com.example.rolls.util.TracerUtil;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthServiceClient authServiceClient;
    private final TracerUtil tracerUtil;

    @Operation(summary = "Аутентификация", description = "Отправка логина и пароля")
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        Map<String, Object> data = new HashMap<>();
        ObjectMapper mapper = new ObjectMapper();

        try {

            // Валидация и санитизация входных данных
            String email = SecurityUtils.validateEmail(request.email());
            if (email == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                        ApiResponse.error(tracerUtil.currentTraceId(), 500,"Некорректный формат email")
                );
            }

            JsonNode root = mapper.valueToTree(
                    authServiceClient.authenticate(email, request.password())
            );

            String orgName = root.path("data").path("organization").path("name").asString();
            String orgId = root.path("data").path("organization").path("id").asString();
            String token = root.path("data").path("accessToken").asString();
            String userEmail = root.path("data").path("user").path("email").asString();
            String userId = root.path("data").path("user").path("id").asString();
            String userRole = root.path("data").path("user").path("role").asString();

            data.put("user", Map.of(
                    "id", userId,
                    "email", userEmail,
                    "role", userRole
            ));
            data.put("organization", Map.of(
                    "id", orgId,
                    "name", orgName
            ));
            data.put("accessToken", token);

            log.info("Аутентификация прошла успешна: {}", email);
            return ResponseEntity.status(HttpStatus.OK).body(
                    ApiResponse.success(tracerUtil.currentTraceId(), data)
            );
        } catch (Exception e) {

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    ApiResponse.error(tracerUtil.currentTraceId(), 500, "Внутренняя ошибка сервера")
            );
        }
    }
}
