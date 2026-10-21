package com.example.rolls.controller;

import com.example.rolls.client.AuthServiceClient;
import com.example.rolls.dto.ApiResponse;
import com.example.rolls.dto.LoginRequest;
import com.example.rolls.model.UserContext;
import com.example.rolls.service.CookieService;
import com.example.rolls.service.SessionService;
import com.example.rolls.util.SecurityUtils;
import com.example.rolls.util.TracerUtil;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    @Value("${app.services.auth-service.url}")
    private String authServiceUrl;

    private final AuthServiceClient authServiceClient;
    private final TracerUtil tracerUtil;
    private final SessionService sessionService;
    private final CookieService cookieService;
    private final ObjectMapper objectMapper;


    @Operation(summary = "Аутентификация", description = "Отправка логина и пароля")
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        Map<String, Object> data = new HashMap<>();

        try {

            // Валидация и санитизация входных данных
            String email = SecurityUtils.validateEmail(request.email());
            if (email == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                        ApiResponse.error(tracerUtil.currentTraceId(), 500, "Некорректный формат email")
                );
            }

            JsonNode root = objectMapper.valueToTree(
                    authServiceClient.authenticate(email, request.password())
            );

            if (root.isNull()) {
                log.error("Сервер авторизации по адресу >> {} << не доступен!", authServiceUrl);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                        ApiResponse.error(tracerUtil.currentTraceId(), 404, "Сервер авторизации не доступен!")
                );
            }

            String orgName = root.path("data").path("organization").path("name").asString();
            String orgId = root.path("data").path("organization").path("id").asString();
            String userEmail = root.path("data").path("user").path("email").asString();
            Long userId = root.path("data").path("user").path("id").asLong();
            String userRole = root.path("data").path("user").path("role").asString();

            // Создаем сессию в BFF
            String sessionId = sessionService.createSession(
                    userId,
                    userEmail,
                    userRole,
                    orgId,
                    orgName,
                    httpRequest.getHeader("X-Device-Fingerprint"),
                    httpRequest.getHeader("User-Agent"),
                    httpRequest.getRemoteAddr()
            );

            // Устанавливаем session_id в HttpOnly cookie с префиксом __Host-
            cookieService.setSessionCookie(httpResponse, sessionId, 1800);

            data.put("user", Map.of(
                    "id", userId,
                    "email", userEmail,
                    "role", userRole
            ));
            data.put("organization", Map.of(
                    "id", orgId,
                    "name", orgName
            ));

            log.info("Аутентификация прошла успешно: {}", email);
            return ResponseEntity.status(HttpStatus.OK).body(
                    ApiResponse.success(tracerUtil.currentTraceId(), data)
            );
        } catch (Exception e) {
            log.error("Login failed for email: {}", request.email(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    ApiResponse.error(tracerUtil.currentTraceId(), 500, "Внутренняя ошибка сервера")
            );
        }
    }

    /**
     * Проверка текущей сессии.
     * Поддерживает cookie __Host-session_id.
     */
    @GetMapping("/me")
    public ResponseEntity<?> me(HttpServletRequest request) {
        try {
            // BFF сам определяет identity из сессии
            UserContext userContext = sessionService.getUserContext(request);

            log.info("User context: userId={}, email={}, role={}",
                    userContext.userId(), userContext.email(), userContext.role());

            Map<String, Object> data = new HashMap<>();

            data.put("user", Map.of(
                    "id", userContext.userId(),
                    "email", userContext.email(),
                    "role", userContext.role()
            ));
            data.put("organization", Map.of(
                    "id", userContext.organizationId(),
                    "name", userContext.organizationName()
            ));

            return ResponseEntity.status(HttpStatus.OK).body(
                    ApiResponse.success(tracerUtil.currentTraceId(), data)
            );

        } catch (SessionService.SessionNotFoundException e) {
            log.error("Session not found: {}", e.getMessage());
            return ResponseEntity.status(401).body(
                    ApiResponse.error(tracerUtil.currentTraceId(), 401, "Сессия не найдена или истекла")
            );
        } catch (SecurityException e) {
            log.warn("Security violation: {}", e.getMessage());
            return ResponseEntity.status(401).body(
                    ApiResponse.error(tracerUtil.currentTraceId(), 401, "Сессия недействительна")
            );
        }
    }

    /**
     * Обновление сессии.
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request, HttpServletResponse response) {
        try {
            // Проверяем текущую сессию
            var userContext = sessionService.getUserContext(request);

            String oldSessionId = cookieService.readSessionId(request);

            // Создаем новую сессию
            String newSessionId = sessionService.createSession(
                    userContext.userId(),
                    userContext.email(),
                    userContext.role(),
                    userContext.organizationId(),
                    userContext.organizationName(),
                    request.getHeader("X-Device-Fingerprint"),
                    request.getHeader("User-Agent"),
                    request.getRemoteAddr()
            );

            if (oldSessionId != null && !oldSessionId.equals(newSessionId)) {
                sessionService.deleteSession(oldSessionId);               // ✅ удаляем старую
            }

            // Устанавливаем новую cookie
            cookieService.setSessionCookie(response, newSessionId, 1800);

            log.info("Session refreshed: newSessionId={}", newSessionId);

            return ResponseEntity.status(HttpStatus.OK).body(
                    ApiResponse.success(tracerUtil.currentTraceId(),
                            Map.of(
                                    "message", "Tokens refreshed"
                            )
                    )
            );

        } catch (SessionService.SessionNotFoundException e) {
            return ResponseEntity.status(401).body(
                    ApiResponse.error(tracerUtil.currentTraceId(), 401, "Сессия истекла")
            );
        }
    }

    /**
     * Выход из системы.
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        // Извлекаем sessionId из cookie
        String sessionId = extractSessionId(request);

        if (sessionId == null) {
            return ResponseEntity.status(500).body(
                    ApiResponse.error(tracerUtil.currentTraceId(), 500, "Не удалось найти sessionId для удаления")
            );
        }

        sessionService.deleteSession(sessionId);
        log.info("Session deleted: {}", sessionId);

        // Очищаем cookies
        cookieService.clearAuthCookies(response);

        return ResponseEntity.status(200).body(
                ApiResponse.success(tracerUtil.currentTraceId(), Map.of(
                        "message", "Сессия удалена!"
                ))
        );
    }

    /**
     * Извлекает sessionId из cookie __Host-session_id.
     */
    private String extractSessionId(HttpServletRequest request) {
        return cookieService.readSessionId(request);
    }
}