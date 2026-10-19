package com.example.rolls.model;

/**
 * Контекст пользователя для передачи в микросервисы
 *
 * Решает проблемы:
 * 1. Передача identity пользователя в Cost Service
 * 2. Иммутабельность
 * 3. Минимальный набор данных
 *
 * ВАЖНО: Это НЕ токен! Микросервис доверяет BFF.
 */
public record UserContext(
        Long userId,
        String organizationId,
        String organizationName,
        String role,
        String email
) {
    /**
     * Создание контекста из сессии
     */
    public static UserContext fromSession(UserSession session) {
        return new UserContext(
                session.getUserId(),
                session.getOrganizationId(),
                session.getOrganizationName(),
                session.getRole(),
                session.getEmail()
        );
    }
}
