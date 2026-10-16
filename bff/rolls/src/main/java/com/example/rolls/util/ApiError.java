package com.example.rolls.util;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

/**
 * Одна ошибка.
 * field — имя поля формы на фронте (может быть null для общих ошибок).
 * code  — машиночитаемый код (для i18n и логики фронта).
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiError {

    /** Имя поля, к которому относится ошибка. null — общая ошибка. */
    private final String field;

    /** Машиночитаемый код: VALIDATION_ERROR, NOT_FOUND, ACCESS_DENIED ... */
    private final String code;

    /** Человекочитаемое сообщение (можно локализовать на бэке) */
    private final String message;

    /** Отклонённое значение (осторожно с PII!) */
    private final Object rejectedValue;

    public static ApiError of(String field, String code, String message) {
        return ApiError.builder()
                .field(field)
                .code(code)
                .message(message)
                .build();
    }
}
