package com.example.rolls.controller;

import com.example.rolls.client.RollsServiceClient;
import com.example.rolls.dto.ApiResponse;
import com.example.rolls.dto.LoginRequest;
import com.example.rolls.dto.RollRequestDto;
import com.example.rolls.dto.RollResponseDto;
import com.example.rolls.model.UserContext;
import com.example.rolls.service.SessionService;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class RollsController {

    @Value("${app.services.rolls-service.url}")
    private String rollsServiceUrl;

    private final RollsServiceClient rollsServiceClient;
    private final SessionService sessionService;
    private final TracerUtil tracerUtil;

    @Operation(summary = "Отчет о Рулонах", description = "Получить данные о рулонах из 1С")
    @PostMapping("/rolls")
    public ResponseEntity<?> getRolls(HttpServletRequest request) {

        UserContext userContext = sessionService.getUserContext(request);

        List<RollRequestDto> list = new ArrayList<>();

        List<RollResponseDto> root;
        root = rollsServiceClient.getRolls(userContext.email());

        if (root.isEmpty()) {
            log.error("Сервер рулонов по адресу >> {} << не доступен!", rollsServiceUrl);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    ApiResponse.error(tracerUtil.currentTraceId(), 404, "Сервер рулонов не доступен!")
            );
        }

        log.info("Список рулон из прокси сервера получен!");

        for (RollResponseDto dto : root) {
            list.add(
                    RollRequestDto.builder()
                            .name(dto.getName())
                            .manufacturer(dto.getManufacturer())
                            .organization(dto.getOrganization())
                            .batch(dto.getBatch())
                            .pricePerTon(dto.getPricePerTon())
                            .pricePerSquareMeter(dto.getPricePerSquareMeter())
                            .areaSquareMeters(dto.getAreaSquareMeters())
                            .weightTons(dto.getWeightTons())
                            .batchDate(dto.getBatchDate())
                            .build()
            );
        }

        return ResponseEntity.status(200).body(
                ApiResponse.success(tracerUtil.currentTraceId(), Map.of("rows", list))
                );
    }
}
