package com.example.rolls.client;

import com.example.rolls.dto.RollResponseDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class RollsServiceClient {

    private final RestClient rollsServiceRestClient;

    public RollsServiceClient(@Qualifier("rollsServiceRestClient") RestClient rollsServiceRestClient) {
        this.rollsServiceRestClient = rollsServiceRestClient;
    }

    /**
     * Аутентификация пользователя
     */
    public List<RollResponseDto> getRolls(String email) {
        try {
            // В логах ниже уже будет присутствовать корректный traceId!
            log.info("Попытка получить список рулон из прокси сервера: {}", email);

            return rollsServiceRestClient
                    .get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/v1/mobile/roll/get-all")
                            .queryParam("userName", email)
                            .build())
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<RollResponseDto>>() {});// Автоматически блокирует поток и возвращает объект
        } catch (RestClientException e) {
            log.error("Ошибка при получении рулонов для {}", email, e);
            return List.of();
        }
    }

}
