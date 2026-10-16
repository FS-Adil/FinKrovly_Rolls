package com.example.rolls.dto;

import com.example.rolls.util.ApiError;
import com.example.rolls.util.Meta;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.List;

/**
 * Единый формат ответа API.
 * Все эндпоинты возвращают этот объект — фронт всегда знает, что ожидать.
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)// null-поля не попадают в JSON
public class ApiResponse<T> {

    /** success | error */
    private final String status;

    /** HTTP-код (дублируется в теле для удобства фронта) */
    private final int code;

    /** Короткое человекочитаемое сообщение */
    private final String message;

    /** Сами данные */
    private final T data;

    /** Метаданные (пагинация, время выполнения, traceId) */
    private final Meta meta;

    /** Ошибки валидации / бизнес-ошибки (только при status=error) */
    private final List<ApiError> errors;

    /** ID запроса для трассировки в логах */
    private final String traceId;

    /** Момент формирования ответа */
    private final Instant timestamp;

    // ---------- Фабричные методы ----------

    public static <T> ApiResponse<T> success(String traceId, T data) {
        return ApiResponse.<T>builder()
                .status("success")
                .code(200)
                .message("OK")
                .data(data)
                .traceId(traceId)
                .timestamp(Instant.now())
                .build();
    }

    public static <T> ApiResponse<T> success(String traceId, T data, Meta meta) {
        return ApiResponse.<T>builder()
                .status("success")
                .code(200)
                .message("OK")
                .data(data)
                .meta(meta)
                .traceId(traceId)
                .timestamp(Instant.now())
                .build();
    }

    public static <T> ApiResponse<T> created(String traceId, T data) {
        return ApiResponse.<T>builder()
                .status("success")
                .code(201)
                .message("Created")
                .data(data)
                .traceId(traceId)
                .timestamp(Instant.now())
                .build();
    }

    public static <T> ApiResponse<T> error(String traceId, int code, String message, List<ApiError> errors) {
        return ApiResponse.<T>builder()
                .status("error")
                .code(code)
                .message(message)
                .errors(errors)
                .traceId(traceId)
                .timestamp(Instant.now())
                .build();
    }

    public static <T> ApiResponse<T> error(String traceId, int code, String message) {
        return error(traceId, code, message, null);
    }
}
