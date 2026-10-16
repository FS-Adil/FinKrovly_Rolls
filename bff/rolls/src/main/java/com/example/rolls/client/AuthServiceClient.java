package com.example.rolls.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Клиент для взаимодействия с Auth Service на базе RestClient
 */
@Slf4j
@Component
public class AuthServiceClient {

    private final RestClient authServiceRestClient;

    public AuthServiceClient(@Qualifier("authServiceRestClient") RestClient authServiceRestClient) {
        this.authServiceRestClient = authServiceRestClient;
    }

    /**
     * Аутентификация пользователя
     */
    public Map<?, ?> authenticate(String email, String password) {
        try {
            // В логах ниже уже будет присутствовать корректный traceId!
            log.info("Попытка аутентификации пользователя: {}", email);

            return authServiceRestClient
                    .post()
                    .uri("/api/rolls/auth/login")
                    .body(Map.of("email", email, "password", password))
                    .retrieve()
                    .body(Map.class); // Автоматически блокирует поток и возвращает объект
        } catch (Exception e) {
            log.error("Ошибка при аутентификации в Auth Service: {}", e.getMessage());
            return null;
        }
    }
}
