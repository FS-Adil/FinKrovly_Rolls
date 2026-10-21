package com.example.rolls.config;

import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.util.Timeout;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;

/**
 * Конфигурация HTTP-клиентов для взаимодействия с микросервисами
 */
@Configuration
public class WebClientConfig { // Можно оставить имя класса прежним, чтобы не ломать импорты

    @Value("${app.services.auth-service.url}")
    private String authServiceUrl;

    @Value("${app.services.rolls-service.url}")
    private String rollsServiceUrl;

    @Value("${app.services.auth-service.service-token}")
    private String authServiceToken;

    @Value("${app.services.rolls-service.service-token}")
    private String rollsServiceToken;

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
                .defaultHeader("X-Service-Name", "rolls-calculation-bff")
                .requestFactory(requestFactory)
                .build();
    }

    @Bean("rollsServiceRestClient")
    public RestClient rollsServiceRestClient(RestClient.Builder restClientBuilder) {

        var httpClient = HttpClients.custom()
                .setDefaultRequestConfig(RequestConfig.custom()
                        .setConnectTimeout(Timeout.ofSeconds(5))
                        .setResponseTimeout(Timeout.ofSeconds(30))
                        .build())
                .build();

        var factory = new HttpComponentsClientHttpRequestFactory(httpClient);

        return restClientBuilder
                .baseUrl(rollsServiceUrl)
                .defaultHeader("X-Service-Name", "rolls-calculation-bff")
                .defaultHeader("X-Service-Token", rollsServiceToken)
                .requestFactory(factory)
                .build();
    }
}
