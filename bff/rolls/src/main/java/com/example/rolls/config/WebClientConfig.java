package com.example.rolls.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

/**
 * Конфигурация HTTP-клиентов для взаимодействия с микросервисами
 */
@Configuration
public class WebClientConfig { // Можно оставить имя класса прежним, чтобы не ломать импорты

    @Value("${app.services.auth-service.url}")
    private String authServiceUrl;

    @Value("${app.services.auth-service.service-token}")
    private String authServiceToken;

    /**
     * Предоставляем RestClient вместо WebClient.
     * Внедряемый RestClient.Builder уже укомплектован трассировкой Brave со стороны Spring Boot.
     */
    @Bean("authServiceRestClient")
    public RestClient authServiceRestClient(RestClient.Builder restClientBuilder) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        // Настройка таймаутов (эквивалент настроек Netty)
        requestFactory.setConnectTimeout((int) Duration.ofSeconds(5).toMillis());
        requestFactory.setReadTimeout((int) Duration.ofSeconds(30).toMillis());

        return restClientBuilder
                .baseUrl(authServiceUrl)
                .defaultHeader("X-Service-Token", authServiceToken)
                .defaultHeader("X-Service-Name", "cost-calculation-bff")
                .requestFactory(requestFactory)
                .build();
    }
}
