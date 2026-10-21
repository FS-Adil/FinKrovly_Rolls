package com.example.rolls.controller;

import com.example.rolls.dto.LoginRequest;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class RollsController {

    @Operation(summary = "Отчет о Рулонах", description = "Получить данные о рулонах из 1С")
    @PostMapping("/rolls")
    public ResponseEntity<?> getRolls() {

        return ResponseEntity.status(200).body(Map.of("rows", List.of(
                Map.of(
                        "id", "1",
                        "name", "Тестовый рулон",
                        "organization", "ООО Тест",
                        "manufacturer", "Завод №1",
                        "batch", "B-001",
                        "pricePerSquareMeter", 150,
                        "pricePerTon", 45000,
                        "areaSquareMeters", 1200,
                        "weightTons", 0.85,
                        "batchDate", "2026-01-15"
                )
        )));

    }
}
